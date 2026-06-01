"use client";

import dynamic from 'next/dynamic';

const InvestorDashboard = dynamic(
  () => import('@/components/(investor)/InvestorDashboard').then((mod) => mod.InvestorDashboard),
  { ssr: false }
);

export default function InvestorDashboardPage() {
  return <InvestorDashboard />;
}
