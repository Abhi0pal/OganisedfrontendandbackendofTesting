export async function initiateSso(payload: {
  dept_tag: string; service_id: string; caf_id: string; app_id: string; uid: string;
}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sso/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data?.statusCode === 200 && data?.redirectUrl) {
    window.open(data.redirectUrl, '_blank', 'noopener,noreferrer');
  }
  return data;
}
