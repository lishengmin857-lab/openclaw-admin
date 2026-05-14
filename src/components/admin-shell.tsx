"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { OverviewPanel } from "@/components/overview-panel";
import { OrdersPanel } from "@/components/orders-panel";
import { QuotaFreePanel } from "@/components/quota-free-panel";
import { RegistrationPolicyPanel } from "@/components/registration-policy-panel";
import { SettingsPanel } from "@/components/settings-panel";
import { UsersPanel } from "@/components/users-panel";
import { AgentsPanel } from "@/components/agents-panel";
import { PlansPanel } from "@/components/plans-panel";

type AdminView =
  | "overview"
  | "users"
  | "memberships"
  | "orders"
  | "registration"
  | "quotaFree"
  | "settings"
  | "agents"
  | "plans";

type MenuItem = {
  key: AdminView;
  label: string;
  badge?: string;
};

const menuItems: MenuItem[] = [
  { key: "overview", label: "仪表盘" },
  { key: "users", label: "用户管理" },
  { key: "memberships", label: "会员管理", badge: "Live" },
  { key: "orders", label: "订单记录", badge: "Live" },
  { key: "registration", label: "注册风控", badge: "Live" },
  { key: "quotaFree", label: "免费额度", badge: "Live" },
  { key: "settings", label: "系统设置", badge: "Live" },
  { key: "agents", label: "代理管理" },
  { key: "plans", label: "套餐管理" },
];

