"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("openclaw-admin-token") || "";
    if (!token) {
      router.replace("/login");
      return;
    }

    fetch("/api/admin/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("UNAUTHORIZED");
        }
        return response.json();
      })
      .then((result: { admin: { displayName: string; phone: string } }) => {
        window.sessionStorage.setItem("openclaw-admin-auth", "ok");
        window.localStorage.setItem("openclaw-admin-name", result.admin.displayName);
        window.localStorage.setItem("openclaw-admin-phone", result.admin.phone);
        setReady(true);
      })
      .catch(() => {
        window.sessionStorage.removeItem("openclaw-admin-auth");
        window.localStorage.removeItem("openclaw-admin-token");
        window.localStorage.removeItem("openclaw-admin-name");
        window.localStorage.removeItem("openclaw-admin-phone");
        router.replace("/login");
      });
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        正在校验管理员身份...
      </div>
    );
  }

  return <AdminShell />;
}
