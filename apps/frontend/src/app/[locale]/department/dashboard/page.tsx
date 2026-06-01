"use client";

import { useEffect } from 'react';
import { useRouter } from '@/navigation';

export default function DepartmentDashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/department/fb-dashboard' as any);
  }, [router]);
  return null;
}
