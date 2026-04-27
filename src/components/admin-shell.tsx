"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardPanel } from "@/components/dashboard-panel";
import { OrdersPanel } from "@/components/orders-panel";
import { SettingsPanel } from "@/components/settings-panel";
import { UsersPanel } from "@/components/users-panel";

type AdminView = "overview" | "users" | "memberships" | "orders" | "licenses" | "settings";

type MenuItem = {
  key: AdminView;
  label: string;
  badge?: string;
  description: string;
};

const menuItems: MenuItem[] = [
  { key: "overview", label: "仪表盘", description: "查看后台概览与当前工作状态。" },
  { key: "users", label: "用户管理", description: "查看用户、会员状态并执行基础账号操作。" },
  { key: "memberships", label: "会员管理", description: "沿用用户列表里的会员开通和关闭能力。", badge: "Live" },
  { key: "orders", label: "订单记录", description: "查看会员订单与开通记录。", badge: "Live" },
  { key: "licenses", label: "卡密管理", description: "管理卡密池与激活回流。" },
  { key: "settings", label: "系统设置", description: "维护图片模型 Key、模型名和服务端配置。", badge: "Live" },
];

export function AdminShell() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<AdminView>("overview");
  const adminName =
    typeof window === "undefined"
      ? "超级管理员"
      : window.localStorage.getItem("openclaw-admin-name") || "超级管理员";

  const activeItem = useMemo(
    () => menuItems.find((item) => item.key === activeView) ?? menuItems[0],
    [activeView],
  );

  const now = new Intl.DateTimeFormat("zh-CN", { dateStyle: "full" }).format(new Date());

  function handleLogout() {
    window.sessionStorage.removeItem("openclaw-admin-auth");
    window.localStorage.removeItem("openclaw-admin-token");
    window.localStorage.removeItem("openclaw-admin-name");
    window.localStorage.removeItem("openclaw-admin-phone");
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff8ef_0%,#f8fafc_45%,#f3f4f6_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:px-6 lg:py-6">
        <aside className="hidden w-[280px] shrink-0 rounded-[30px] border border-stone-200 bg-slate-950 p-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] lg:flex lg:flex-col">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/45">OpenClaw Backend</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">后台管理台</h1>
            <p className="mt-3 text-sm leading-6 text-white/65">
              左侧切模块，右侧做实际管理。图片模型配置现在已经可以直接在后台维护。
            </p>
          </div>

          <nav className="mt-5 space-y-2">
            {menuItems.map((item) => {
              const active = item.key === activeView;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveView(item.key)}
                  className={`w-full rounded-[22px] px-4 py-4 text-left transition ${
                    active
                      ? "bg-white text-slate-950 shadow-[0_16px_40px_rgba(255,255,255,0.1)]"
                      : "bg-white/[0.03] text-white/82 hover:bg-white/[0.08]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{item.label}</span>
                    {item.badge ? (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                          active ? "bg-slate-100 text-slate-600" : "bg-white/10 text-white/60"
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className={`mt-2 text-xs leading-5 ${active ? "text-slate-500" : "text-white/55"}`}>
                    {item.description}
                  </p>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-white/40">Admin Session</p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{adminName}</p>
                <p className="text-xs text-white/55">当前为本地管理模式</p>
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

        <main className="flex-1 rounded-[30px] border border-stone-200/80 bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur">
          <header className="border-b border-stone-200 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">{now}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{activeItem.label}</h2>
                <p className="mt-2 text-sm text-slate-500">{activeItem.description}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <QuickPill label="服务状态" value="本地运行" tone="emerald" />
                <QuickPill label="数据库" value="PostgreSQL" tone="sky" />
                <QuickPill label="客户端" value="OpenClaw Tauri" tone="amber" />
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
    case "licenses":
      return <DashboardPanel />;
    case "users":
      return <UsersPanel />;
    case "memberships":
      return <UsersPanel />;
    case "orders":
      return <OrdersPanel />;
    case "settings":
      return <SettingsPanel />;
    default:
      return (
        <div className="space-y-6">
          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-stone-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_48%,#f8fafc_100%)] p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">Overview</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">后台框架已经切成左右结构</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                现在可以继续用卡密、用户、订单模块工作，图片模型配置也已经单独收进系统设置，不需要再改服务端代码。
              </p>
            </div>

            <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">下一步建议</h3>
              <div className="mt-4 space-y-3">
                <MiniStep step="01" text="用户与会员数据继续保持后台集中管理" />
                <MiniStep step="02" text="图片模型参数改成后台维护，客户端只负责调用" />
                <MiniStep step="03" text="后面再把图生视频任务也挂进系统设置和任务中心" />
              </div>
            </div>
          </section>

          <DashboardPanel />
        </div>
      );
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
