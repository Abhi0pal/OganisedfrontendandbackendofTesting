import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, user_type } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ResponseHelper } from '../../common/response.helper';
import { MailService } from '../mail/mail.service';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
const MIN_NMC_REGISTRATION_AGE = 18;
const NMC_EXTERNAL_PROVIDER = 'NMC';

type UserLogType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'REGISTER'
  | 'ACCOUNT_DEACTIVATED'
  | 'ACCOUNT_REACTIVATED'
  | 'EMAIL_VERIFICATION_SENT'
  | 'EMAIL_VERIFIED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED';

type RegistrationContext = {
  tenantId: number | null;
  projectId: number | null;
};

type VerificationDispatchReason = 'register' | 'resend';
type RegistrationOtpPurpose = 'NMC_REGISTER_OTP';

function generateIuid(): string {
  const n = Math.floor(10_000_000 + Math.random() * 89_999_999);
  return String(n);
}

const userBaseSelect = {
  id: true,
  email: true,
  password_hash: true,
  salt: true,
  user_type: true,
  role_id: true,
  tenant_id: true,
  project_id: true,
  is_email_verified: true,
  last_login_at: true,
  deleted_at: true,
};

const roleSelect = {
  id: true,
  name: true,
};

const tenantSelect = {
  slug: true,
  name: true,
  logo_url: true,
  availableThemes: true,
};

const assignmentSelect = {
  tenant_id: true,
  project_id: true,
  tenant: {
    select: tenantSelect,
  },
};

const investorProfileSelect = {
  id: true,
  uid: true,
  username: true,
  first_name: true,
  last_name: true,
  gender: true,
  date_of_birth: true,
  pan_card: true,
  adhaar_number: true,
  mobile_number: true,
  country_name: true,
  state_name: true,
  city_name: true,
  district_name: true,
  pin_code: true,
  address: true,
  legal_entity_name: true,
  cons_pan_card: true,
  cons_first_name: true,
  cons_last_name: true,
  cons_mobile_number: true,
  cons_email: true,
  cons_country_name: true,
  cons_state_name: true,
};

const departmentUserSelect = {
  id: true,
  full_name: true,
  email: true,
  mobile: true,
  dept_id: true,
  district_id: true,
  office_id: true,
};

const authUserSelect = {
  ...userBaseSelect,
  investor_profile: {
    select: investorProfileSelect,
  },
  department_user: {
    select: departmentUserSelect,
  },
  role: {
    select: roleSelect,
  },
  tenant: {
    select: tenantSelect,
  },
  assignments: {
    where: { is_active: true },
    orderBy: { valid_from: 'desc' as const },
    take: 1,
    select: assignmentSelect,
  },
};

