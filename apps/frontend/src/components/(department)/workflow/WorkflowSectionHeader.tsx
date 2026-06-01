"use client";

import { useRouter } from "next/navigation";
import { WorkflowDashboardApplication } from "@/hooks/department/workflow/useWorkflowDashboardData";

export type WorkflowSectionHeaderLink = {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "tertiary";
};

export type WorkflowSectionHeaderProps = {
  title: string;
  description?: string;
  submissionId?: number;
  unitName?: string;
  status?: string;
  serviceId?: string;
  navLinks?: WorkflowSectionHeaderLink[];
};

const variantClass = {
  primary: "btn btn-primary",
  secondary: "btn btn-outline-primary",
  tertiary: "btn btn-outline-secondary",
};

export default function WorkflowSectionHeader({
  title,
  description,
  submissionId,
  unitName,
  status,
  serviceId,
  navLinks = [],
}: WorkflowSectionHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-3 border border-200 shadow-sm mb-4">
      <div className="d-flex align-items-start justify-content-between gap-4 flex-wrap p-4">
        <div className="min-w-0">
          <h1 className="h3 fw-bold text-dark mb-1">{title}</h1>
          {description && <p className="text-muted small mb-0">{description}</p>}
        </div>
        <div className="text-end flex-shrink-0 d-flex flex-column align-items-end gap-2">
          {submissionId && (
            <>
              <span className="text-uppercase small text-muted">CAF :</span>
              <span className="h4 text-primary fw-semibold mb-1">#{submissionId}</span>
            </>
          )}
          {navLinks.length > 0 && (
            <div className="d-flex flex-wrap justify-end gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  className={variantClass[link.variant || "secondary"]}
                  onClick={() => router.push(link.href)}
                >
                  {link.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
