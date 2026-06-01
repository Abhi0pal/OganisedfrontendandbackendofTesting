'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
export default function ReferencesPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale ?? 'en';
  useEffect(() => { router.replace(`/${locale}/admin/dynamic-master/definitions`); }, [router, locale]);
  return null;
}
