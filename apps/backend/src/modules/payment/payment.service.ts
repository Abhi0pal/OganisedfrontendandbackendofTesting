import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WorkflowRuntimeService } from '../workflow-runtime/workflow-runtime.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => WorkflowRuntimeService))
    private workflowRuntimeService: WorkflowRuntimeService,
  ) { }

  async simulatePayment(applicationId: number) {
    const pendingPayment = await this.prisma.paymentDetail.findFirst({
      where: {
        applicationId,
        statusCode: 'P',
      },
    });

    if (!pendingPayment) {
      throw new NotFoundException('No pending payment found for this application');
    }

    const updated = await this.prisma.paymentDetail.update({
      where: { paymentId: pendingPayment.paymentId },
      data: {
        statusCode: 'S',
        txnStatus: 'SUCCESS',
        txnMsg: 'Payment completed successfully',
        statusDescription: 'Payment simulated successfully',
        updated: new Date(),
      },
    });

    const now = new Date();
    await this.prisma.applicationHistory.create({
      data: {
        spTag: 'PAYMENT',
        appId: String(applicationId),
        applicationStatus: 'PAYMENT_SUCCESS',
        comments: 'Payment completed successfully by Investor',
        roleId: String(pendingPayment.userId ?? 2),
        addedDateTime: now,
      }
    });

    // After payment success, set application status back to 'F' (processing)
    // so the officer who generated the challan sees it back in their inbox.
    // Do NOT auto-forward — the officer decides the next action.
    try {
      await this.prisma.applicationSubmission.update({
        where: { submissionId: applicationId },
        data: { applicationStatus: 'F', applicationUpdatedDateTime: now },
      });

      // Also update t_sp_applications
      await this.prisma.spApplication.updateMany({
        where: { appId: BigInt(applicationId) },
        data: { appStatus: 'F', updatedOn: now, lastUpdatedDateTime: now },
      });
    } catch (e: any) {
      console.error('Failed to update application status after payment:', e?.message);
    }

    return {
      success: true,
      message: 'Payment simulated successfully',
      paymentId: Number(updated.paymentId),
    };
  }

  async getPaymentDetails(applicationId: number) {
    const payment = await this.prisma.paymentDetail.findFirst({
      where: { 
        OR: [
          { appSubId: applicationId },
          { applicationId: applicationId }
        ]
      },
      orderBy: { created: 'desc' },
    });

    if (payment) {
      const submission = await this.prisma.applicationSubmission.findUnique({
        where: { submissionId: applicationId },
        select: { submissionId: true, serviceId: true }
      });

      let serviceName = 'N/A';
      if (submission?.serviceId) {
        const service = await this.prisma.service.findUnique({
          where: { service_id: submission.serviceId },
          select: { service_name: true }
        });
        serviceName = service?.service_name || 'N/A';
      }

      return {
        ...payment,
        id: Number(payment.paymentId),
        amount: Number(payment.amount),
        totalAmount: Number(payment.totalAmount),
        paymentId: Number(payment.paymentId),
        bifurcationDetails: (payment.bifurcationDetails as any) || [],
        serviceName: serviceName,
        applicationNumber: submission?.submissionId ? String(submission.submissionId) : String(applicationId),
      };
    }
    return null;
  }
}