export function AdminShell() {
  const router = useRouter();
  const adminRole =
    typeof window === "undefined"
      ? "super_admin"
      : window.localStorage.getItem("openclaw-admin-role") || "super_admin";

  const [activeView, setActiveView] = useState<AdminView>(adminRole === "agent" ? "users" : "overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminName =
    typeof window === "undefined"
      ? "超级管理员"
      : window.localStorage.getItem("openclaw-admin-name") || "超级管理员";

  const inviteCode =
    typeof window === "undefined"
      ? ""
      : window.localStorage.getItem("openclaw-admin-invite") || "";

  const filteredMenuItems = useMemo(() => {
    if (adminRole === "agent") {
      // 代理商允许查看：仪表盘、用户列表、订单记录
      return menuItems.filter(
        (item) => item.key === "overview" || item.key === "users" || item.key === "orders",
      );
    }
    return menuItems;
  }, [adminRole]);

  const activeItem = useMemo(
    () => filteredMenuItems.find((item) => item.key === activeView) ?? filteredMenuItems[0],
    [activeView, filteredMenuItems],
  );

  const now = new Intl.DateTimeFormat("zh-CN", { dateStyle: "full" }).format(new Date());

  function selectView(view: AdminView) {
    setActiveView(view);
    setMobileMenuOpen(false);
  }

  function handleLogout() {
    window.sessionStorage.removeItem("openclaw-admin-auth");
    window.localStorage.removeItem("openclaw-admin-token");
    window.localStorage.removeItem("openclaw-admin-name");
    window.localStorage.removeItem("openclaw-admin-phone");
    window.localStorage.removeItem("openclaw-admin-role");
    window.localStorage.removeItem("openclaw-admin-invite");
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff8ef_0%,#f8fafc_45%,#f3f4f6_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:px-6 lg:py-6">
        <aside className="hidden w-[280px] shrink-0 rounded-[30px] border border-stone-200 bg-slate-950 p-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] lg:flex lg:flex-col">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/45">xiezuozhushou</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">后台管理台</h1>
          </div>

          <nav className="mt-5 space-y-2">
            {filteredMenuItems.map((item) => {
              const active = item.key === activeView;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => selectView(item.key)}
                  className={`w-full rounded-[22px] px-4 py-4 text-left transition ${active
                    ? "bg-white text-slate-950 shadow-[0_16px_40px_rgba(255,255,255,0.1)]"
                    : "bg-white/[0.03] text-white/82 hover:bg-white/[0.08]"
                    }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{item.label}</span>
                    {item.badge ? (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${active ? "bg-slate-100 text-slate-600" : "bg-white/10 text-white/60"
                          }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[24px] border border-white/10 bg-white/5 p-5">
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{adminName}</p>
                {inviteCode ? (
                  <p className="mt-1 text-xs font-mono text-amber-400">邀请码: {inviteCode}</p>
                ) : (
                  <p className="text-xs text-white/55">当前为本地管理模式</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-white/12 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10"
              >
                退出登录
              </button>
            </div>
          </div>
        </aside>

        {mobileMenuOpen ? (
          <div className="lg:hidden">
            <button
              type="button"
              aria-label="关闭菜单"
              className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px]"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-[285px] max-w-[86vw] flex-col border-r border-white/10 bg-slate-950 p-4 text-white shadow-[24px_0_70px_rgba(15,23,42,0.32)]">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">xiezuozhushou</p>
                    <h1 className="mt-3 text-xl font-semibold tracking-tight">后台管理台</h1>
                  </div>
                  <button
                    type="button"
                    aria-label="关闭菜单"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-full border border-white/10 p-2 text-white/75 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <nav className="mt-4 space-y-2 overflow-y-auto pr-1">
                {filteredMenuItems.map((item) => {
                  const active = item.key === activeView;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => selectView(item.key)}
                      className={`w-full rounded-[20px] px-4 py-3.5 text-left transition ${active
                        ? "bg-white text-slate-950 shadow-[0_16px_40px_rgba(255,255,255,0.1)]"
                        : "bg-white/[0.03] text-white/82 hover:bg-white/[0.08]"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">{item.label}</span>
                        {item.badge ? (
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${active ? "bg-slate-100 text-slate-600" : "bg-white/10 text-white/60"
                              }`}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-auto rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">{adminName}</p>
                {inviteCode ? (
                  <p className="mt-1 text-xs font-mono text-amber-400">邀请码: {inviteCode}</p>
                ) : (
                  <p className="mt-1 text-xs text-white/55">当前为本地管理模式</p>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-4 w-full rounded-full border border-white/12 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                >
                  退出登录
                </button>
              </div>
            </aside>
          </div>
        ) : null}

        <main className="flex-1 rounded-[30px] border border-stone-200/80 bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur">
          <header className="border-b border-stone-200 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  aria-label="打开菜单"
                  onClick={() => setMobileMenuOpen(true)}
                  className="mt-1 rounded-2xl border border-stone-200 bg-white p-3 text-slate-800 shadow-sm transition hover:bg-stone-50 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">{now}</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{activeItem.label}</h2>
                </div>
              </div>
            </div>
          </header>

          <div className="px-5 py-5 sm:px-7 sm:py-7">{renderContent(activeView)}</div>
        </main>
      </div>
    </div>
  );
}

function renderContent(activeView: AdminView) {
  switch (activeView) {
    case "users":
      return <UsersPanel />;
    case "memberships":
      return <UsersPanel />;
    case "orders":
      return <OrdersPanel />;
    case "settings":
      return <SettingsPanel />;
    case "registration":
      return <RegistrationPolicyPanel />;
    case "quotaFree":
      return <QuotaFreePanel />;
    case "agents":
      return <AgentsPanel />;
    case "plans":
      return <PlansPanel />;
    case "overview":
      return <OverviewPanel />;
    default:
      return <OverviewPanel />;
  }
}

function QuickPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "sky" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "sky"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <div className={`rounded-full border px-4 py-2 text-sm ${toneClass}`}>
      <span className="font-medium">{label}</span>
      <span className="mx-2 opacity-50">/</span>
      <span>{value}</span>
    </div>
  );
}

function MiniStep({ step, text }: { step: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">
      <div className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-white">
        {step}
      </div>
      <p className="text-sm leading-6 text-slate-700">{text}</p>
    </div>
  );
}