const registrationExistingUserSelect = {
  ...userBaseSelect,
  investor_profile: {
    select: {
      id: true,
    },
  },
  department_user: {
    select: {
      id: true,
    },
  },
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const registrationUserType = this.resolveRegistrationUserType(dto);
    const registrationContext = this.resolveRegistrationContext(dto);
    const isNmcRegistration = dto.tenant?.toLowerCase() === 'nmc';

    this.validateCommonRegistrationData(dto);
    this.assertRegistrationOtpVerified(dto);
    if (registrationUserType === 'DEPARTMENT') {
      this.validateDepartmentRegistrationData(dto);
    }

    const existing = await this.prisma.users.findFirst({
      where: { email: dto.email, deleted_at: null },
      select: registrationExistingUserSelect,
    });

    const canResumeExistingRegistration =
      !!existing &&
      ((registrationUserType === 'INVESTOR' && !existing.investor_profile) ||
        (registrationUserType === 'DEPARTMENT' && !existing.department_user));

    if (existing) {
      if (!canResumeExistingRegistration && existing.is_email_verified === 0) {
        throw new ConflictException('EMAIL_EXISTS_UNVERIFIED');
      }

      if (!canResumeExistingRegistration) {
        throw new ConflictException('Email already exists');
      }
    }

    const existingMobileUser = await this.findExistingUserByMobile(dto.mobile);
    if (
      existingMobileUser &&
      (!existing || existingMobileUser.id !== existing.id)
    ) {
      throw new ConflictException('Mobile already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const roleId = await this.resolveRegistrationRoleId(dto);

    if (isNmcRegistration) {
      await this.syncNmcCitizenAccount(dto);
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const persistedUser =
        existing && canResumeExistingRegistration
          ? await tx.users.update({
              where: { id: existing.id },
              data: {
                email: dto.email,
                password_hash: passwordHash,
                password_algo: 'argon2',
                user_type: registrationUserType,
                is_email_verified: this.getInitialEmailVerificationStatus(),
                role_id: roleId,
                tenant_id: registrationContext.tenantId,
                project_id: registrationContext.projectId,
              },
              select: userBaseSelect,
            })
          : await tx.users.create({
              data: {
                email: dto.email,
                password_hash: passwordHash,
                password_algo: 'argon2',
                user_type: registrationUserType,
                is_email_verified: this.getInitialEmailVerificationStatus(),
                role_id: roleId,
                tenant_id: registrationContext.tenantId,
                project_id: registrationContext.projectId,
              },
              select: userBaseSelect,
            });

      if (registrationUserType === 'DEPARTMENT') {
        await this.createDepartmentUserIfMissing(persistedUser.id, dto, tx);
      } else {
        await this.createInvestorProfileIfMissing(
          persistedUser.id,
          dto,
          registrationContext,
          tx,
        );
      }

      return persistedUser;
    });
    await this.logUserEvent(
      user.id,
      user.email,
      'REGISTER',
      'User registered',
      registrationUserType,
    );
    const activationDispatch = await this.dispatchActivationLink(user, 'register');

    return {
      accessToken: await this.generateToken(user),
      user: this.mapUserResponse(user),
      ...(isNmcRegistration
        ? { redirectUrl: this.getNmcCitizenLoginUrl() }
        : {}),
      ...activationDispatch,
    };
  }

  async sendRegistrationOtp(mobile?: string, tenant?: string) {
    this.assertNmcOtpTenant(tenant);
    const mobileDigits = this.requireOtpMobile(mobile);

    await this.sendNmcRegistrationOtp(mobileDigits);

    return ResponseHelper.success('OTP sent successfully');
  }

  async verifyRegistrationOtp(mobile?: string, otp?: string, tenant?: string) {
    this.assertNmcOtpTenant(tenant);
    const mobileDigits = this.requireOtpMobile(mobile);
    const normalizedOtp = this.requireOtpCode(otp);

    const isVerified = await this.verifyNmcRegistrationOtp(
      mobileDigits,
      normalizedOtp,
    );

    if (!isVerified) {
      throw new BadRequestException('Invalid OTP. Please try again.');
    }

    return ResponseHelper.success('OTP verified successfully', {
      otpVerificationToken: this.buildRegistrationOtpVerificationToken(
        mobileDigits,
      ),
    });
  }

  async validateNmcToken(accessToken?: string) {
    const normalizedAccessToken = (accessToken || '').trim();

    if (!normalizedAccessToken) {
      throw new BadRequestException('accessToken is required.');
    }

    const payload = await this.requestNmcTokenValidationPayload(
      normalizedAccessToken,
    );
    await this.touchExternalAuthSessionByAccessToken(
      NMC_EXTERNAL_PROVIDER,
      normalizedAccessToken,
    );

    return ResponseHelper.success('NMC token validated successfully', payload);
  }

  async bootstrapNmcSession(accessToken?: string, refreshToken?: string) {
    const normalizedAccessToken = (accessToken || '').trim();
    const normalizedRefreshToken = (refreshToken || '').trim();

    if (!normalizedAccessToken) {
      throw new BadRequestException('accessToken is required.');
    }

    const validationPayload = await this.requestNmcTokenValidationPayload(
      normalizedAccessToken,
    );
    const user = await this.findUserForBapLogout(
      this.extractUserIdentifiersFromNmcPayload(validationPayload),
    );

    if (!user) {
      throw new UnauthorizedException(
        'No linked BAP account found for the provided NMC token.',
      );
    }

    await this.syncExternalAuthSessionFromValidatedToken(
      user.id,
      normalizedAccessToken,
      validationPayload,
      {
        refreshToken: normalizedRefreshToken || null,
      },
    );

    await this.prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
      select: { id: true },
    });

    await this.logUserEvent(
      user.id,
      user.email,
      'LOGIN_SUCCESS',
      'User logged in via validated NMC token',
      user.user_type,
    );

    const sessionData = await this.buildAuthenticatedSessionData(user.id);

    return ResponseHelper.success('NMC session bootstrapped successfully', {
      accessToken: await this.generateToken(sessionData.userRecord),
      user: sessionData.user,
      profile: sessionData.profile,
      resources: sessionData.resources,
    });
  }

  async getNmcAccessToken(body: {
    username?: string;
    password?: string;
    userName?: string;
    tenantId?: string;
    scope?: string;
    userType?: string;
  }) {
    const username = (body.username || '').trim();
    const password = body.password || '';

    if (!username) {
      throw new BadRequestException('username is required.');
    }

    if (!password) {
      throw new BadRequestException('password is required.');
    }

    const params = new URLSearchParams();
    params.set('grant_type', 'password');
    params.set('userName', body.userName?.trim() || '');
    params.set('password', password);
    params.set('username', username);
    params.set('userType', body.userType?.trim() || this.getNmcTokenUserType());
    params.set('tenantId', body.tenantId?.trim() || this.getNmcTokenTenantId());
    params.set('scope', body.scope?.trim() || this.getNmcTokenScope());

    const payload = await this.postFormToNmcTokenService(params);
    await this.syncExternalAuthSessionFromNmcTokenPayload(payload);

    return ResponseHelper.success('NMC access token fetched successfully', payload);
  }

  async refreshNmcAccessToken(refreshToken?: string) {
    const normalizedRefreshToken = (refreshToken || '').trim();

    if (!normalizedRefreshToken) {
      throw new BadRequestException('refreshToken is required.');
    }

    const payload = await this.requestNmcRefreshTokenPayload(
      normalizedRefreshToken,
    );
    await this.syncExternalAuthSessionFromNmcTokenPayload(payload, {
      refreshTokenHint: normalizedRefreshToken,
    });

    return ResponseHelper.success('NMC access token refreshed successfully', payload);
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.prisma.users.findFirst({
        where: { email: dto.email, deleted_at: null },
        select: authUserSelect,
      });

      if (!user) {
        await this.logUserEvent(
          null,
          dto.email,
          'LOGIN_FAILED',
          'User not found',
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      if (user.is_email_verified === 0) {
        await this.logUserEvent(
          user.id,
          user.email,
          'LOGIN_FAILED',
          'Email not verified',
        );
        throw new UnauthorizedException('Email not verified');
      }

      if (!user.password_hash) {
        await this.logUserEvent(
          user.id,
          user.email,
          'LOGIN_FAILED',
          'Password not set',
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      const passwordValid = await bcrypt.compare(
        dto.password,
        user.password_hash,
      );

      if (!passwordValid) {
        await this.logUserEvent(
          user.id,
          user.email,
          'LOGIN_FAILED',
          'Invalid password',
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.prisma.users.update({
        where: { id: user.id },
        data: { last_login_at: new Date() },
        select: { id: true },
      });

      await this.logUserEvent(
        user.id,
        user.email,
        'LOGIN_SUCCESS',
        'User logged in',
      );

      const resources = user.role_id
        ? await this.getResourcesForRole(user.role_id)
        : [];

      return ResponseHelper.success('Login successful', {
        accessToken: await this.generateToken(user),
        user: this.mapUserResponse(user),
        profile: this.mapProfile(user),
        resources,
      });
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        return ResponseHelper.error(error.message);
      }
      return ResponseHelper.error('Login failed', {
        message: error.message,
        stack:
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  async getCurrentUser(userId: bigint) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: authUserSelect,
    });

    if (!user || user.deleted_at) {
      throw new UnauthorizedException('User not found');
    }

    const resources = user.role_id
      ? await this.getResourcesForRole(user.role_id)
      : [];

    return {
      user: this.mapUserResponse(user),
      profile: this.mapProfile(user),
      resources,
    };
  }

  async updateCurrentInvestorProfile(userId: bigint, dto: UpdateProfileDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        ...userBaseSelect,
        investor_profile: {
          select: investorProfileSelect,
        },
      },
    });

    if (!user || user.deleted_at) {
      throw new UnauthorizedException('User not found');
    }

    if (user.user_type !== 'INVESTOR' || !user.investor_profile) {
      throw new BadRequestException('Profile update is only available for investor accounts');
    }

    await this.prisma.investor_profiles.update({
      where: { user_id: userId },
      data: {
        ...(dto.firstName !== undefined && { first_name: dto.firstName.trim() }),
        ...(dto.lastName !== undefined && { last_name: dto.lastName.trim() }),
        ...(dto.countryName !== undefined && { country_name: dto.countryName.trim() }),
        ...(dto.stateName !== undefined && { state_name: dto.stateName.trim() }),
        ...(dto.cityName !== undefined && { city_name: dto.cityName.trim() }),
        ...(dto.districtName !== undefined && { district_name: dto.districtName.trim() }),
        ...(dto.pinCode !== undefined && { pin_code: dto.pinCode.trim() }),
        ...(dto.address !== undefined && { address: dto.address.trim() }),
        ...(dto.dateOfBirth !== undefined && {
          date_of_birth: dto.dateOfBirth.trim()
            ? this.parseDateOnly(dto.dateOfBirth)
            : null,
        }),
        ...(dto.panCard !== undefined && { pan_card: dto.panCard.trim() || null }),
        ...(dto.adhaarNumber !== undefined && { adhaar_number: dto.adhaarNumber.trim() || null }),
        ...(dto.legalEntityName !== undefined && {
          legal_entity_name: dto.legalEntityName.trim() || null,
        }),
        ...(dto.consPanCard !== undefined && {
          cons_pan_card: dto.consPanCard.trim() || null,
        }),
        ...(dto.consFirstName !== undefined && {
          cons_first_name: dto.consFirstName.trim() || null,
        }),
        ...(dto.consLastName !== undefined && {
          cons_last_name: dto.consLastName.trim() || null,
        }),
        ...(dto.consCountryName !== undefined && {
          cons_country_name: dto.consCountryName.trim() || null,
        }),
        ...(dto.consStateName !== undefined && {
          cons_state_name: dto.consStateName.trim() || null,
        }),
      },
    });

    return ResponseHelper.success('Profile updated successfully');
  }

  async changePassword(userId: bigint, dto: ChangePasswordDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: userBaseSelect,
    });

    if (!user || user.deleted_at) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.password_hash) {
      throw new BadRequestException('Password update is not available for this account');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password_hash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.users.update({
      where: { id: userId },
      data: {
        password_hash: passwordHash,
        salt,
      },
      select: { id: true },
    });

    return ResponseHelper.success('Password updated successfully');
  }

  async logoutCurrentSession(accessToken?: string, currentUser?: any) {
    const nmcLogoutResult = currentUser?.id
      ? await this.logoutNmcSessionForUser(BigInt(currentUser.id))
      : { attempted: false, completed: false, message: null as string | null };
    const revoked = await this.revokeAccessSessionFromJwt(accessToken);

    if (currentUser?.id) {
      await this.logUserEvent(
        BigInt(currentUser.id),
        currentUser.email ?? null,
        'LOGOUT',
        this.buildLogoutEventDescription(revoked, nmcLogoutResult),
        currentUser.userType ?? 'INVESTOR',
      );
    }

    return ResponseHelper.success('Logged out successfully', {
      revoked,
      nmcLogoutAttempted: nmcLogoutResult.attempted,
      nmcLogoutCompleted: nmcLogoutResult.completed,
    });
  }

  async logoutFromBap(body: { accessToken?: string }) {
    const normalizedAccessToken = (body.accessToken || '').trim();

    if (!normalizedAccessToken) {
      throw new BadRequestException('accessToken is required.');
    }

    const payload = await this.requestNmcTokenValidationPayload(
      normalizedAccessToken,
    );
    const user = await this.findUserForBapLogout(
      this.extractUserIdentifiersFromNmcPayload(payload),
    );

    if (!user) {
      return ResponseHelper.success('No matching local session found.', {
        matched: false,
        revokedSessions: 0,
      });
    }

    const revokedSessions = await this.revokeAllActiveSessionsForUser(user.id);
    await this.revokeExternalAuthSessionForUser(user.id, NMC_EXTERNAL_PROVIDER);

    await this.logUserEvent(
      user.id,
      user.email,
      'LOGOUT',
      'Session revoked by BAP logout webhook using validated NMC token',
      user.user_type,
    );

    return ResponseHelper.success('Local session revoked successfully.', {
      matched: true,
      revokedSessions,
    });
  }

  async logoutNmcSession(accessToken?: string) {
    const normalizedAccessToken = this.normalizeString(accessToken);

    if (!normalizedAccessToken) {
      throw new BadRequestException('accessToken is required.');
    }

    const payload = await this.postToNmcLogoutService(normalizedAccessToken);
    await this.revokeExternalAuthSessionByAccessToken(
      normalizedAccessToken,
      NMC_EXTERNAL_PROVIDER,
    );

    return ResponseHelper.success('NMC session logged out successfully.', payload);
  }

  async getNmcDashboardLaunch(userId: bigint) {
    const accessToken = await this.resolveNmcAccessTokenForUser(userId, {
      allowUnvalidatedFallback: true,
    });

    return ResponseHelper.success(
      'NMC dashboard launch payload generated successfully.',
      {
        targetUrl: this.getNmcCitizenDashboardUrl(),
        payload: {
          RequestInfo: this.buildNmcAuthenticatedRequestInfo(accessToken),
        },
      },
    );
  }

  private async generateToken(user: any): Promise<string> {
    const sessionId = uuidv4();
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      userType: user.user_type,
      jti: sessionId,
    };
    const token = this.jwtService.sign(payload);

    await this.prisma.user_tokens.create({
      data: {
        user_id: user.id,
        token_hash: this.hashSessionIdentifier(sessionId),
        token_type: 'SSO_EXTERNAL',
        expires_at: this.buildAccessTokenExpiryDate(),
      },
    });

    return token;
  }

  private getJwtExpirationSeconds() {
    const configuredValue = parseInt(process.env.JWT_EXPIRATION || '3600', 10);
    return Number.isFinite(configuredValue) && configuredValue > 0
      ? configuredValue
      : 3600;
  }

  private buildAccessTokenExpiryDate() {
    return new Date(Date.now() + this.getJwtExpirationSeconds() * 1000);
  }

  private async buildAuthenticatedSessionData(userId: bigint) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: authUserSelect,
    });

    if (!user || user.deleted_at) {
      throw new UnauthorizedException('User not found');
    }

    const resources = user.role_id
      ? await this.getResourcesForRole(user.role_id)
      : [];

    return {
      userRecord: user,
      user: this.mapUserResponse(user),
      profile: this.mapProfile(user),
      resources,
    };
  }

  private hashSessionIdentifier(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private async revokeAccessSessionFromJwt(accessToken?: string | null) {
    const token = (accessToken || '').trim();

    if (!token) {
      return false;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      }) as { jti?: string };
      const sessionId = payload?.jti?.trim();

      if (!sessionId) {
        return false;
      }

      const result = await this.prisma.user_tokens.updateMany({
        where: {
          token_hash: this.hashSessionIdentifier(sessionId),
          token_type: 'SSO_EXTERNAL',
          used_at: null,
        },
        data: {
          used_at: new Date(),
        },
      });

      return result.count > 0;
    } catch {
      return false;
    }
  }

  private async revokeAllActiveSessionsForUser(userId: bigint) {
    const result = await this.prisma.user_tokens.updateMany({
      where: {
        user_id: userId,
        token_type: 'SSO_EXTERNAL',
        used_at: null,
      },
      data: {
        used_at: new Date(),
      },
    });

    return result.count;
  }

  private async findUserForBapLogout(criteria: {
    username?: string | null;
    mobile?: string | null;
  }) {
    if (criteria.username) {
      const profile = await this.prisma.investor_profiles.findFirst({
        where: {
          username: {
            equals: criteria.username,
            mode: 'insensitive',
          },
          user: {
            deleted_at: null,
          },
        },
        select: {
          user: {
            select: userBaseSelect,
          },
        },
      });

      if (profile?.user) {
        return profile.user;
      }
    }

    if (criteria.mobile) {
      return this.findExistingUserByMobile(criteria.mobile);
    }

    return null;
  }

  private extractUserIdentifiersFromNmcPayload(payload: any): {
    username?: string | null;
    mobile?: string | null;
  } {
    const candidates = [
      payload,
      payload?.user,
      payload?.User,
      payload?.userInfo,
      payload?.UserInfo,
      payload?.data?.user,
      payload?.data?.User,
      payload?.data?.userInfo,
      payload?.data?.UserInfo,
    ].filter(Boolean);

    for (const candidate of candidates) {
      const normalized = Array.isArray(candidate) ? candidate[0] : candidate;

      if (!normalized || typeof normalized !== 'object') {
        continue;
      }

      const username = this.normalizeString(
        normalized.userName ??
          normalized.username ??
          normalized.user_name ??
          null,
      );
      const mobile = this.toMobileDigits(
        normalized.mobileNumber ??
          normalized.mobile ??
          normalized.mobile_number ??
          null,
      );

      if (username || mobile) {
        return {
          username: username || null,
          mobile: mobile || null,
        };
      }
    }

    throw new BadRequestException(
      'Unable to identify applicant from validated NMC token.',
    );
  }

  private normalizeString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private mapUserResponse(user: any) {
    const activeAssignment = Array.isArray(user.assignments) ? user.assignments[0] : null;
    const tenant = activeAssignment?.tenant ?? user.tenant ?? null;
    const tenantId = activeAssignment?.tenant_id ?? user.tenant_id ?? null;
    const projectId = activeAssignment?.project_id ?? user.project_id ?? null;
    const tenantSource = activeAssignment?.tenant_id ? 'assignment' : user.tenant_id ? 'user' : null;

    return {
      id: user.id.toString(),
      email: user.email,
      userType: user.user_type,
      isEmailVerified: user.is_email_verified,
      lastLoginAt: user.last_login_at,
      roleId: user.role_id,
      roleName: user.role?.name,
      tenantId: tenantId ? Number(tenantId) : null,
      projectId: projectId ? Number(projectId) : null,
      tenantSlug: tenant?.slug ?? null,
      tenantName: tenant?.name ?? null,
      logoUrl: tenant?.logo_url ?? null,
      availableThemes: tenant?.availableThemes ?? [],
      tenantSource,
      userTenantId: user.tenant_id ? Number(user.tenant_id) : null,
      userProjectId: user.project_id ? Number(user.project_id) : null,
      assignmentTenantId: activeAssignment?.tenant_id ? Number(activeAssignment.tenant_id) : null,
      assignmentProjectId: activeAssignment?.project_id ? Number(activeAssignment.project_id) : null,
    };
  }

  private mapProfile(user: any) {
    if (user.user_type === 'INVESTOR' && user.investor_profile) {
      return {
        id: user.investor_profile.id.toString(),
        username: user.investor_profile.username,
        firstName: user.investor_profile.first_name,
        lastName: user.investor_profile.last_name,
        gender: user.investor_profile.gender,
        panCard: user.investor_profile.pan_card,
        adhaarNumber: user.investor_profile.adhaar_number,
        mobileNumber: user.investor_profile.mobile_number?.toString(),
        countryName: user.investor_profile.country_name,
        stateName: user.investor_profile.state_name,
        cityName: user.investor_profile.city_name,
        districtName: user.investor_profile.district_name,
        pinCode: user.investor_profile.pin_code,
        address: user.investor_profile.address,
        dateOfBirth: user.investor_profile.date_of_birth,
        legalEntityName: user.investor_profile.legal_entity_name,
        consPanCard: user.investor_profile.cons_pan_card,
        consFirstName: user.investor_profile.cons_first_name,
        consLastName: user.investor_profile.cons_last_name,
        consMobileNumber: user.investor_profile.cons_mobile_number,
        consEmail: user.investor_profile.cons_email,
        consCountryName: user.investor_profile.cons_country_name,
        consStateName: user.investor_profile.cons_state_name,
      };
    }
    if (user.user_type === 'DEPARTMENT' && user.department_user) {
      return {
        id: user.department_user.id.toString(),
        fullName: user.department_user.full_name,
        email: user.department_user.email,
        mobile: user.department_user.mobile,
        deptId: user.department_user.dept_id,
        districtId: user.department_user.district_id,
        officeId: user.department_user.office_id,
      };
    }
    return null;
  }

  private async createInvestorProfileIfMissing(
    userId: bigint,
    dto: RegisterDto,
    registrationContext: RegistrationContext,
    db: any = this.prisma,
  ) {
    const existing = await db.investor_profiles.findUnique({
      where: { user_id: userId },
    });
    if (existing) return;
    await db.investor_profiles.create({
      data: {
        user_id: userId,
        uid: generateIuid(),
        username: dto.username?.trim() || null,
        first_name: dto.firstName,
        last_name: dto.lastName,
        gender: dto.gender?.trim() || null,
        country_name: dto.country || '',
        state_name: dto.state || '',
        city_name: '',
        district_name: dto.district || '',
        pin_code: dto.pinCode || '',
        address: dto.address || '',
        mobile_number: dto.mobile ? BigInt(dto.mobile) : BigInt(0),
        date_of_birth:
          registrationContext.tenantId === 5 && dto.dateOfBirth
            ? this.parseDateOnly(dto.dateOfBirth)
            : null,
        pan_card: dto.pan || null,
        legal_entity_name: dto.legalEntityName || null,
        cons_pan_card: dto.cons_pan || null,
        cons_first_name: dto.cons_fullName
          ? dto.cons_fullName.split(' ')[0]
          : null,
        cons_last_name: dto.cons_fullName
          ? dto.cons_fullName.split(' ').slice(1).join(' ') || '.'
          : null,
        cons_mobile_number: dto.cons_mobile || null,
        cons_email: dto.cons_email || null,
        cons_country_name: dto.cons_country || null,
        cons_state_name: dto.cons_state || null,
        project_id: registrationContext.projectId
          ? String(registrationContext.projectId)
          : null,
      },
    });
  }

  private async createDepartmentUserIfMissing(
    userId: bigint,
    dto: RegisterDto,
    db: any = this.prisma,
  ) {
    const existing = await db.department_users.findUnique({
      where: { user_id: userId },
    });
    if (existing) return;

    await db.department_users.create({
      data: {
        user_id: userId,
        full_name: `${dto.firstName} ${dto.lastName}`.trim(),
        email: dto.email,
        mobile: dto.mobile || null,
        dept_id: 1,
        district_id: null,
        tahsil_id: 0,
        circle_id: null,
        block_id: 0,
        office_id: 0,
        division_id: 0,
        status: 1,
      },
    });
  }

  private validateDepartmentRegistrationData(dto: RegisterDto) {
    const fullName = `${dto.firstName} ${dto.lastName}`.trim();

    if (fullName.length > 60) {
      throw new BadRequestException(
        'ULB full name must be 60 characters or fewer.',
      );
    }

    if (dto.email.length > 128) {
      throw new BadRequestException(
        'ULB email must be 128 characters or fewer.',
      );
    }

    if ((dto.mobile?.length ?? 0) > 16) {
      throw new BadRequestException(
        'ULB mobile number must be 16 characters or fewer.',
      );
    }
  }

  private validateCommonRegistrationData(dto: RegisterDto) {
    const fullName = `${dto.firstName} ${dto.lastName === '.' ? '' : dto.lastName}`.trim();

    if (!fullName) {
      throw new BadRequestException('Full name is required.');
    }

    if (fullName.length > 60) {
      throw new BadRequestException(
        'Full name must be 60 characters or fewer.',
      );
    }

    if (dto.email.length > 128) {
      throw new BadRequestException(
        'Email must be 128 characters or fewer.',
      );
    }

    if (dto.mobile && !/^\d{10}$/.test(dto.mobile.trim())) {
      throw new BadRequestException(
        'Mobile number must be exactly 10 digits.',
      );
    }

    if (dto.tenant?.toLowerCase() === 'nmc' && !dto.dateOfBirth) {
      throw new BadRequestException(
        'Date of birth is required for NMC registration.',
      );
    }

    if (
      dto.tenant?.toLowerCase() === 'nmc' &&
      dto.dateOfBirth &&
      !this.isAtLeastMinimumAge(
        this.parseDateOnly(dto.dateOfBirth),
        MIN_NMC_REGISTRATION_AGE,
      )
    ) {
      throw new BadRequestException(
        'Applicant must be at least 18 years old.',
      );
    }

    if (dto.tenant?.toLowerCase() === 'nmc' && !dto.username?.trim()) {
      throw new BadRequestException(
        'Username is required for NMC registration.',
      );
    }

    if (
      dto.tenant?.toLowerCase() === 'nmc' &&
      !['MALE', 'FEMALE', 'TRANSGENDER'].includes(
        (dto.gender || '').trim().toUpperCase(),
      )
    ) {
      throw new BadRequestException(
        'Please select a valid gender for NMC registration.',
      );
    }

    if ((dto.address?.trim().length ?? 0) > 255) {
      throw new BadRequestException(
        'Address must be 255 characters or fewer.',
      );
    }
  }

  private parseDateOnly(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`);
  }

  private isAtLeastMinimumAge(dateOfBirth: Date, minimumAge: number): boolean {
    const today = new Date();
    const minimumDob = new Date(today);
    minimumDob.setHours(0, 0, 0, 0);
    minimumDob.setFullYear(today.getFullYear() - minimumAge);

    return dateOfBirth.getTime() <= minimumDob.getTime();
  }

  private assertRegistrationOtpVerified(dto: RegisterDto) {
    if (dto.tenant?.toLowerCase() !== 'nmc') {
      return;
    }

    const token = dto.otpVerificationToken?.trim();
    const mobileDigits = this.toMobileDigits(dto.mobile);

    if (!mobileDigits) {
      throw new BadRequestException('Mobile number is required.');
    }

    if (!token) {
      throw new BadRequestException(
        'Please verify your mobile number with OTP before registering.',
      );
    }

    try {
      const payload = this.jwtService.verify<{
        purpose?: RegistrationOtpPurpose;
        tenant?: string;
        mobile?: string;
      }>(token);

      if (
        payload?.purpose !== 'NMC_REGISTER_OTP' ||
        payload?.tenant !== 'nmc' ||
        payload?.mobile !== mobileDigits
      ) {
        throw new BadRequestException(
          'Mobile OTP verification is invalid. Please verify again.',
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Mobile OTP verification expired. Please verify again.',
      );
    }
  }

  private assertNmcOtpTenant(tenant?: string) {
    if ((tenant || '').trim().toLowerCase() !== 'nmc') {
      throw new BadRequestException(
        'OTP verification is only available for NMC registration.',
      );
    }
  }

  private requireOtpMobile(mobile?: string | null): string {
    const mobileDigits = this.toMobileDigits(mobile);

    if (!/^\d{10}$/.test(mobileDigits)) {
      throw new BadRequestException(
        'Mobile number must be exactly 10 digits.',
      );
    }

    return mobileDigits;
  }

  private requireOtpCode(otp?: string | null): string {
    const normalizedOtp = (otp || '').trim().replace(/\D/g, '');

    if (!/^\d{4,8}$/.test(normalizedOtp)) {
      throw new BadRequestException('Please enter a valid OTP.');
    }

    return normalizedOtp;
  }

  private async logUserEvent(
    userId: bigint | null,
    email: string | null,
    logType: UserLogType,
    description?: string,
    userType: user_type = 'INVESTOR',
  ) {
    await this.prisma.user_logs.create({
      data: {
        user_id: userId ?? undefined,
        user_type: userType,
        email: email ?? undefined,
        log_type: logType,
        description: description ?? null,
        ip_address: null,
        user_agent: null,
        session_id: null,
        token_id: null,
        metadata: undefined,
      },
    });
  }

  async getRoles() {
    return this.prisma.roles.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  private async resolveRegistrationRoleId(dto: RegisterDto) {
    const stakeholderType = dto.stakeholderType?.toLowerCase();
    const autoCreateRoleName =
      stakeholderType === 'bwg'
        ? 'BWG'
        : stakeholderType === 'ulb'
          ? 'ULB'
          : null;

    if (autoCreateRoleName) {
      const existingRole = await this.prisma.roles.findFirst({
        where: {
          name: {
            equals: autoCreateRoleName,
            mode: 'insensitive',
          },
        },
      });

      if (existingRole) {
        return existingRole.id;
      }

      const createdRole = await this.prisma.roles.create({
        data: {
          name: autoCreateRoleName,
          description: `Created automatically for ${autoCreateRoleName} self-registration.`,
          is_system: false,
          is_active: true,
          level: 0,
        },
      });

      return createdRole.id;
    }

    return dto.roleId;
  }

  private resolveRegistrationUserType(dto: RegisterDto): user_type {
    if (dto.stakeholderType?.toLowerCase() === 'ulb') {
      return 'DEPARTMENT';
    }

    return 'INVESTOR';
  }

  private resolveRegistrationContext(dto: RegisterDto): RegistrationContext {
    if (dto.tenant?.toLowerCase() === 'nmc') {
      return {
        tenantId: 5,
        projectId: 5,
      };
    }

    return {
      tenantId: null,
      projectId: null,
    };
  }

  private buildRegistrationOtpVerificationToken(mobile: string) {
    return this.jwtService.sign(
      {
        purpose: 'NMC_REGISTER_OTP',
        tenant: 'nmc',
        mobile,
      },
      { expiresIn: '10m' },
    );
  }

  private getNmcOtpTenantId(): string {
    return process.env.NMC_OTP_TENANT_ID?.trim() || 'pg';
  }

  private buildNmcOtpRequestInfo() {
    const timestamp = Date.now();

    return {
      apiId: 'Rainmaker',
      msgId: `${timestamp}|en_IN`,
      plainAccessRequest: {},
    };
  }

  private getNmcCitizenLoginUrl(): string {
    return (
      process.env.NMC_UPYOG_LOGIN_URL?.trim() ||
      'https://dev-upyog.nmc.gov.in/upyog-ui/citizen/login'
    );
  }

  private getNmcCitizenDashboardUrl(): string {
    return (
      process.env.NMC_PGR_HOME_URL?.trim() ||
      'https://dev-upyog.nmc.gov.in/upyog-ui/citizen/pgr-home'
    );
  }

  private getNmcTokenUrl(): string {
    return (
      process.env.NMC_TOKEN_URL?.trim() ||
      'https://dev-upyog.nmc.gov.in/user/oauth/token'
    );
  }

  private getNmcValidateTokenBaseUrl(): string {
    return (
      process.env.NMC_VALIDATE_TOKEN_URL?.trim() ||
      'https://dev-upyog.nmc.gov.in/user/_validateToken'
    );
  }

  private getNmcTokenBasicAuthorization(): string {
    return (
      process.env.NMC_TOKEN_BASIC_AUTH?.trim() ||
      'Basic ZWdvdi11c2VyLWNsaWVudDo='
    );
  }

  private getNmcTokenTenantId(): string {
    return process.env.NMC_TOKEN_TENANT_ID?.trim() || 'pg.cityb';
  }

  private getNmcTokenScope(): string {
    return process.env.NMC_TOKEN_SCOPE?.trim() || 'read';
  }

  private getNmcTokenUserType(): string {
    return process.env.NMC_TOKEN_USER_TYPE?.trim() || 'CITIZEN';
  }

  private getNmcLogoutBaseUrl(): string {
    return (
      process.env.NMC_LOGOUT_URL?.trim() ||
      'https://dev-upyog.nmc.gov.in/user/_logout'
    );
  }

  private buildNmcCitizenCreateUrl(): string {
    const configuredUrl =
      process.env.NMC_UPYOG_CREATE_USER_URL?.trim() ||
      'https://staging-upyog.nmc.gov.in/user/users/_createnovalidate';

    return configuredUrl;
  }

  private buildNmcOtpServiceUrl(
    baseUrl: string,
    options?: {
      includeTenantQuery?: boolean;
      includeTimestampQuery?: boolean;
    },
  ) {
    const trimmedUrl = baseUrl.trim();

    if (!trimmedUrl) {
      throw new BadRequestException('NMC OTP service URL is not configured.');
    }

    const url = new URL(trimmedUrl);

    if (options?.includeTenantQuery ?? true) {
      url.searchParams.set('tenantId', this.getNmcOtpTenantId());
    }

    if (options?.includeTimestampQuery ?? true) {
      url.searchParams.set('_', String(Date.now()));
    }

    return url.toString();
  }

  private buildNmcValidateTokenUrl(accessToken: string) {
    const url = new URL(this.getNmcValidateTokenBaseUrl());
    url.searchParams.set('access_token', accessToken);
    return url.toString();
  }

  private buildNmcLogoutUrl() {
    const url = new URL(this.getNmcLogoutBaseUrl());
    url.searchParams.set('tenantId', this.getNmcOtpTenantId());
    url.searchParams.set('_', String(Date.now()));
    return url.toString();
  }

  private buildExternalAccessTokenExpiryDate(expiresIn: unknown) {
    const rawValue =
      typeof expiresIn === 'string' ? parseInt(expiresIn, 10) : expiresIn;

    if (typeof rawValue !== 'number' || !Number.isFinite(rawValue) || rawValue <= 0) {
      return null;
    }

    return new Date(Date.now() + rawValue * 1000);
  }

  private async requestNmcTokenValidationPayload(accessToken: string) {
    return this.postJsonToNmcService(this.buildNmcValidateTokenUrl(accessToken), {
      requestInfo: {},
      user: {},
    });
  }

  private buildNmcOtpHeaders() {
    const headers: Record<string, string> = {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json;charset=UTF-8',
      'Accept-Language':
        process.env.NMC_OTP_ACCEPT_LANGUAGE?.trim() ||
        'en-GB,en-US;q=0.9,en;q=0.8',
      'User-Agent':
        process.env.NMC_OTP_USER_AGENT?.trim() ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
    };

    const origin = process.env.NMC_OTP_ORIGIN?.trim();
    const referer = process.env.NMC_OTP_REFERER?.trim();

    if (origin) {
      headers.Origin = origin;
    }

    if (referer) {
      headers.Referer = referer;
    }

    return headers;
  }

  private buildNmcLogoutHeaders() {
    const headers: Record<string, string> = {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json;charset=UTF-8',
      'Accept-Language':
        process.env.NMC_LOGOUT_ACCEPT_LANGUAGE?.trim() || 'en-US,en;q=0.9',
      'User-Agent':
        process.env.NMC_LOGOUT_USER_AGENT?.trim() ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0',
    };

    const origin =
      process.env.NMC_LOGOUT_ORIGIN?.trim() ||
      process.env.NMC_TOKEN_ORIGIN?.trim();
    const referer =
      process.env.NMC_LOGOUT_REFERER?.trim() ||
      process.env.NMC_TOKEN_REFERER?.trim() ||
      'https://dev-upyog.nmc.gov.in/upyog-ui/citizen/pgr-home';

    if (origin) {
      headers.Origin = origin;
    }

    if (referer) {
      headers.Referer = referer;
    }

    return headers;
  }

  private buildNmcAuthenticatedRequestInfo(accessToken: string) {
    return {
      ...this.buildNmcOtpRequestInfo(),
      authToken: accessToken,
    };
  }

  private buildNmcTokenHeaders(contentType: string) {
    const headers: Record<string, string> = {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': contentType,
      Authorization: this.getNmcTokenBasicAuthorization(),
      'Accept-Language':
        process.env.NMC_TOKEN_ACCEPT_LANGUAGE?.trim() || 'en-US,en;q=0.9',
      'User-Agent':
        process.env.NMC_TOKEN_USER_AGENT?.trim() ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0',
    };

    const origin = process.env.NMC_TOKEN_ORIGIN?.trim();
    const referer = process.env.NMC_TOKEN_REFERER?.trim();

    if (origin) {
      headers.Origin = origin;
    }

    if (referer) {
      headers.Referer = referer;
    }

    return headers;
  }

  private extractOtpServiceMessage(payload: any): string | null {
    if (typeof payload?.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }

    const firstFieldError = Array.isArray(payload?.error?.fields)
      ? payload.error.fields[0]
      : null;
    if (
      typeof firstFieldError?.message === 'string' &&
      firstFieldError.message.trim()
    ) {
      return firstFieldError.message.trim();
    }

    if (
      typeof payload?.error?.message === 'string' &&
      payload.error.message.trim()
    ) {
      return payload.error.message.trim();
    }

    if (Array.isArray(payload?.Errors) && payload.Errors.length > 0) {
      const firstError = payload.Errors[0];
      if (
        typeof firstError?.message === 'string' &&
        firstError.message.trim()
      ) {
        return firstError.message.trim();
      }
    }

    if (
      typeof payload?.raw === 'string' &&
      payload.raw.trim() &&
      payload.raw.trim().length <= 200
    ) {
      return payload.raw.trim();
    }

    return null;
  }

  private buildNmcCitizenName(dto: RegisterDto): string {
    return `${dto.firstName} ${dto.lastName === '.' ? '' : dto.lastName}`.trim();
  }

  private getNmcCitizenCreateErrorMessage(payload: any): string | null {
    const firstError = Array.isArray(payload?.Errors) ? payload.Errors[0] : null;
    const errorCode =
      typeof firstError?.code === 'string' ? firstError.code.trim() : '';

    if (errorCode === 'DuplicateUserNameException') {
      return 'This username is already registered on the NMC citizen portal.';
    }

    if (errorCode === 'DuplicateEmailIdException') {
      return 'This email address is already registered on the NMC citizen portal.';
    }

    return this.extractOtpServiceMessage(payload);
  }

  private isNmcCitizenCreateSuccessful(payload: any): boolean {
    if (typeof payload?.success === 'boolean') {
      return payload.success;
    }

    if (typeof payload?.success === 'string') {
      return ['true', '1', 'yes', 'success', 'successful'].includes(
        payload.success.trim().toLowerCase(),
      );
    }

    const responseInfo = payload?.responseInfo || payload?.ResponseInfo;
    const status = responseInfo?.status;

    if (typeof status === 'number' && status >= 200 && status < 300) {
      return true;
    }

    if (typeof status === 'string' && status.trim() === '200') {
      return true;
    }

    if (Array.isArray(payload?.user) && payload.user.length > 0) {
      return true;
    }

    if (Array.isArray(payload?.User) && payload.User.length > 0) {
      return true;
    }

    return false;
  }

  private isNmcOAuthTokenSuccessful(payload: any): boolean {
    return (
      typeof payload?.access_token === 'string' &&
      payload.access_token.trim().length > 0
    );
  }

  private extractNmcTokenServiceMessage(payload: any): string | null {
    if (
      typeof payload?.error_description === 'string' &&
      payload.error_description.trim()
    ) {
      return payload.error_description.trim();
    }

    if (typeof payload?.error === 'string' && payload.error.trim()) {
      return payload.error.trim();
    }

    return this.extractOtpServiceMessage(payload);
  }

  private buildLogoutEventDescription(
    revoked: boolean,
    nmcLogoutResult: {
      attempted: boolean;
      completed: boolean;
      message?: string | null;
    },
  ) {
    const parts = [
      revoked ? 'User logged out and local session revoked' : 'User logged out',
    ];

    if (nmcLogoutResult.attempted && nmcLogoutResult.completed) {
      parts.push('NMC session logged out successfully');
    } else if (nmcLogoutResult.attempted && nmcLogoutResult.message) {
      parts.push(`NMC logout failed: ${nmcLogoutResult.message}`);
    }

    return parts.join('; ');
  }

  private async syncNmcCitizenAccount(dto: RegisterDto) {
    const mobile = this.requireOtpMobile(dto.mobile);
    const url = this.buildNmcCitizenCreateUrl();
    const payload = {
      User: {
        userName: dto.username?.trim() || mobile,
        name: this.buildNmcCitizenName(dto),
        gender:
          dto.gender?.trim().toUpperCase() ||
          process.env.NMC_UPYOG_DEFAULT_GENDER?.trim() ||
          'MALE',
        mobileNumber: mobile,
        emailId: dto.email.trim(),
        active: true,
        type: process.env.NMC_UPYOG_USER_TYPE?.trim() || 'CITIZEN',
        password: dto.password,
        roles: [
          {
            name: process.env.NMC_UPYOG_ROLE_NAME?.trim() || 'citizen',
            code: process.env.NMC_UPYOG_ROLE_CODE?.trim() || 'CITIZEN',
            tenantId: this.getNmcOtpTenantId(),
          },
        ],
        tenantId: this.getNmcOtpTenantId(),
      },
      RequestInfo: this.buildNmcOtpRequestInfo(),
    };

    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new BadRequestException(
        'Unable to connect to NMC citizen account service right now. Please try again.',
      );
    }

    const rawText = await response.text();
    let parsedPayload: any = {};

    if (rawText) {
      try {
        parsedPayload = JSON.parse(rawText);
      } catch {
        parsedPayload = { raw: rawText };
      }
    }

    if (!response.ok && !this.isNmcCitizenCreateSuccessful(parsedPayload)) {
      throw new BadRequestException(
        this.getNmcCitizenCreateErrorMessage(parsedPayload) ||
          'Unable to create NMC citizen account right now. Please try again.',
      );
    }

    if (!this.isNmcCitizenCreateSuccessful(parsedPayload)) {
      throw new BadRequestException(
        this.getNmcCitizenCreateErrorMessage(parsedPayload) ||
          'Unable to create NMC citizen account right now. Please try again.',
      );
    }
  }

  private isOtpValidationSuccessful(payload: any): boolean {
    if (typeof payload?.success === 'boolean') {
      return payload.success;
    }

    if (typeof payload?.success === 'string') {
      return ['true', '1', 'yes', 'success', 'successful'].includes(
        payload.success.trim().toLowerCase(),
      );
    }

    const otpResult = Array.isArray(payload?.otp)
      ? payload.otp[0]
      : payload?.otp;
    const validationFlag = otpResult?.isValidationSuccessful;

    if (typeof validationFlag === 'boolean') {
      return validationFlag;
    }

    if (typeof validationFlag === 'string') {
      return ['true', '1', 'yes', 'success', 'successful'].includes(
        validationFlag.trim().toLowerCase(),
      );
    }

    return false;
  }

  private async postToNmcOtpService(url: string, body: Record<string, any>) {
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: this.buildNmcOtpHeaders(),
        body: JSON.stringify(body),
      });
    } catch {
      throw new BadRequestException(
        'Unable to reach OTP service right now. Please try again.',
      );
    }

    const rawText = await response.text();
    let parsedPayload: any = {};

    if (rawText) {
      try {
        parsedPayload = JSON.parse(rawText);
      } catch {
        parsedPayload = { raw: rawText };
      }
    }

    if (!response.ok) {
      throw new BadRequestException(
        this.extractOtpServiceMessage(parsedPayload) ||
          'OTP service request failed. Please try again.',
      );
    }

    return parsedPayload;
  }

  private async postJsonToNmcService(url: string, body: Record<string, any>) {
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new BadRequestException(
        'Unable to reach NMC service right now. Please try again.',
      );
    }

    const rawText = await response.text();
    let parsedPayload: any = {};

    if (rawText) {
      try {
        parsedPayload = JSON.parse(rawText);
      } catch {
        parsedPayload = { raw: rawText };
      }
    }

    if (!response.ok) {
      throw new BadRequestException(
        this.extractNmcTokenServiceMessage(parsedPayload) ||
          'NMC service request failed. Please try again.',
      );
    }

    return parsedPayload;
  }

  private async postToNmcLogoutService(accessToken: string) {
    let response: Response;

    try {
      response = await fetch(this.buildNmcLogoutUrl(), {
        method: 'POST',
        headers: this.buildNmcLogoutHeaders(),
        body: JSON.stringify({
          access_token: accessToken,
          RequestInfo: this.buildNmcAuthenticatedRequestInfo(accessToken),
        }),
      });
    } catch {
      throw new BadRequestException(
        'Unable to reach NMC logout service right now. Please try again.',
      );
    }

    const rawText = await response.text();
    let parsedPayload: any = {};

    if (rawText) {
      try {
        parsedPayload = JSON.parse(rawText);
      } catch {
        parsedPayload = { raw: rawText };
      }
    }

    if (!response.ok) {
      throw new BadRequestException(
        this.extractNmcTokenServiceMessage(parsedPayload) ||
          'Unable to log out from the NMC portal right now. Please try again.',
      );
    }

    return parsedPayload;
  }

  private async postFormToNmcTokenService(body: URLSearchParams) {
    const url = new URL(this.getNmcTokenUrl());
    url.searchParams.set('_', String(Date.now()));

    let response: Response;

    try {
      response = await fetch(url.toString(), {
        method: 'POST',
        headers: this.buildNmcTokenHeaders(
          'application/x-www-form-urlencoded',
        ),
        body: body.toString(),
      });
    } catch {
      throw new BadRequestException(
        'Unable to reach NMC token service right now. Please try again.',
      );
    }

    const rawText = await response.text();
    let parsedPayload: any = {};

    if (rawText) {
      try {
        parsedPayload = JSON.parse(rawText);
      } catch {
        parsedPayload = { raw: rawText };
      }
    }

    if (!response.ok || !this.isNmcOAuthTokenSuccessful(parsedPayload)) {
      throw new BadRequestException(
        this.extractNmcTokenServiceMessage(parsedPayload) ||
          'Unable to fetch NMC token right now. Please try again.',
      );
    }

    return parsedPayload;
  }

  private async requestNmcRefreshTokenPayload(refreshToken: string) {
    const params = new URLSearchParams();
    params.set('grant_type', 'refresh_token');
    params.set('refresh_token', refreshToken);
    return this.postFormToNmcTokenService(params);
  }

  private async resolveNmcAccessTokenForUser(
    userId: bigint,
    options?: { allowUnvalidatedFallback?: boolean },
  ) {
    const session = await this.findLatestExternalAuthSessionForUser(
      userId,
      NMC_EXTERNAL_PROVIDER,
    );
    const accessToken = this.normalizeString(session?.access_token);

    if (!accessToken) {
      throw new BadRequestException(
        'No active NMC session found for this user.',
      );
    }

    try {
      await this.requestNmcTokenValidationPayload(accessToken);
      await this.touchExternalAuthSessionByAccessToken(
        NMC_EXTERNAL_PROVIDER,
        accessToken,
      );
      return accessToken;
    } catch {
      const refreshToken = this.normalizeString(session?.refresh_token);

      if (refreshToken) {
        const refreshedPayload =
          await this.requestNmcRefreshTokenPayload(refreshToken);
        await this.syncExternalAuthSessionFromNmcTokenPayload(
          refreshedPayload,
          {
            refreshTokenHint: refreshToken,
          },
        );

        const refreshedAccessToken = this.normalizeString(
          refreshedPayload?.access_token,
        );

        if (refreshedAccessToken) {
          return refreshedAccessToken;
        }
      }

      if (options?.allowUnvalidatedFallback) {
        return accessToken;
      }

      throw new BadRequestException(
        'Unable to resolve a valid NMC session for this user.',
      );
    }
  }

  private async syncExternalAuthSessionFromNmcTokenPayload(
    payload: any,
    options?: { refreshTokenHint?: string | null },
  ) {
    const accessToken = this.normalizeString(payload?.access_token);

    if (!accessToken) {
      return;
    }

    const validationPayload =
      await this.requestNmcTokenValidationPayload(accessToken);
    const identifiers =
      this.extractUserIdentifiersFromNmcPayload(validationPayload);

    let user = await this.findUserForBapLogout(identifiers);

    if (!user && options?.refreshTokenHint) {
      user = await this.findUserByExternalRefreshToken(
        NMC_EXTERNAL_PROVIDER,
        options.refreshTokenHint,
      );
    }

    if (!user) {
      return;
    }

    const refreshToken =
      this.normalizeString(payload?.refresh_token) ||
      this.normalizeString(options?.refreshTokenHint);
    const tokenType = this.normalizeString(payload?.token_type) || null;
    const scope = this.normalizeString(payload?.scope) || null;

    const accessTokenExpiresAt = this.buildExternalAccessTokenExpiryDate(
      payload?.expires_in,
    );
    const refreshTokenExpiresAt = this.buildExternalAccessTokenExpiryDate(
      payload?.refresh_expires_in,
    );
    const now = new Date();

    await this.prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "external_auth_sessions" (
          "user_id",
          "provider",
          "external_username",
          "access_token",
          "refresh_token",
          "token_type",
          "scope",
          "access_token_expires_at",
          "refresh_token_expires_at",
          "last_validated_at",
          "revoked_at",
          "raw_token_payload",
          "created_at",
          "updated_at"
        )
        VALUES (
          ${user.id},
          ${NMC_EXTERNAL_PROVIDER},
          ${identifiers.username || null},
          ${accessToken},
          ${refreshToken || null},
          ${tokenType},
          ${scope},
          ${accessTokenExpiresAt},
          ${refreshTokenExpiresAt},
          ${now},
          ${null},
          CAST(${JSON.stringify(payload)} AS jsonb),
          ${now},
          ${now}
        )
        ON CONFLICT ("user_id", "provider")
        DO UPDATE SET
          "external_username" = EXCLUDED."external_username",
          "access_token" = EXCLUDED."access_token",
          "refresh_token" = EXCLUDED."refresh_token",
          "token_type" = EXCLUDED."token_type",
          "scope" = EXCLUDED."scope",
          "access_token_expires_at" = EXCLUDED."access_token_expires_at",
          "refresh_token_expires_at" = EXCLUDED."refresh_token_expires_at",
          "last_validated_at" = EXCLUDED."last_validated_at",
          "revoked_at" = EXCLUDED."revoked_at",
          "raw_token_payload" = EXCLUDED."raw_token_payload",
          "updated_at" = EXCLUDED."updated_at"
      `,
    );
  }

  private async syncExternalAuthSessionFromValidatedToken(
    userId: bigint,
    accessToken: string,
    validationPayload: any,
    options?: { refreshToken?: string | null },
  ) {
    const identifiers =
      this.extractUserIdentifiersFromNmcPayload(validationPayload);
    const refreshToken = this.normalizeString(options?.refreshToken) || null;
    const now = new Date();

    await this.prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "external_auth_sessions" (
          "user_id",
          "provider",
          "external_username",
          "access_token",
          "refresh_token",
          "last_validated_at",
          "revoked_at",
          "raw_token_payload",
          "created_at",
          "updated_at"
        )
        VALUES (
          ${userId},
          ${NMC_EXTERNAL_PROVIDER},
          ${identifiers.username || null},
          ${accessToken},
          ${refreshToken},
          ${now},
          ${null},
          CAST(${JSON.stringify(validationPayload)} AS jsonb),
          ${now},
          ${now}
        )
        ON CONFLICT ("user_id", "provider")
        DO UPDATE SET
          "external_username" = EXCLUDED."external_username",
          "access_token" = EXCLUDED."access_token",
          "refresh_token" = COALESCE(
            EXCLUDED."refresh_token",
            "external_auth_sessions"."refresh_token"
          ),
          "last_validated_at" = EXCLUDED."last_validated_at",
          "revoked_at" = EXCLUDED."revoked_at",
          "raw_token_payload" = EXCLUDED."raw_token_payload",
          "updated_at" = EXCLUDED."updated_at"
      `,
    );
  }

  private async touchExternalAuthSessionByAccessToken(
    provider: string,
    accessToken: string,
  ) {
    const normalizedAccessToken = this.normalizeString(accessToken);

    if (!normalizedAccessToken) {
      return;
    }

    await this.prisma.$executeRaw(
      Prisma.sql`
        UPDATE "external_auth_sessions"
        SET "last_validated_at" = ${new Date()},
            "updated_at" = ${new Date()}
        WHERE "provider" = ${provider}
          AND "access_token" = ${normalizedAccessToken}
          AND "revoked_at" IS NULL
      `,
    );
  }

  private async findUserByExternalRefreshToken(
    provider: string,
    refreshToken?: string | null,
  ) {
    const normalizedRefreshToken = this.normalizeString(refreshToken);

    if (!normalizedRefreshToken) {
      return null;
    }

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: bigint;
        email: string;
        user_type: user_type;
        is_email_verified: number;
      }>
    >(
      Prisma.sql`
        SELECT u."id", u."email", u."user_type", u."is_email_verified"
        FROM "external_auth_sessions" eas
        INNER JOIN "users" u ON u."id" = eas."user_id"
        WHERE eas."provider" = ${provider}
          AND eas."refresh_token" = ${normalizedRefreshToken}
          AND eas."revoked_at" IS NULL
          AND u."deleted_at" IS NULL
        ORDER BY eas."updated_at" DESC
        LIMIT 1
      `,
    );

    return rows[0] ?? null;
  }

  private async findLatestExternalAuthSessionForUser(
    userId: bigint,
    provider: string,
  ) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        access_token: string | null;
        refresh_token: string | null;
        external_username: string | null;
      }>
    >(
      Prisma.sql`
        SELECT
          eas."access_token",
          eas."refresh_token",
          eas."external_username"
        FROM "external_auth_sessions" eas
        WHERE eas."user_id" = ${userId}
          AND eas."provider" = ${provider}
          AND eas."revoked_at" IS NULL
        ORDER BY eas."updated_at" DESC
        LIMIT 1
      `,
    );

    return rows[0] ?? null;
  }

  private async revokeExternalAuthSessionForUser(
    userId: bigint,
    provider: string,
  ) {
    await this.prisma.$executeRaw(
      Prisma.sql`
        UPDATE "external_auth_sessions"
        SET "revoked_at" = ${new Date()},
            "updated_at" = ${new Date()}
        WHERE "user_id" = ${userId}
          AND "provider" = ${provider}
          AND "revoked_at" IS NULL
      `,
    );
  }

  private async revokeExternalAuthSessionByAccessToken(
    accessToken: string,
    provider: string,
  ) {
    const normalizedAccessToken = this.normalizeString(accessToken);

    if (!normalizedAccessToken) {
      return;
    }

    await this.prisma.$executeRaw(
      Prisma.sql`
        UPDATE "external_auth_sessions"
        SET "revoked_at" = ${new Date()},
            "updated_at" = ${new Date()}
        WHERE "provider" = ${provider}
          AND "access_token" = ${normalizedAccessToken}
          AND "revoked_at" IS NULL
      `,
    );
  }

  private async logoutNmcSessionForUser(userId: bigint) {
    const session = await this.findLatestExternalAuthSessionForUser(
      userId,
      NMC_EXTERNAL_PROVIDER,
    );
    const accessToken = this.normalizeString(session?.access_token);

    if (!accessToken) {
      return {
        attempted: false,
        completed: false,
        message: null as string | null,
      };
    }

    try {
      await this.postToNmcLogoutService(accessToken);
      await this.revokeExternalAuthSessionForUser(userId, NMC_EXTERNAL_PROVIDER);

      return {
        attempted: true,
        completed: true,
        message: null as string | null,
      };
    } catch (error) {
      const refreshToken = this.normalizeString(session?.refresh_token);

      if (refreshToken) {
        try {
          const refreshedPayload =
            await this.requestNmcRefreshTokenPayload(refreshToken);
          await this.syncExternalAuthSessionFromNmcTokenPayload(
            refreshedPayload,
            {
              refreshTokenHint: refreshToken,
            },
          );

          const refreshedAccessToken = this.normalizeString(
            refreshedPayload?.access_token,
          );

          if (refreshedAccessToken) {
            await this.postToNmcLogoutService(refreshedAccessToken);
            await this.revokeExternalAuthSessionForUser(
              userId,
              NMC_EXTERNAL_PROVIDER,
            );

            return {
              attempted: true,
              completed: true,
              message: null as string | null,
            };
          }
        } catch {
          // Fall through to the original logout failure response below.
        }
      }

      return {
        attempted: true,
        completed: false,
        message:
          error instanceof Error ? error.message : 'NMC logout request failed.',
      };
    }
  }

  private async sendNmcRegistrationOtp(mobile: string) {
    const url = this.buildNmcOtpServiceUrl(
      process.env.NMC_OTP_SEND_URL?.trim() ||
        'https://dev-upyog.nmc.gov.in/user-otp/v1/_send',
    );

    await this.postToNmcOtpService(url, {
      otp: {
        mobileNumber: mobile,
        userType: process.env.NMC_OTP_USER_TYPE?.trim() || 'citizen',
        type: process.env.NMC_OTP_TYPE?.trim() || 'register',
        tenantId: this.getNmcOtpTenantId(),
      },
      RequestInfo: this.buildNmcOtpRequestInfo(),
    });
  }

  private async verifyNmcRegistrationOtp(mobile: string, otp: string) {
    const url = this.buildNmcOtpServiceUrl(
      process.env.NMC_OTP_VALIDATE_URL?.trim() ||
        'https://dev-upyog.nmc.gov.in/user/otp/validate',
      {
        includeTenantQuery: false,
        includeTimestampQuery: false,
      },
    );

    const payload = await this.postToNmcOtpService(url, {
      mobileNumber: mobile,
      otpReference: otp,
      tenantId: this.getNmcOtpTenantId(),
      type: process.env.NMC_OTP_TYPE?.trim() || 'register',
      RequestInfo: this.buildNmcOtpRequestInfo(),
    });

    return this.isOtpValidationSuccessful(payload);
  }

  private isEmailVerificationRequired(): boolean {
    const rawValue = process.env.AUTH_REQUIRE_EMAIL_VERIFICATION
      ?.trim()
      .toLowerCase();

    return rawValue === '1' || rawValue === 'true' || rawValue === 'yes';
  }

  private getInitialEmailVerificationStatus(): number {
    return this.isEmailVerificationRequired() ? 0 : 1;
  }

  private async createEmailVerificationToken(userId: bigint): Promise<string> {
    const token = uuidv4();
    await this.prisma.user_tokens.create({
      data: {
        user_id: userId,
        token_hash: token,
        token_type: 'EMAIL_VERIFICATION',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return token;
  }

  private async dispatchActivationLink(
    user: { id: bigint; email: string | null; user_type: user_type },
    reason: VerificationDispatchReason,
  ): Promise<{ verificationUrl?: string }> {
    if (!this.isEmailVerificationRequired() || !user.email) {
      return {};
    }

    const token = await this.createEmailVerificationToken(user.id);
    const mailResult = await this.mailService.sendActivationEmail(
      user.email,
      token,
    );

    await this.logUserEvent(
      user.id,
      user.email,
      'EMAIL_VERIFICATION_SENT',
      mailResult.delivered
        ? reason === 'resend'
          ? 'Activation email resent'
          : 'Activation email sent'
        : 'Activation email preview generated',
      user.user_type,
    );

    return mailResult.previewUrl
      ? { verificationUrl: mailResult.previewUrl }
      : {};
  }

  private async getResourcesForRole(
    roleId: number,
  ): Promise<{ code: string; path: string }[]> {
    // ✅ use the parameter and the `roleResource` delegate
    const roleResources = await this.prisma.roleResource.findMany({
      where: { role_id: roleId },
      include: { resource: true },
    });

    return roleResources.map((rr) => ({
      code: rr.resource.code,
      path: rr.resource.path,
    }));
  }

  async verifyEmail(token: string) {
    const userToken = await this.prisma.user_tokens.findUnique({
      where: { token_hash: token },
      include: {
        user: {
          select: authUserSelect,
        },
      },
    });

    if (!userToken || userToken.used_at || userToken.expires_at < new Date()) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (userToken.token_type !== 'EMAIL_VERIFICATION') {
      throw new UnauthorizedException('Invalid token type');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { id: userToken.user_id },
        data: { is_email_verified: 1 },
        select: { id: true },
      });

      await tx.user_tokens.update({
        where: { id: userToken.id },
        data: { used_at: new Date() },
      });
    });

    await this.logUserEvent(
      userToken.user_id,
      userToken.user?.email || null,
      'EMAIL_VERIFIED',
      'Email verified successfully',
    );

    const user = userToken.user;
    if (!user) throw new UnauthorizedException('User not found');

    const resources = user.role_id
      ? await this.getResourcesForRole(user.role_id)
      : [];

    return {
      success: true,
      message: 'Email verified successfully',
      data: {
        accessToken: await this.generateToken(user),
        user: this.mapUserResponse(user),
        profile: this.mapProfile(user),
        resources,
      },
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.users.findFirst({
      where: { email, deleted_at: null },
      select: userBaseSelect,
    });

    if (!user) throw new UnauthorizedException('User not found');
    if (user.is_email_verified === 1) {
      throw new ConflictException('Email already verified');
    }
    if (!this.isEmailVerificationRequired()) {
      throw new ConflictException(
        'Email activation is currently disabled. New registrations are activated automatically.',
      );
    }
    const activationDispatch = await this.dispatchActivationLink(user, 'resend');

    return {
      success: true,
      message: 'Activation link sent',
      ...activationDispatch,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.users.findFirst({
      where: { email, deleted_at: null },
      select: userBaseSelect,
    });

    if (!user) {
      // Don’t reveal if user exists
      return {
        success: true,
        message:
          'If your email is registered, you will receive a password reset link.',
      };
    }

    const token = uuidv4();
    await this.prisma.user_tokens.create({
      data: {
        user_id: user.id,
        token_hash: token,
        token_type: 'PASSWORD_RESET',
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    let resetUrl: string | undefined;

    if (user.email) {
      const mailResult = await this.mailService.sendPasswordResetEmail(user.email, token);
      resetUrl = mailResult.previewUrl;
      await this.logUserEvent(
        user.id,
        user.email,
        'PASSWORD_RESET_REQUESTED',
        mailResult.delivered
          ? 'Password reset requested'
          : 'Password reset preview generated',
        user.user_type,
      );
    }

    return {
      success: true,
      message:
        'If your email is registered, you will receive a password reset link.',
      ...(resetUrl ? { resetUrl } : {}),
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const userToken = await this.prisma.user_tokens.findUnique({
      where: { token_hash: token },
      include: {
        user: {
          select: userBaseSelect,
        },
      },
    });

    if (!userToken || userToken.used_at || userToken.expires_at < new Date()) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (userToken.token_type !== 'PASSWORD_RESET') {
      throw new UnauthorizedException('Invalid token type');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { id: userToken.user_id },
        data: { password_hash: passwordHash },
        select: { id: true },
      });

      await tx.user_tokens.update({
        where: { id: userToken.id },
        data: { used_at: new Date() },
      });
    });

    await this.logUserEvent(
      userToken.user_id,
      userToken.user?.email || null,
      'PASSWORD_RESET_COMPLETED',
      'Password reset successfully',
    );

    return { success: true, message: 'Password reset successfully' };
  }

  async checkRegistrationStatus(email?: string, pan?: string, mobile?: string) {
    const result: any = {};

    try {
      if (email) {
        const user = await this.prisma.users.findFirst({
          where: { email, deleted_at: null },
          select: userBaseSelect,
        });

        if (user) {
          if (user.is_email_verified === 0) {
            result.email = {
              status: 'EMAIL_EXISTS_UNVERIFIED',
              message: 'Email exists but not verified',
            };
          } else {
            result.email = {
              status: 'EMAIL_EXISTS',
              message: 'Email already registered',
            };
          }
        } else {
          result.email = { status: 'AVAILABLE', message: 'Available' };
        }
      }

      if (pan) {
        const investor = await this.prisma.investor_profiles.findFirst({
          where: {
            pan_card: pan,
            user: { deleted_at: null },
          },
        });

        if (investor) {
          result.pan = { status: 'PAN_EXISTS', message: 'PAN already registered' };
        } else {
          result.pan = { status: 'AVAILABLE', message: 'Available' };
        }
      }

      if (mobile?.trim()) {
        const existingMobileUser = await this.findExistingUserByMobile(mobile);

        if (existingMobileUser) {
          result.mobile = {
            status: 'MOBILE_EXISTS',
            message: 'Mobile already registered',
          };
        } else {
          result.mobile = { status: 'AVAILABLE', message: 'Available' };
        }
      }

      return result;
    } catch (error) {
      if (this.isDatabaseUnavailableError(error)) {
        return this.buildRegistrationCheckUnavailableResult({
          email,
          pan,
          mobile,
        });
      }

      throw error;
    }
  }

  private normalizeMobile(mobile?: string | null): string {
    return (mobile || '').trim();
  }

  private toMobileDigits(mobile?: string | null): string {
    return this.normalizeMobile(mobile).replace(/\D/g, '');
  }

  private async findExistingUserByMobile(mobile?: string | null) {
    const normalizedMobile = this.normalizeMobile(mobile);
    if (!normalizedMobile) {
      return null;
    }

    const mobileDigits = this.toMobileDigits(normalizedMobile);

    const investor = mobileDigits
      ? await this.prisma.investor_profiles.findFirst({
          where: {
            mobile_number: BigInt(mobileDigits),
            user: { deleted_at: null },
          },
          select: {
            user_id: true,
            user: {
              select: {
                id: true,
                email: true,
                user_type: true,
                is_email_verified: true,
              },
            },
          },
        })
      : null;

    if (investor?.user) {
      return investor.user;
    }

    const departmentUser = await this.prisma.department_users.findFirst({
      where: {
        user: { deleted_at: null },
        OR: [
          { mobile: normalizedMobile },
          ...(mobileDigits && mobileDigits !== normalizedMobile
            ? [{ mobile: mobileDigits }]
            : []),
        ],
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            user_type: true,
            is_email_verified: true,
          },
        },
      },
    });

    return departmentUser?.user ?? null;
  }

  private isDatabaseUnavailableError(error: unknown): boolean {
    return (
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P1001') ||
      error instanceof Prisma.PrismaClientInitializationError
    );
  }

  private buildRegistrationCheckUnavailableResult({
    email,
    pan,
    mobile,
  }: {
    email?: string;
    pan?: string;
    mobile?: string;
  }) {
    const unavailable = {
      status: 'UNAVAILABLE',
      message: 'Availability check is temporarily unavailable. You can still continue filling the form.',
    };

    return {
      ...(email ? { email: unavailable } : {}),
      ...(pan ? { pan: unavailable } : {}),
      ...(mobile?.trim() ? { mobile: unavailable } : {}),
    };
  }

  async getUserById(userId: bigint) {
  const user = await this.prisma.users.findUnique({
    where: { id: userId },
    select: authUserSelect,
  });

  if (!user || user.deleted_at) {
    throw new UnauthorizedException('User not found');
  }

  const resources = user.role_id
    ? await this.getResourcesForRole(user.role_id)
    : [];

  return {
    user: this.mapUserResponse(user),
    profile: this.mapProfile(user),
    resources,
  };
}

}
