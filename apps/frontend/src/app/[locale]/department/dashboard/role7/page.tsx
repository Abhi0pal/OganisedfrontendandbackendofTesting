"use client";

import { useEffect } from "react";
import { useRouter } from "@/navigation";

export default function DepartmentRole7DashboardRoute() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/department/dashboard");
  }, [router]);

  return null;
}

