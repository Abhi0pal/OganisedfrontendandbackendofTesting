import { createNavigation } from "next-intl/navigation";

export const locales = ["en", "hi"] as const;

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation({ locales });
