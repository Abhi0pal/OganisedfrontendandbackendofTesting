import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale ?? "en"; // 👈 fallback is REQUIRED

  return {
    locale: resolvedLocale,
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default
  };
});
