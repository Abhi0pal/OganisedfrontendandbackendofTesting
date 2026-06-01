"use client";

import type { Dispatch, SetStateAction } from "react";

export type DashboardStatusCard<T extends string = string> = {
  key: T;
  label: string;
  value: number;
  badge?: string;
};

export type DashboardStatusCardsProps<T extends string = string> = {
  cards: DashboardStatusCard<T>[];
  activeKey: T;
  loading?: boolean;
  onSelectStatus: (status: T) => void;
};

export function DashboardStatusCards<T extends string>({
  cards,
  activeKey,
  loading = false,
  onSelectStatus,
}: DashboardStatusCardsProps<T>) {
  return (
    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-5 g-3 mb-4">
      {cards.map((card) => (
        <div className="col" key={card.key}>
          <div
            className={`card shadow-sm border-0 h-100 cursor-pointer ${
              activeKey === card.key ? "border border-primary" : ""
            }`}
            onClick={() => onSelectStatus(card.key)}
            role="button"
          >
            <div className="card-body">
              <div className="text-muted small mb-2 d-flex align-items-center gap-2">
                <span>{card.label}</span>
                {card.badge && <span className="badge bg-secondary">{card.badge}</span>}
              </div>
              <div className="fs-3 fw-bold">{loading ? "..." : card.value}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
