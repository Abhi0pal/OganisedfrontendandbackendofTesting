import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ResponseHelper } from '../../common/response.helper';
import { Public } from '../../common/public.decorator';
import { SkipResourceCheck } from '../../common/skip-resource-check.decorator';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(
    @Body('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyEmail(token);

    if (result.success && result.data) {
      res.cookie('accessToken', result.data.accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 3600000,
        path: '/',
      });
      return ResponseHelper.success(result.message, result.data);
    }

    return result;
  }

  @Public()
  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  @Public()
  @Post('check-registration')
  async checkRegistration(@Body() body: { email?: string; pan?: string; mobile?: string }) {
    return this.authService.checkRegistrationStatus(body.email, body.pan, body.mobile);
  }

  @Public()
  @Post('register-otp/send')
  async sendRegisterOtp(@Body() body: { mobile?: string; tenant?: string }) {
    return this.authService.sendRegistrationOtp(body.mobile, body.tenant);
  }

  @Public()
  @Post('register-otp/verify')
  async verifyRegisterOtp(
    @Body() body: { mobile?: string; otp?: string; tenant?: string },
  ) {
    return this.authService.verifyRegistrationOtp(
      body.mobile,
      body.otp,
      body.tenant,
    );
  }

  @Public()
  @Post('nmc/validate-token')
  async validateNmcToken(@Body() body: { accessToken?: string }) {
    return this.authService.validateNmcToken(body.accessToken);
  }

  @Public()
  @Post('nmc/session/bootstrap')
  async bootstrapNmcSession(
    @Body()
    body: {
      accessToken?: string;
      refreshToken?: string;
      redirectUrl?: string;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.bootstrapNmcSession(
      body.accessToken,
      body.refreshToken,
    );

    if (!result.success) {
      return ResponseHelper.error(result.message, result.error);
    }

    if (result.data?.accessToken) {
      res.cookie('accessToken', result.data.accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 3600000,
        path: '/',
      });
    }

    const redirectUrl = String(body.redirectUrl || '').trim();
    if (redirectUrl) {
      res.redirect(302, redirectUrl);
      return;
    }

    const { accessToken, ...responseData } = result.data || {};
    return ResponseHelper.success(result.message, responseData);
  }

  @Public()
  @Post('nmc/access-token')
  async getNmcAccessToken(
    @Body()
    body: {
      username?: string;
      password?: string;
      userName?: string;
      tenantId?: string;
      scope?: string;
      userType?: string;
    },
  ) {
    return this.authService.getNmcAccessToken(body);
  }

  @Public()
  @Post('nmc/refresh-token')
  async refreshNmcAccessToken(@Body() body: { refreshToken?: string }) {
    return this.authService.refreshNmcAccessToken(body.refreshToken);
  }

  @Public()
  @Post('nmc/logout')
  async logoutNmcSession(@Body() body: { accessToken?: string }) {
    return this.authService.logoutNmcSession(body.accessToken);
  }

  @SkipResourceCheck()
  @Get('nmc/dashboard-launch')
  @UseGuards(JwtGuard)
  async getNmcDashboardLaunch(@CurrentUser() user: any) {
    return this.authService.getNmcDashboardLaunch(BigInt(user.id));
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.authService.resetPassword(token, password);
  }

  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);

    if (!result.success) {
      return ResponseHelper.error(result.message, result.error);
    }

    res.cookie('accessToken', result.data.accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 3600000,
      path: '/',
    });

    const { accessToken, ...userData } = result.data;
    return ResponseHelper.success(result.message, userData);
  }

  @Public()
  @Get('users/:id')
  @UseGuards(JwtGuard)
  async getUserById(@Param('id') id: string) {
    return this.authService.getUserById(BigInt(id));
  }

  @SkipResourceCheck()
  @Get('profile')
  @UseGuards(JwtGuard)
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getCurrentUser(BigInt(user.id));
  }

  @SkipResourceCheck()
  @Patch('profile')
  @UseGuards(JwtGuard)
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateCurrentInvestorProfile(BigInt(user.id), dto);
  }

  @SkipResourceCheck()
  @Post('change-password')
  @UseGuards(JwtGuard)
  async changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(BigInt(user.id), dto);
  }

  @SkipResourceCheck()
  @Get('roles')
  @UseGuards(JwtGuard)
  async getAllRoles() {
    const roles = await this.authService.getRoles();
    return ResponseHelper.success('Roles fetched successfully', roles);
  }

  @SkipResourceCheck()
  @Post('logout')
  @UseGuards(JwtGuard)
  async logout(
    @Req() req: Request,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logoutCurrentSession(
      req.cookies?.accessToken,
      user,
    );

    res.cookie('accessToken', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return result;
  }

  @Public()
  @Post('bap/logout')
  async bapLogout(@Body() body: { accessToken?: string }) {
    return this.authService.logoutFromBap(body);
  }

  @Public()
  @Get('check')
  async checkAuth(@Req() req: Request) {
    const token = req.cookies?.accessToken;
    return ResponseHelper.success('Auth status', {
      authenticated: !!token,
    });
  }

  @Get('verify')
  @UseGuards(JwtGuard)
  async verifyToken(@CurrentUser() user: any) {
    return { valid: true, user };
  }
}
