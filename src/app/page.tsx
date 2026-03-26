"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardPanel } from "@/components/dashboard-panel";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (window.sessionStorage.getItem("openclaw-admin-auth") !== "ok") {
      router.replace("/login");
    }
  }, [router]);

  return (
    <DashboardPanel
      onLogout={() => {
        window.sessionStorage.removeItem("openclaw-admin-auth");
        router.replace("/login");
      }}
    />
  );
}
