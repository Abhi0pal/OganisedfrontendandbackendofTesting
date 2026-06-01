
import { Body, Controller, Post } from '@nestjs/common';
import { SkipResourceCheck } from '../../common/skip-resource-check.decorator';
import { Public } from '../../common/public.decorator';

/**
 * Department API mock for local testing
 * Base path: /mock
 */
@Controller('mock')
export class MockController {
  /**
   * Handshake: returns an envelope like a department would.
   * Expected body: { uid, secret_key }
   */
  @Public()
  @SkipResourceCheck()
  @Post()
  handshake(@Body() body: any) {
    const { uid, secret_key } = body || {};
    if (!uid || !secret_key) {
      return { statusCode: 400, message: 'Bad Request: uid and secret_key required' };
    }

    return {
      statusCode: 200,
      message: 'OK',
      endpoint: 'http://localhost:3001/mock/sso/submit', // registration endpoint
      uid,
      redirectUrl: `http://localhost:3000/en/mock-dept-portal?uid=${encodeURIComponent(uid)}`,
    };
  }

  /**
   * Registration: accepts your consolidated payload; returns redirect URL.
   */
  @Public()
  @SkipResourceCheck()
  @Post('sso/submit')
  submit(@Body() body: any) {
    if (!body?.user || !body?.caf || !body?.documents) {
      return { statusCode: 400, message: 'Bad Request: user, caf, documents are required' };
    }

    const appId = body?.caf?.app_id || 'UNKNOWN';
    return {
      statusCode: 200,
      message: 'Applicant registered',
      redirectUrl: `http://localhost:3000/en/mock-dept-portal?app=${encodeURIComponent(appId)}`,
      uid: body?.caf?.in_principle_id || '',
    };
  }

  /**
   * Pull status: optional mock—returns a static status payload.
   */
  @Public()
  @SkipResourceCheck()
  @Post('status/pull')
  pullStatus(@Body() body: any) {
    return {
      statusCode: 200,
      message: 'Success',
      payload: {
        dept_reference_no: 'MOCK-REF-123',
        application_stage: 'Under Process',
        current_status: 'Processing',
        submission_date: new Date().toISOString(),
        approval_no: null,
        approval_date: null,
        certificate_type: 1,
        certificate_url: 'http://localhost:3001/files/certificates/mock-certificate.pdf',
        certificate_base64: null,
        valid_upto: null,
      },
    };
  }

  /**
   * Update status: optional mock—echoes back what you send.
   */
  @Public()
  @SkipResourceCheck()
  @Post('status/update')
  updateStatus(@Body() body: any) {
    return { statusCode: 200, message: 'Status updated (mock)', payload: body };
  }
}