import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

type MailSendResult = {
    delivered: boolean;
    previewUrl?: string;
};

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly transporter: nodemailer.Transporter | null;
    private readonly isProduction = process.env.NODE_ENV === 'production';

    constructor() {
        const smtpUser = process.env.SMTP_USER?.trim();
        const smtpPass = process.env.SMTP_PASS?.trim();

        if (!smtpUser || !smtpPass) {
            this.transporter = null;
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });
    }

    isSmtpConfigured(): boolean {
        return !!this.transporter;
    }

    getActivationLink(token: string): string {
        return this.buildFrontendUrl(`/verify-email?token=${token}`);
    }

    async sendActivationEmail(to: string, token: string): Promise<MailSendResult> {
        const url = this.getActivationLink(token);

        return this.sendMailOrPreview({
            to,
            subject: 'Activate your account',
            html: `
        <p>Please click the link below to activate your account:</p>
        <p><a href="${url}">Activate Account</a></p>
        <p>If you did not request this, please ignore this email.</p>
      `,
            previewUrl: url,
        });
    }

    async sendVerificationEmail(to: string, token: string): Promise<MailSendResult> {
        return this.sendActivationEmail(to, token);
    }

    async sendPasswordResetEmail(to: string, token: string): Promise<MailSendResult> {
        const url = this.buildFrontendUrl(`/reset-password?token=${token}`);

        return this.sendMailOrPreview({
            to,
            subject: 'Reset your password',
            html: `
        <p>You requested a password reset. Please click the link below to reset your password:</p>
        <p><a href="${url}">Reset Password</a></p>
        <p>If you did not request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `,
            previewUrl: url,
        });
    }

    private buildFrontendUrl(path: string) {
        return `${process.env.FRONTEND_URL || 'http://localhost:3000'}${path}`;
    }

    private async sendMailOrPreview({
        to,
        subject,
        html,
        previewUrl,
    }: {
        to: string;
        subject: string;
        html: string;
        previewUrl: string;
    }): Promise<MailSendResult> {
        if (!this.transporter) {
            this.logger.warn(
                `SMTP not configured. Email to ${to} was not sent. Preview URL: ${previewUrl}`,
            );
            return { delivered: false, previewUrl };
        }

        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM || '"No Reply" <noreply@example.com>',
                to,
                subject,
                html,
            });

            return { delivered: true };
        } catch (error) {
            if (this.isProduction) {
                throw error;
            }

            const message = error instanceof Error ? error.message : 'Unknown email error';
            this.logger.warn(
                `Email delivery failed for ${to}. Falling back to preview URL. ${message}. Preview URL: ${previewUrl}`,
            );
            return { delivered: false, previewUrl };
        }
    }
}
