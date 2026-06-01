"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import apiClient from "@/lib/api-client";

type PaymentDetails = {
  paymentId: number;
  amount: number;
  totalAmount: number;
  statusCode: string;
  serviceName: string;
  applicationNumber: string;
  bifurcationDetails: Array<{ name: string; amount: number }>;
};

export default function SimulatePaymentPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useRef<Toast>(null);
  const applicationId = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

  useEffect(() => {
    if (!applicationId) return;
    
    apiClient
      .get(`/payment/details/${applicationId}`)
      .then((res) => {
        setPaymentDetails(res.data);
      })
      .catch((err) => {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: err?.response?.data?.message || "Failed to load payment details",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [applicationId]);

  const handleSimulatePayment = async () => {
    setSubmitting(true);
    try {
      await apiClient.post("/payment/simulate", { applicationId });
      toast.current?.show({
        severity: "success",
        summary: "Success",
        detail: "Payment successful. The application has been updated.",
      });
      setTimeout(() => {
        router.push(`/${params?.locale || "en"}/investor/applications`);
      }, 1500);
    } catch (err: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.message || "Payment simulation failed",
      });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <ProgressSpinner strokeWidth="4" />
      </div>
    );
  }

  if (!paymentDetails || paymentDetails.statusCode !== "P") {
    return (
      <div style={{ padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Toast ref={toast} />
        <div style={{ background: '#fff', padding: '3rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '100%', maxWidth: '500px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <i className="pi pi-info-circle" style={{ color: '#3b82f6', fontSize: '3rem', marginBottom: '1rem' }}></i>
          <h2 style={{ color: '#111827', fontWeight: 600, marginBottom: '0.5rem' }}>No Pending Payment</h2>
          <p style={{ color: '#4b5563', lineHeight: 1.6, marginBottom: '2rem' }}>
            We couldn't find any pending payment for this application. It might have been already paid or not yet generated.
          </p>
          <Button 
            label="Back to Applications" 
            icon="pi pi-arrow-left" 
            className="p-button-outlined"
            onClick={() => router.push(`/${params?.locale || "en"}/investor/applications`)} 
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center', minHeight: '80vh' }}>
      <Toast ref={toast} />
      
      <div style={{ width: '100%', maxWidth: '650px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          
          {/* Premium Header */}
          <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)", padding: '2rem', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ color: '#dbeafe', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Required</span>
                <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem', marginBottom: 0 }}>{paymentDetails.serviceName}</h2>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.75rem', color: '#eff6ff' }}>
                  <i className="pi pi-file-edit" style={{ marginRight: '0.5rem', fontSize: '0.875rem' }}></i>
                  <span style={{ fontSize: '0.875rem' }}>App No: <strong>{paymentDetails.applicationNumber}</strong></span>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '12px' }}>
                <i className="pi pi-credit-card" style={{ fontSize: '2rem' }}></i>
              </div>
            </div>
          </div>

          <div style={{ padding: '2rem' }}>
            {/* Amount Summary */}
            <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '12px', border: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <span style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>TOTAL AMOUNT PAYABLE</span>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', marginTop: '0.25rem' }}>₹{paymentDetails.totalAmount.toLocaleString()}</div>
              </div>
              <div style={{ display: 'none' }} className="sm:block">
                 <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                    PENDING
                 </span>
              </div>
            </div>

            {/* Accordion for Bifurcation */}
            <div style={{ marginBottom: '2rem' }}>
              <Accordion>
                <AccordionTab header={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <i className="pi pi-list" style={{ marginRight: '0.5rem' }}></i>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>View Fee Breakdown</span>
                  </div>
                }>
                  <div style={{ padding: '0.5rem 0' }}>
                    {paymentDetails.bifurcationDetails.map((bif, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6' }}>
                        <span style={{ color: '#374151' }}>{bif.name}</span>
                        <span style={{ color: '#111827', fontWeight: 500 }}>₹{bif.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', marginTop: '0.25rem' }}>
                      <span style={{ color: '#111827', fontWeight: 700 }}>Subtotal</span>
                      <span style={{ color: '#111827', fontWeight: 800, fontSize: '1.25rem' }}>₹{paymentDetails.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </AccordionTab>
              </Accordion>
            </div>

            {/* Info Alert */}
            <div style={{ background: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '1rem', marginBottom: '2.5rem', borderRadius: '0 8px 8px 0' }}>
              <div style={{ display: 'flex' }}>
                <i className="pi pi-exclamation-triangle" style={{ color: '#d97706', marginRight: '0.75rem', marginTop: '0.25rem' }}></i>
                <div style={{ color: '#92400e', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  <strong>Simulated Gateway:</strong> This is a secure simulation. Clicking the button below will authorize the payment and move your application to the next processing stage.
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Button 
                label={submitting ? "Processing Transaction..." : `Confirm & Pay ₹${paymentDetails.totalAmount.toLocaleString()}`}
                icon={submitting ? "pi pi-spin pi-spinner" : "pi pi-lock"}
                style={{ background: "linear-gradient(to right, #2563eb, #1d4ed8)", padding: '1.25rem', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
                onClick={handleSimulatePayment}
                disabled={submitting}
              />
              <Button 
                label="Cancel & Return" 
                icon="pi pi-times" 
                className="p-button-text p-button-secondary"
                style={{ fontWeight: 500 }}
                onClick={() => router.push(`/${params?.locale || "en"}/investor/applications`)} 
                disabled={submitting}
              />
            </div>
          </div>

          {/* Footer Security Icons */}
          <div style={{ background: '#f9fafb', padding: '1rem', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', color: '#9ca3af', fontSize: '0.7rem' }}>
                <i className="pi pi-shield" style={{ marginRight: '0.4rem' }}></i> SSL SECURE
             </div>
             <div style={{ display: 'flex', alignItems: 'center', color: '#9ca3af', fontSize: '0.7rem' }}>
                <i className="pi pi-verified" style={{ marginRight: '0.4rem' }}></i> VERIFIED BY PCI
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
