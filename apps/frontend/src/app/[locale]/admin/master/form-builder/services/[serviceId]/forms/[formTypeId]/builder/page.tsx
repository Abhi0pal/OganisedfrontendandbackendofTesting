import { FormBuilderScreen } from '@/components/admin/master/formBuilder/FormBuilderScreen';

export default async function FormBuilderPage({
  params,
}: {
  params: Promise<{ locale: string; serviceId: string; formTypeId: string }>;
}) {
  // ✅ Next.js 15: params must be awaited
  const { serviceId, formTypeId } = await params;

  return <FormBuilderScreen serviceId={serviceId} formTypeId={Number(formTypeId)} />;
}