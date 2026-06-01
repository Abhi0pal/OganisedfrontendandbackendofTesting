'use client';
import { Suspense } from 'react';
import { DynamicMasterData } from '@/components/admin/master/DynamicMasterData';
export default function MasterDataPage() {
  return <Suspense><DynamicMasterData /></Suspense>;
}
