import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Providers } from "../providers";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import "@/app/globals.css";
import "../../../styles/variables.css";
import "../../../styles/include.css";
import "../../../styles/style.css";
import "../../../styles/component.css";
import "../../../styles/responsive.css";
import "../../../styles/animate.min.css";

import LocaleLayoutClient from "./layout.client";

const locales = ["en", "hi"];

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>; // ✅ Promise
}) {
  // ✅ MUST await params in Next.js 16
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <Providers>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <LocaleLayoutClient>{children}</LocaleLayoutClient>
      </NextIntlClientProvider>
    </Providers>
  );
}
