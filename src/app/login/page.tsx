"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLogin } from "@/components/admin-login";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (window.sessionStorage.getItem("openclaw-admin-auth") === "ok") {
      router.replace("/");
    }
  }, [router]);

  return <AdminLogin />;
}
