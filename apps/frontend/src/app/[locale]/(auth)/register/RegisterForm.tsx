'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from '@/navigation';
import apiClient from '@/lib/api-client';
import { useTranslations } from "next-intl";
import { useSearchParams } from 'next/navigation';
import styles from './RegisterForm.module.css';

const COMMON_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
const TENANT_REGISTER_THEMES = ['trera', 'nmc', 'cpcb'] as const;
const INVESTOR_ROLE_ID = 2;
const FULL_NAME_MAX_LENGTH = 60;
const ADDRESS_MAX_LENGTH = 255;
const EMAIL_MAX_LENGTH = 128;
const USERNAME_MAX_LENGTH = 255;
const MOBILE_LENGTH = 10;
const MIN_NMC_AGE = 18;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NMC_LOGIN_HREF = 'https://dev-upyog.nmc.gov.in/upyog-ui/citizen/login';

type TenantRegisterTheme = (typeof TENANT_REGISTER_THEMES)[number] | 'default';

type StakeholderOption = {
    key: string;
    label: string;
    roleId: number;
};

const STAKEHOLDER_OPTIONS: Record<TenantRegisterTheme, StakeholderOption[]> = {
    default: [{ key: 'applicant', label: 'Applicant', roleId: INVESTOR_ROLE_ID }],
    nmc: [{ key: 'applicant', label: 'Applicant', roleId: INVESTOR_ROLE_ID }],
    trera: [
        { key: 'promoter', label: 'Promoter', roleId: INVESTOR_ROLE_ID },
        { key: 'agent', label: 'Agent', roleId: INVESTOR_ROLE_ID },
    ],
    cpcb: [
        { key: 'ulb', label: 'ULB', roleId: INVESTOR_ROLE_ID },
        { key: 'bwg', label: 'BWG', roleId: INVESTOR_ROLE_ID },
        { key: 'landfill', label: 'Landfill', roleId: INVESTOR_ROLE_ID },
        { key: 'mrf', label: 'MRF', roleId: INVESTOR_ROLE_ID },
        { key: 'processing-facility', label: 'Processing Facility', roleId: INVESTOR_ROLE_ID },
    ],
};

const THEME_CLASS_MAP: Record<TenantRegisterTheme, string> = {
    default: styles.themeDefault,
    nmc: styles.themeNmc,
    trera: styles.themeTrera,
    cpcb: styles.themeCpcb,
};

const THEME_COPY: Record<TenantRegisterTheme, { badge: string; summary: string }> = {
    default: {
        badge: 'Public Registration',
        summary: 'Create an applicant account to continue with the portal onboarding flow.',
    },
    nmc: {
        badge: 'Citizen Registration',
        summary: 'Create an applicant account to continue with the municipal portal onboarding flow.',
    },
    trera: {
        badge: 'TRERA Registration',
        summary: 'Choose whether you are registering as a promoter or an agent under the TRERA portal.',
    },
    cpcb: {
        badge: 'CPCB Registration',
        summary: 'Choose the stakeholder type for CPCB onboarding. ULB and BWG registrations use dedicated roles; others continue under the applicant role.',
    },
};

