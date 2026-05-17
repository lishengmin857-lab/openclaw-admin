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
      .then((result: {
        admin: {
          displayName: string;
          phone: string;
          role: string;
          inviteCode?: string;
          canGrantMembership?: boolean;
        };
      }) => {
        window.sessionStorage.setItem("openclaw-admin-auth", "ok");
        window.localStorage.setItem("openclaw-admin-name", result.admin.displayName);
        window.localStorage.setItem("openclaw-admin-phone", result.admin.phone);
        window.localStorage.setItem("openclaw-admin-role", result.admin.role);
        if (result.admin.canGrantMembership) {
          window.localStorage.setItem("openclaw-admin-can-grant-membership", "1");
        } else {
          window.localStorage.removeItem("openclaw-admin-can-grant-membership");
        }
        if (result.admin.inviteCode) {
          window.localStorage.setItem("openclaw-admin-invite", result.admin.inviteCode);
        } else {
          window.localStorage.removeItem("openclaw-admin-invite");
        }
        setReady(true);
      })
      .catch(() => {
        window.sessionStorage.removeItem("openclaw-admin-auth");
        window.localStorage.removeItem("openclaw-admin-token");
        window.localStorage.removeItem("openclaw-admin-name");
        window.localStorage.removeItem("openclaw-admin-phone");
        window.localStorage.removeItem("openclaw-admin-can-grant-membership");
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
