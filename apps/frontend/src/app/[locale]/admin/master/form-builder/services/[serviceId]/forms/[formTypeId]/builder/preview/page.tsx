import { FormPreview } from '@/components/admin/master/formBuilder/FormPreview';

export default async function FormPreviewPage({
  params,
}: {
  params: Promise<{ locale: string; serviceId: string; formTypeId: string }>;
}) {
  const { serviceId, formTypeId } = await params;

  return <FormPreview serviceId={serviceId} formTypeId={Number(formTypeId)} />;
}