export default function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const formRef = useRef<HTMLFormElement>(null);
    const feedbackRef = useRef<HTMLDivElement>(null);
    const tenantParam = String(searchParams.get('tenant') || '').toLowerCase().trim();
    const tenantTheme: TenantRegisterTheme = TENANT_REGISTER_THEMES.includes(tenantParam as (typeof TENANT_REGISTER_THEMES)[number])
        ? (tenantParam as TenantRegisterTheme)
        : 'default';
    const isNmcTenant = tenantTheme === 'nmc';
    const stakeholderOptions = useMemo(
        () => STAKEHOLDER_OPTIONS[tenantTheme] || STAKEHOLDER_OPTIONS.default,
        [tenantTheme],
    );
    const [registerAs, setRegisterAs] = useState(stakeholderOptions[0]?.key || 'applicant');
    const [showPassword, setShowPassword] = useState(false);
    const t = useTranslations("RegisterPage");
    // Refs for file inputs
    const investorPanRef = useRef<HTMLInputElement>(null);
    const consultantPanRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        pan: '',
        firstName: '',
        lastName: '',
        fullName: '',
        username: '',
        gender: '',
        dateOfBirth: '',
        legalEntityName: '',
        mobile: '',
        address: '',
        email: '',
        password: '',
        confirmPassword: '',
        // Applicant Info (for On Behalf of Investor)
        cons_pan: '',
        cons_mobile: '',
        cons_fullName: '',
        cons_email: '',
    });

    // Email suggestion state
    const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
    const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);

    const [showPasswordCriteria, setShowPasswordCriteria] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpError, setOtpError] = useState<string | null>(null);
    const [otpInfo, setOtpInfo] = useState<string | null>(null);
    const [otpSending, setOtpSending] = useState(false);
    const [otpVerifying, setOtpVerifying] = useState(false);
    const [otpVerificationToken, setOtpVerificationToken] = useState<string | null>(null);
    const [otpVerifiedMobile, setOtpVerifiedMobile] = useState<string | null>(null);
    const [pendingRegistrationPayload, setPendingRegistrationPayload] = useState<Record<string, any> | null>(null);

    // PAN Upload State
    const [isUploadingInvestorPan, setIsUploadingInvestorPan] = useState(false);
    const [isUploadingConsultantPan, setIsUploadingConsultantPan] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Check Registration State
    const [emailCheckStatus, setEmailCheckStatus] = useState<{ status: string; message: string } | null>(null);
    const [panCheckStatus, setPanCheckStatus] = useState<{ status: string; message: string } | null>(null);
    const [mobileCheckStatus, setMobileCheckStatus] = useState<{ status: string; message: string } | null>(null);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [isCheckingPan, setIsCheckingPan] = useState(false);
    const [isCheckingMobile, setIsCheckingMobile] = useState(false);
    const activationSuccessMessage = 'Registration completed successfully. A verification email has been sent to your registered email address. Please click the link to activate your account.';

    useEffect(() => {
        const firstAllowedOption = stakeholderOptions[0]?.key || 'applicant';
        if (!stakeholderOptions.some((option) => option.key === registerAs)) {
            setRegisterAs(firstAllowedOption);
        }
    }, [registerAs, stakeholderOptions]);

    useEffect(() => {
        if (!error && !success) {
            return;
        }

        feedbackRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    }, [error, success]);

    // Check Email Status
    useEffect(() => {
        const checkEmail = async () => {
            const trimmedEmail = formData.email.trim();
            if (trimmedEmail && trimmedEmail.length <= EMAIL_MAX_LENGTH && EMAIL_REGEX.test(trimmedEmail)) {
                setIsCheckingEmail(true);
                try {
                    const res = await apiClient.post('/auth/check-registration', {
                        email: trimmedEmail
                    });
                    setEmailCheckStatus(res.data.email);
                } catch (err) {
                    console.error(err);
                    setEmailCheckStatus(null);
                } finally {
                    setIsCheckingEmail(false);
                }
            } else {
                setEmailCheckStatus(null);
            }
        };

        const timeoutId = setTimeout(checkEmail, 1000);
        return () => clearTimeout(timeoutId);
    }, [formData.email]);

    // Check PAN Status
    useEffect(() => {
        const checkPan = async () => {
            if (formData.pan && formData.pan.length === 10) {
                setIsCheckingPan(true);
                try {
                    const res = await apiClient.post('/auth/check-registration', {
                        pan: formData.pan
                    });
                    setPanCheckStatus(res.data.pan);
                } catch (err) {
                    console.error(err);
                    setPanCheckStatus(null);
                } finally {
                    setIsCheckingPan(false);
                }
            } else {
                setPanCheckStatus(null);
            }
        };

        const timeoutId = setTimeout(checkPan, 1000);
        return () => clearTimeout(timeoutId);
    }, [formData.pan]);

    useEffect(() => {
        const checkMobile = async () => {
            const trimmedMobile = formData.mobile.trim();
            if (trimmedMobile.length === MOBILE_LENGTH) {
                setIsCheckingMobile(true);
                try {
                    const res = await apiClient.post('/auth/check-registration', {
                        mobile: trimmedMobile
                    });
                    setMobileCheckStatus(res.data.mobile);
                } catch (err) {
                    console.error(err);
                    setMobileCheckStatus(null);
                } finally {
                    setIsCheckingMobile(false);
                }
            } else {
                setMobileCheckStatus(null);
            }
        };

        const timeoutId = setTimeout(checkMobile, 1000);
        return () => clearTimeout(timeoutId);
    }, [formData.mobile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name } = e.target;
        let { value } = e.target;

        if (name === 'mobile' || name === 'cons_mobile') {
            value = value.replace(/\D/g, '').slice(0, MOBILE_LENGTH);
        }

        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'mobile') {
            setOtpModalOpen(false);
            setOtpCode('');
            setOtpError(null);
            setOtpInfo(null);
            setOtpVerificationToken(null);
            setOtpVerifiedMobile(null);
            setPendingRegistrationPayload(null);
        }

        // Email suggestion logic
        if (name === 'email') {
            if (value.includes('@')) {
                const [, domainPart] = value.split('@');
                if (domainPart !== undefined) {
                    const filtered = COMMON_DOMAINS.filter(d => d.startsWith(domainPart));
                    setEmailSuggestions(filtered);
                    setShowEmailSuggestions(filtered.length > 0);
                } else {
                    setShowEmailSuggestions(false);
                }
            } else {
                setShowEmailSuggestions(false);
            }
        }
    };

    const handleEmailSuggestionClick = (domain: string) => {
        const [localPart] = formData.email.split('@');
        setFormData(prev => ({ ...prev, email: `${localPart}@${domain}` }));
        setShowEmailSuggestions(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'pan' | 'cons_pan') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Cancel any ongoing request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Create new controller
            const controller = new AbortController();
            abortControllerRef.current = controller;

            if (fieldName === 'pan') {
                setIsUploadingInvestorPan(true);
            } else {
                setIsUploadingConsultantPan(true);
            }

            const formData = new FormData();
            formData.append('pan', file);

            // Generate idempotency key
            const idempotencyKey = crypto.randomUUID();
            formData.append('idempotency_key', idempotencyKey);

            try {
                const response = await fetch('https://preprodinvestuttarakhand.com/uat_swcs/ukautofill/pan-register', {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                // Populate fields
                if (data.extracted_data) {
                    setFormData(prev => ({
                        ...prev,
                        [fieldName]: data.extracted_data.pan_no || prev[fieldName],
                        // Map name_on_pan to fullName or cons_fullName based on fieldName
                        [fieldName === 'pan' ? 'fullName' : 'cons_fullName']: data.extracted_data.name_on_pan || prev[fieldName === 'pan' ? 'fullName' : 'cons_fullName']
                    }));
                }

            } catch (error: any) {
                if (error.name === 'AbortError') {
                    console.log('Request cancelled due to new upload');
                } else {
                    console.error('Upload failed:', error);
                    alert(`Upload failed: ${error.message}`);
                }
            } finally {
                if (fieldName === 'pan') {
                    setIsUploadingInvestorPan(false);
                } else {
                    setIsUploadingConsultantPan(false);
                }
                abortControllerRef.current = null;
            }
        }
    };

    const validatePassword = (pwd: string) => {
        const criteria = {
            length: pwd.length >= 8,
            upper: /[A-Z]/.test(pwd),
            lower: /[a-z]/.test(pwd),
            number: /[0-9]/.test(pwd),
            special: /[^A-Za-z0-9]/.test(pwd),
        };
        return criteria;
    };

    const passwordCriteria = validatePassword(formData.password);
    const isPasswordValid = Object.values(passwordCriteria).every(Boolean);
    const isCurrentMobileVerified =
        isNmcTenant &&
        !!otpVerificationToken &&
        otpVerifiedMobile === formData.mobile.trim();
    const nmcMaxDateOfBirth = useMemo(() => {
        const today = new Date();
        const minimumDob = new Date(today);
        minimumDob.setFullYear(today.getFullYear() - MIN_NMC_AGE);
        return minimumDob.toISOString().split('T')[0];
    }, []);
    const activeStakeholder = stakeholderOptions.find((option) => option.key === registerAs) || stakeholderOptions[0];
    const themeCopy = THEME_COPY[tenantTheme];
    const loginHref = tenantTheme === 'nmc'
        ? NMC_LOGIN_HREF
        : tenantTheme === 'default'
            ? '/login'
            : `/login?tenant=${tenantTheme}`;
    const verifyEmailHref = tenantTheme === 'default'
        ? '/verify-email?registered=true'
        : `/verify-email?registered=true&tenant=${tenantTheme}`;

    const getErrorMessage = (err: any, fallback = "Registration failed. Please try again.") => {
        const responseData = err?.response?.data;
        const message = responseData?.message;

        if (Array.isArray(message)) {
            return message[0];
        }

        if (typeof message === 'string' && message.trim()) {
            return message;
        }

        if (typeof responseData?.error === 'string' && responseData.error.trim()) {
            return responseData.error;
        }

        return fallback;
    };

    const buildLoginSuccessHref = () => {
        const separator = loginHref.includes('?') ? '&' : '?';
        return `${loginHref}${separator}registered=success`;
    };

    const resolveVerificationHref = (verificationUrl?: string) => {
        if (!verificationUrl) {
            return verifyEmailHref;
        }

        try {
            const parsedUrl = new URL(verificationUrl);
            const params = new URLSearchParams(parsedUrl.search);
            params.set('registered', 'true');

            if (tenantTheme !== 'default' && !params.has('tenant')) {
                params.set('tenant', tenantTheme);
            }

            return `${parsedUrl.pathname}?${params.toString()}`;
        } catch {
            return verificationUrl;
        }
    };

    const buildRegistrationPayload = (
        trimmedFullName: string,
        trimmedEmail: string,
        trimmedMobile: string,
        trimmedAddress: string,
        trimmedDateOfBirth: string,
    ) => {
        const nameParts = trimmedFullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '.';

        const payload: any = {
            email: trimmedEmail,
            password: formData.password,
            firstName,
            lastName,
            mobile: trimmedMobile,
            address: trimmedAddress,
            stakeholderType: registerAs,
            roleId: activeStakeholder?.roleId ?? INVESTOR_ROLE_ID,
            tenant: tenantTheme !== 'default' ? tenantTheme : undefined,
        };

        if (!isNmcTenant) {
            payload.pan = formData.pan;
            payload.legalEntityName = formData.legalEntityName;
        } else {
            payload.username = formData.username.trim();
            payload.gender = formData.gender.trim().toUpperCase();
            payload.dateOfBirth = trimmedDateOfBirth;
        }

        if (registerAs === 'onBehalf') {
            payload.cons_pan = formData.cons_pan;
            payload.cons_mobile = formData.cons_mobile;
            payload.cons_fullName = formData.cons_fullName;
            payload.cons_email = formData.cons_email;
        }

        return payload;
    };

    const submitRegistrationPayload = async (payload: Record<string, any>) => {
        const response = await apiClient.post('/auth/register', payload);
        const redirectUrl =
            response?.data?.redirectUrl ||
            response?.data?.data?.redirectUrl;
        const verificationUrl =
            response?.data?.verificationUrl ||
            response?.data?.data?.verificationUrl;
        const isEmailVerified =
            response?.data?.user?.isEmailVerified === 1 ||
            response?.data?.data?.user?.isEmailVerified === 1;

        if (redirectUrl) {
            setSuccess("Registration successful! Redirecting to citizen login...");
            window.setTimeout(() => {
                window.location.assign(redirectUrl);
            }, 700);
            return;
        }

        if (isEmailVerified) {
            setSuccess("Registration successful! Your account is active now. Redirecting to login...");
            window.setTimeout(() => {
                router.push(buildLoginSuccessHref());
            }, 700);
            return;
        }

        setSuccess(activationSuccessMessage);
        window.setTimeout(() => {
            router.push(resolveVerificationHref(verificationUrl));
        }, 700);
    };

    const requestRegistrationOtp = async (mobile: string) => {
        setOtpError(null);
        setOtpInfo(null);
        setOtpSending(true);

        try {
            const response = await apiClient.post('/auth/register-otp/send', {
                mobile,
                tenant: tenantTheme,
            });
            setOtpInfo(
                response?.data?.message ||
                response?.data?.data?.message ||
                'OTP sent successfully.',
            );
        } catch (err: any) {
            throw new Error(
                getErrorMessage(err, 'Unable to send OTP right now. Please try again.'),
            );
        } finally {
            setOtpSending(false);
        }
    };

    const applyRegistrationError = (err: any) => {
        const message = err?.response?.data?.message;

        if (message === 'EMAIL_EXISTS_UNVERIFIED') {
            setError("EMAIL_EXISTS_UNVERIFIED");
            return;
        }

        const readableError = getErrorMessage(err);
        setError(readableError);

    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!formRef.current?.reportValidity()) {
            return;
        }

        const trimmedFullName = formData.fullName.trim();
        const trimmedMobile = formData.mobile.trim();
        const trimmedEmail = formData.email.trim();
        const trimmedUsername = formData.username.trim();
        const trimmedAddress = formData.address.trim();
        const trimmedDateOfBirth = formData.dateOfBirth.trim();

        if (!trimmedFullName) {
            setError("Full name is required");
            return;
        }

        if (trimmedFullName.length > FULL_NAME_MAX_LENGTH) {
            setError(`Full name must be ${FULL_NAME_MAX_LENGTH} characters or fewer`);
            return;
        }

        if (!/^\d{10}$/.test(trimmedMobile)) {
            setError("Mobile number must be exactly 10 digits");
            return;
        }

        if (isNmcTenant && !trimmedUsername) {
            setError("Username is required");
            return;
        }

        if (isNmcTenant && trimmedUsername.length > USERNAME_MAX_LENGTH) {
            setError(`Username must be ${USERNAME_MAX_LENGTH} characters or fewer`);
            return;
        }

        if (isNmcTenant && !formData.gender) {
            setError("Gender is required");
            return;
        }

        if (isNmcTenant && !trimmedDateOfBirth) {
            setError("Date of birth is required");
            return;
        }

        if (isNmcTenant && trimmedDateOfBirth > nmcMaxDateOfBirth) {
            setError("Applicant must be at least 18 years old");
            return;
        }

        if (trimmedAddress.length > ADDRESS_MAX_LENGTH) {
            setError(`Address must be ${ADDRESS_MAX_LENGTH} characters or fewer`);
            return;
        }

        if (!EMAIL_REGEX.test(trimmedEmail) || trimmedEmail.length > EMAIL_MAX_LENGTH) {
            setError("Please enter a valid email address");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!isPasswordValid) {
            setError("Password does not meet all criteria");
            return;
        }

        const payload = buildRegistrationPayload(
            trimmedFullName,
            trimmedEmail,
            trimmedMobile,
            trimmedAddress,
            trimmedDateOfBirth,
        );

        if (isNmcTenant) {
            if (mobileCheckStatus?.status === 'MOBILE_EXISTS') {
                setError(mobileCheckStatus.message);
                return;
            }

            if (emailCheckStatus?.status === 'EMAIL_EXISTS_UNVERIFIED') {
                setError("EMAIL_EXISTS_UNVERIFIED");
                return;
            }

            if (emailCheckStatus?.status === 'EMAIL_EXISTS') {
                setError(emailCheckStatus.message);
                return;
            }

            const hasVerifiedOtpForMobile =
                otpVerificationToken && otpVerifiedMobile === trimmedMobile;

            if (!hasVerifiedOtpForMobile) {
                setSubmitting(true);
                try {
                    await requestRegistrationOtp(trimmedMobile);
                    setPendingRegistrationPayload(payload);
                    setOtpModalOpen(true);
                    setSuccess('OTP sent to your mobile number. Please enter it to complete registration.');
                } catch (err: any) {
                    setError(err.message || 'Unable to send OTP right now. Please try again.');
                } finally {
                    setSubmitting(false);
                }
                return;
            }

            payload.otpVerificationToken = otpVerificationToken;
        }

        setSubmitting(true);

        try {
            await submitRegistrationPayload(payload);
        } catch (err: any) {
            applyRegistrationError(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifyOtp = async () => {
        const trimmedMobile = formData.mobile.trim();
        const normalizedOtp = otpCode.replace(/\D/g, '');

        if (!pendingRegistrationPayload) {
            setOtpError('Please click Register again to request a fresh OTP.');
            return;
        }

        if (!/^\d{4,8}$/.test(normalizedOtp)) {
            setOtpError('Please enter a valid OTP.');
            return;
        }

        setOtpError(null);
        setOtpInfo(null);
        setError(null);
        setSuccess(null);
        setOtpVerifying(true);

        let token = '';

        try {
            const response = await apiClient.post('/auth/register-otp/verify', {
                mobile: trimmedMobile,
                otp: normalizedOtp,
                tenant: tenantTheme,
            });
            token =
                response?.data?.data?.otpVerificationToken ||
                response?.data?.otpVerificationToken;

            if (!token) {
                throw new Error('OTP verification token missing');
            }
        } catch (err: any) {
            if (err?.message === 'OTP verification token missing') {
                setOtpError('OTP verification failed. Please try again.');
            } else {
                setOtpError(getErrorMessage(err, 'OTP verification failed. Please try again.'));
            }
            setOtpVerifying(false);
            return;
        }

        setOtpVerificationToken(token);
        setOtpVerifiedMobile(trimmedMobile);
        setOtpModalOpen(false);
        setOtpCode('');
        setPendingRegistrationPayload(null);

        setSubmitting(true);

        try {
            await submitRegistrationPayload({
                ...pendingRegistrationPayload,
                otpVerificationToken: token,
            });
        } catch (err: any) {
            applyRegistrationError(err);
        } finally {
            setOtpVerifying(false);
            setSubmitting(false);
        }
    };

    const handleResendOtp = async () => {
        const trimmedMobile = formData.mobile.trim();

        if (!/^\d{10}$/.test(trimmedMobile)) {
            setOtpError('Please enter a valid mobile number first.');
            return;
        }

        try {
            await requestRegistrationOtp(trimmedMobile);
        } catch (err: any) {
            setOtpError(err.message || 'Unable to resend OTP right now. Please try again.');
        }
    };

    const handleResendVerification = async () => {
        try {
            const response = await apiClient.post('/auth/resend-verification', { email: formData.email });
            const verificationUrl =
                response?.data?.verificationUrl ||
                response?.data?.data?.verificationUrl;

            if (verificationUrl) {
                router.push(resolveVerificationHref(verificationUrl));
                return;
            }

            alert('Verification email sent successfully!');
            setError(null);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to send verification email.');
        }
    };

    return (
        <div className="register-wrap d-flex">
            <div className="reg-lft-image w-100">
                <img src="/img/img-registration.jpg" alt="Registration" className="w-100" />
            </div>
            <div className="reg-rgt-form">
                <div className="top-patch">
                    <span className="badge bg-primary text-white mb-2 d-none">{t("Register as")}</span>
                    <h4 className="mb-2">{themeCopy.badge}</h4>
                    <p className={`${styles.summary} d-none`}>{themeCopy.summary}</p>
                </div>

                {/* Role Selection - Radio Buttons */}
                <div className="p-5 d-none">
                    <div className={styles.optionGrid}>
                        {stakeholderOptions.map(({ key, label }) => (
                            <label
                                key={key}
                                className={`${styles.optionCard} ${registerAs === key ? styles.optionCardActive : ''}`}
                                htmlFor={`role-${key}`}
                            >
                                <input
                                    className={styles.optionInput}
                                    type="radio"
                                    name="registerAs"
                                    id={`role-${key}`}
                                    value={key}
                                    checked={registerAs === key}
                                    onChange={() => setRegisterAs(key)}
                                />
                                <span className={styles.optionLabel}>{label}</span>
                            </label>
                        ))}
                    </div>
                    {tenantTheme === 'cpcb' && (
                        <div className={styles.helperNote}>
                            ULB and BWG registrations create or reuse dedicated roles during registration. Other CPCB stakeholder options currently use the applicant role.
                        </div>
                    )}
                </div>

            <div ref={feedbackRef}>
                {success && <div className="alert alert-success">{success}</div>}
                {error && error !== 'EMAIL_EXISTS_UNVERIFIED' && <div className="alert alert-danger">{error}</div>}
            </div>

                <form ref={formRef} onSubmit={handleSubmit} className={`${styles.formBody} reg-form`}>
                    {/* Applicant Information Section (Conditional) */}
                    {registerAs === 'onBehalf' && (
                        <div className={`mb-4 p-5 border rounded ${styles.consultantCard}`}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0">{t("Consultant Information")}</h5>
                                <div>
                                    <button
                                        className={`btn btn-sm ${styles.secondaryAction}`}
                                        type="button"
                                        onClick={() => consultantPanRef.current?.click()}
                                        disabled={isUploadingConsultantPan}
                                    >
                                        {isUploadingConsultantPan ? (
                                            <React.Fragment><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Uploading...</React.Fragment>
                                        ) : (
                                            <React.Fragment><i className="bi bi-upload me-2"></i>{t("Upload PAN")}</React.Fragment>
                                        )}
                                    </button>
                                    <input
                                        type="file"
                                        ref={consultantPanRef}
                                        className="d-none"
                                        accept="image/*,.pdf"
                                        onChange={(e) => handleFileUpload(e, 'cons_pan')}
                                    />
                                </div>
                            </div>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">{t("Full Name")}</label>
                                    <input type="text" className="form-control" name="cons_fullName" value={formData.cons_fullName} onChange={handleChange} required />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">{t("Email")}</label>
                                    <input type="email" className="form-control" name="cons_email" value={formData.cons_email} onChange={handleChange} required />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">{t("Mobile")}</label>
                                    <input type="tel" className="form-control" name="cons_mobile" value={formData.cons_mobile} onChange={handleChange} required />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">{t("PAN")}</label>
                                    <input type="text" className="form-control" name="cons_pan" value={formData.cons_pan} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0 form-title d-none">
                            {activeStakeholder?.label || t("Investor")} Information
                        </h5>
                        {!isNmcTenant && (
                            <div>
                                <button
                                    className={`btn btn-sm ${styles.secondaryAction}`}
                                    type="button"
                                    onClick={() => investorPanRef.current?.click()}
                                    disabled={isUploadingInvestorPan}
                                >
                                    {isUploadingInvestorPan ? (
                                        <React.Fragment><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Uploading...</React.Fragment>
                                    ) : (
                                        <React.Fragment><i className="bi bi-upload me-2"></i>{t("Upload PAN")}</React.Fragment>
                                    )}
                                </button>
                                <input
                                    type="file"
                                    ref={investorPanRef}
                                    className="d-none"
                                    accept="image/*,.pdf"
                                    onChange={(e) => handleFileUpload(e, 'pan')}
                                />
                            </div>
                        )}
                    </div>
                    <div className="row g-3">
                        {/* PAN */}
                        {!isNmcTenant && (
                            <div className="col-md-4">
                                <label className="form-label">{t("PAN")}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="pan"
                                    value={formData.pan}
                                    onChange={handleChange}
                                    placeholder="Enter your PAN"
                                />
                                {isCheckingPan && <div className="text-muted small mt-1">Checking availability...</div>}
                                {!isCheckingPan && panCheckStatus && (
                                    <div className={`small mt-1 ${panCheckStatus.status === 'AVAILABLE' ? 'text-success' : 'text-danger'}`}>
                                        {panCheckStatus.status === 'AVAILABLE' ? <i className="bi bi-check-circle me-1"></i> : <i className="bi bi-exclamation-circle me-1"></i>}
                                        {panCheckStatus.message}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Full Name */}
                        <div className={isNmcTenant ? 'col-md-6' : 'col-md-4'}>
                            <label className="form-label">{t("Full Name")}</label>
                            <input
                                type="text"
                                className="form-control"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                maxLength={FULL_NAME_MAX_LENGTH}
                                title={`Full name must be ${FULL_NAME_MAX_LENGTH} characters or fewer`}
                                required
                            />
                        </div>

                    {/* Legal Entity Name */}
                    {!isNmcTenant && (
                        <div className="col-md-4">
                            <label className="form-label">{t("Legal Entity Name")}</label>
                            <input
                                type="text"
                                className="form-control"
                                name="legalEntityName"
                                value={formData.legalEntityName}
                                onChange={handleChange}
                                placeholder="Enter legal entity name"
                            />
                        </div>
                    )}

                    {/* Mobile */}
                    {isNmcTenant && (
                        <div className="col-md-6">
                            <label className="form-label">{t("Username")}</label>
                            <input
                                type="text"
                                className="form-control"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Enter your username"
                                maxLength={USERNAME_MAX_LENGTH}
                                title={`Username must be ${USERNAME_MAX_LENGTH} characters or fewer`}
                                required
                            />
                        </div>
                    )}

                    <div className={isNmcTenant ? 'col-md-6' : 'col-md-4'}>
                        <label className="form-label d-inline-flex align-items-center gap-1">
                            {t("Mobile")}
                            {isNmcTenant && (
                                <i
                                    className="bi bi-info-circle text-muted"
                                    title="An OTP will be sent to this mobile number after you click Register."
                                    aria-label="An OTP will be sent to this mobile number after you click Register."
                                    style={{ cursor: 'help' }}
                                />
                            )}
                        </label>
                        <input
                            type="tel"
                            className="form-control"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleChange}
                            placeholder="Enter your mobile no."
                            inputMode="numeric"
                            pattern="\d{10}"
                            minLength={MOBILE_LENGTH}
                            maxLength={MOBILE_LENGTH}
                            title="Mobile number must be exactly 10 digits"
                            required
                        />
                        {isCurrentMobileVerified && (
                            <div className="text-success small mt-1">
                                <i className="bi bi-check-circle me-1"></i>
                                Mobile number verified successfully
                            </div>
                        )}
                        {isCheckingMobile && <div className="text-muted small mt-1">Checking availability...</div>}
                        {!isCheckingMobile && mobileCheckStatus && (
                            <div className={`small mt-1 ${mobileCheckStatus.status === 'AVAILABLE' ? 'text-success' : 'text-danger'}`}>
                                {mobileCheckStatus.status === 'AVAILABLE' ? <i className="bi bi-check-circle me-1"></i> : <i className="bi bi-exclamation-circle me-1"></i>}
                                {mobileCheckStatus.message}
                            </div>
                        )}
                    </div>

                    {/* Date of Birth */}
                    {isNmcTenant && (
                        <div className="col-md-6">
                            <label className="form-label">{t("Gender")}</label>
                            <select
                                className="form-select"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select gender</option>
                                <option value="MALE">{t("Male")}</option>
                                <option value="FEMALE">{t("Female")}</option>
                                <option value="TRANSGENDER">{t("Transgender")}</option>
                            </select>
                        </div>
                    )}

                    {isNmcTenant && (
                        <div className="col-md-6">
                            <label className="form-label">{t("Date of Birth")}</label>
                            <input
                                type="date"
                                className="form-control"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                max={nmcMaxDateOfBirth}
                                title="Applicant must be at least 18 years old"
                                required
                            />
                        </div>
                    )}

                    {/* Address */}
                    <div className={isNmcTenant ? 'col-md-6' : 'col-md-8'}>
                        <label className="form-label">{t("Address")}</label>
                        <input
                            type="text"
                            className="form-control"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter your address"
                            maxLength={ADDRESS_MAX_LENGTH}
                            title={`Address must be ${ADDRESS_MAX_LENGTH} characters or fewer`}
                        />
                    </div>

                        {/* Email */}
                        <div className="col-md-6 position-relative">
                            <label className="form-label">{t("Email")}</label>
                            <input
                                type="email"
                                className="form-control"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                maxLength={EMAIL_MAX_LENGTH}
                                title="Enter a valid email address"
                                required
                                autoComplete="off"
                            />
                            {showEmailSuggestions && (
                                <ul className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                    {emailSuggestions.map(domain => (
                                        <li
                                            key={domain}
                                            className="list-group-item list-group-item-action cursor-pointer"
                                            onClick={() => handleEmailSuggestionClick(domain)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {formData.email.split('@')[0]}@{domain}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {error === 'EMAIL_EXISTS_UNVERIFIED' && (
                                <div className="text-danger small mt-1">
                                    You already have an account which is not active.{' '}
                                    <span
                                        className="text-primary text-decoration-underline"
                                        style={{ cursor: 'pointer' }}
                                        onClick={handleResendVerification}
                                    >
                                        Click here to verify
                                    </span>
                                </div>
                            )}
                            {isCheckingEmail && <div className="text-muted small mt-1">Checking availability...</div>}
                            {!isCheckingEmail && emailCheckStatus && (
                                <div className={`small mt-1 ${emailCheckStatus.status === 'AVAILABLE' ? 'text-success' : 'text-danger'}`}>
                                    {emailCheckStatus.status === 'AVAILABLE' ? <i className="bi bi-check-circle me-1"></i> : <i className="bi bi-exclamation-circle me-1"></i>}
                                    {emailCheckStatus.message}
                                </div>
                            )}
                        </div>

                        {/* Password */}
                        <div className="col-md-6 position-relative">
                            <label className="form-label">{t("Password")}</label>
                            <div className="input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-control rounded-2"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onFocus={() => setShowPasswordCriteria(true)}
                                    onBlur={() => setShowPasswordCriteria(false)}
                                    placeholder="Enter your password"
                                    minLength={8}
                                    required
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary position-absolute end-0 top-0 h-100 p-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                                </button>
                            </div>
                            {showPasswordCriteria && !isPasswordValid && (
                                <div className="card position-absolute start-0 w-100 mt-1 shadow-sm" style={{ zIndex: 1000 }}>
                                    <div className="card-body p-2 small">
                                        <div className={passwordCriteria.length ? 'text-success' : 'text-danger'}>
                                            <i className={`bi bi-${passwordCriteria.length ? 'check' : 'x'}`}></i> Min 8 chars
                                        </div>
                                        <div className={passwordCriteria.upper ? 'text-success' : 'text-danger'}>
                                            <i className={`bi bi-${passwordCriteria.upper ? 'check' : 'x'}`}></i> Uppercase
                                        </div>
                                        <div className={passwordCriteria.lower ? 'text-success' : 'text-danger'}>
                                            <i className={`bi bi-${passwordCriteria.lower ? 'check' : 'x'}`}></i> Lowercase
                                        </div>
                                        <div className={passwordCriteria.number ? 'text-success' : 'text-danger'}>
                                            <i className={`bi bi-${passwordCriteria.number ? 'check' : 'x'}`}></i> Number
                                        </div>
                                        <div className={passwordCriteria.special ? 'text-success' : 'text-danger'}>
                                            <i className={`bi bi-${passwordCriteria.special ? 'check' : 'x'}`}></i> Special char
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="col-md-6">
                            <label className="form-label">{t("Confirm Password")}</label>
                            <div className="input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-control rounded-2"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Enter your password again"
                                    minLength={8}
                                    required
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary position-absolute end-0 top-0 h-100 p-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                                </button>
                            </div>
                        </div>

                        <div className={`col-12 mt-5 ${styles.actionsRow}`}>
                            <button type="submit" className="btn btn-primary justify-content-center" disabled={submitting}>
                                {submitting ? t('Registering') : t('Register')}
                            </button>
                        </div>

                        <div className="text-center mt-3">
                            <p>
                                {t("Already have an account")}? <a href={loginHref} className={styles.loginLink}>{t("Log In")}</a>
                            </p>
                        </div>
                    </div>
            </form>

            {otpModalOpen && (
                <div className={styles.otpOverlay} role="dialog" aria-modal="true" aria-labelledby="nmc-otp-title">
                    <div className={styles.otpDialog}>
                        <div className={styles.otpHeader}>
                            <div>
                                <h5 id="nmc-otp-title" className="mb-1">Verify Mobile Number</h5>
                                <p className="mb-0 text-muted small">
                                    OTP sent to {formData.mobile}. Enter it below to complete your registration.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Close"
                                onClick={() => setOtpModalOpen(false)}
                                disabled={otpVerifying}
                            />
                        </div>

                        <div className={styles.otpBody}>
                            {otpInfo && <div className="alert alert-info py-2 mb-3">{otpInfo}</div>}
                            {otpError && <div className="alert alert-danger py-2 mb-3">{otpError}</div>}

                            <label className="form-label">OTP</label>
                            <input
                                type="text"
                                className="form-control"
                                value={otpCode}
                                onChange={(e) => {
                                    setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8));
                                    setOtpError(null);
                                }}
                                inputMode="numeric"
                                maxLength={8}
                                placeholder="Enter OTP"
                                autoFocus
                            />

                            <div className={styles.otpActions}>
                                <button
                                    type="button"
                                    className="btn btn-link px-0"
                                    onClick={handleResendOtp}
                                    disabled={otpSending || otpVerifying}
                                >
                                    {otpSending ? 'Resending OTP...' : 'Resend OTP'}
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${styles.primaryAction}`}
                                    onClick={handleVerifyOtp}
                                    disabled={otpVerifying || submitting}
                                >
                                    {otpVerifying || submitting ? 'Verifying...' : 'Verify OTP'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
