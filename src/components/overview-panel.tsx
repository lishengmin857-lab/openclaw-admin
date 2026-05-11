"use client";

import { useEffect, useState } from "react";

type OverviewData = {
  role: "super_admin" | "agent";
  inviteCode?: string;
  stats: {
    userCount: number;
    orderCount: number;
    agentCount?: number;
  };
};

export function OverviewPanel() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = typeof window === "undefined" ? "" : window.localStorage.getItem("openclaw-admin-token") || "";

  async function loadOverview() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/overview", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("FAILED_TO_FETCH");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError("加载仪表盘数据失败，请检查网络或重新登录。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      void loadOverview();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        正在加载仪表盘数据...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {error || "无数据"}
      </div>
    );
  }

  const isAgent = data.role === "agent";

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">Overview</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {isAgent ? "代理商概览" : "系统运行概览"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {isAgent 
                ? "查看您名下的邀请情况与订单统计。" 
                : "监控系统整体运行状态、用户增长与业务数据。"}
            </p>
          </div>
          {isAgent && data.inviteCode && (
            <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-6 py-4">
              <p className="text-xs font-medium uppercase tracking-widest text-amber-600">您的邀请码</p>
              <p className="mt-2 font-mono text-2xl font-bold tracking-wider text-amber-900">{data.inviteCode}</p>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="累积邀请用户" value={data.stats.userCount} accent="slate" />
        <StatCard label="完成订单总数" value={data.stats.orderCount} accent="emerald" />
        {!isAgent && (
          <StatCard label="活跃代理商" value={data.stats.agentCount ?? 0} accent="sky" />
        )}
      </section>

      {!isAgent && (
        <div className="rounded-[28px] border border-stone-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_48%,#f8fafc_100%)] p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-950">快速开始</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600 max-w-2xl">
            作为超级管理员，您可以管理代理商、配置系统参数并监控所有业务。建议定期查看“注册风控”与“卡密管理”模块。
          </p>
        </div>
      )}

      {isAgent && (
        <div className="rounded-[28px] border border-stone-200 bg-white p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-950">代理指南</h3>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            1. 分享您的邀请码给新用户注册。<br />
            2. 用户注册后，您可以在“用户管理”中看到他们。<br />
            3. 用户成功支付订单后，相关的分成与订单统计将在此更新。
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: "slate" | "emerald" | "sky" | "stone" }) {
  const cls =
    accent === "emerald"
      ? "from-emerald-500/12 to-emerald-100"
      : accent === "sky"
        ? "from-sky-500/12 to-sky-100"
        : accent === "slate"
          ? "from-slate-500/10 to-stone-100"
          : "from-stone-300/20 to-stone-100";

  return (
    <div className={`rounded-[24px] border border-stone-200 bg-gradient-to-br ${cls} p-6 shadow-sm`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-4 text-4xl font-bold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}
