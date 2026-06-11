"use client";

import { useEffect, useMemo, useState } from "react";

type Summary = {
  total: number;
  today: number;
  last7Days: number;
  success: number;
  failed: number;
};

type CountByStyle = {
  style: string;
  label: string;
  count: number;
};

type CountByLength = {
  maxChars: number;
  count: number;
};

type DailyCount = {
  date: string;
  count: number;
};

type RecentCall = {
  id: string;
  source: string;
  endpoint: string;
  status: string;
  style: string;
  styleLabel: string;
  maxChars: number | null;
  inputChars: number;
  outputChars: number;
  model: string;
  errorCode: string;
  clientIp: string;
  createdAt: string;
};

type AiCallStats = {
  summary: Summary;
  byStyle: CountByStyle[];
  byLength: CountByLength[];
  daily: DailyCount[];
  recent: RecentCall[];
};

const EMPTY_STATS: AiCallStats = {
  summary: { total: 0, today: 0, last7Days: 0, success: 0, failed: 0 },
  byStyle: [],
  byLength: [],
  daily: [],
  recent: [],
};

function getToken() {
  return typeof window === "undefined" ? "" : (window.localStorage.getItem("openclaw-admin-token") ?? "");
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusLabel(status: string) {
  return status === "success" ? "成功" : "失败";
}

function statusClass(status: string) {
  return status === "success"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : "bg-rose-50 text-rose-700 ring-rose-200";
}

export function AiCallStatsPanel() {
  const [stats, setStats] = useState<AiCallStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStats() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ai-call-stats", {
        headers: { Authorization: `Bearer ${getToken()}` },
        cache: "no-store",
      });
      if (!res.ok) {
        const r = (await res.json()) as { error?: string };
        setError(r.error ?? "LOAD_FAILED");
        return;
      }
      setStats({ ...EMPTY_STATS, ...((await res.json()) as AiCallStats) });
    } catch {
      setError("网络请求失败，请检查后端服务。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStats();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const successRate = useMemo(() => {
    const total = stats.summary.success + stats.summary.failed;
    if (!total) return "0%";
    return `${Math.round((stats.summary.success / total) * 100)}%`;
  }, [stats.summary.failed, stats.summary.success]);

  const maxDailyCount = Math.max(...stats.daily.map((item) => item.count), 1);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">AI Call Stats</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">调用统计</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              统计小程序文案润色接口调用次数，包含成功率、风格分布、字数分布和最近调用记录。
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadStats()}
            className="self-start rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-400 hover:bg-stone-50"
          >
            刷新
          </button>
        </div>
        {error && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <StatCard label="累计调用" value={loading ? "-" : String(stats.summary.total)} accent="slate" />
        <StatCard label="今日调用" value={loading ? "-" : String(stats.summary.today)} accent="amber" />
        <StatCard label="近 7 天" value={loading ? "-" : String(stats.summary.last7Days)} accent="sky" />
        <StatCard label="成功次数" value={loading ? "-" : String(stats.summary.success)} accent="emerald" />
        <StatCard label="成功率" value={loading ? "-" : successRate} accent="stone" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-xl font-semibold text-slate-950">近 7 天调用</h3>
          <div className="mt-5 grid grid-cols-7 items-end gap-3">
            {stats.daily.length === 0 ? (
              <div className="col-span-7 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-10 text-center text-sm text-slate-500">
                暂无调用数据
              </div>
            ) : (
              stats.daily.map((item) => (
                <div key={item.date} className="flex min-h-[180px] flex-col justify-end gap-2">
                  <div className="text-center text-sm font-semibold text-slate-700">{item.count}</div>
                  <div
                    className="rounded-t-2xl bg-gradient-to-t from-amber-300 to-stone-200"
                    style={{ height: `${Math.max(16, (item.count / maxDailyCount) * 120)}px` }}
                  />
                  <div className="truncate text-center text-[11px] text-slate-400">{item.date.slice(5)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-950">字数分布</h3>
          <div className="mt-5 space-y-3">
            {stats.byLength.length === 0 ? (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-slate-500">
                暂无数据
              </div>
            ) : (
              stats.byLength.map((item) => (
                <DistributionRow key={item.maxChars} label={`${item.maxChars || "-"} 字`} value={item.count} total={stats.summary.total} />
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-950">风格分布</h3>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {stats.byStyle.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-slate-500 md:col-span-3">
              暂无数据
            </div>
          ) : (
            stats.byStyle.map((item) => (
              <DistributionRow key={item.style} label={item.label} value={item.count} total={stats.summary.total} />
            ))
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">最近调用</h3>
            <p className="mt-1 text-sm text-slate-500">最近 30 条接口调用记录</p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto overflow-hidden rounded-2xl border border-stone-200">
          <table className="min-w-[980px] divide-y divide-stone-200 text-left text-sm">
            <thead className="bg-stone-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">时间</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">风格</th>
                <th className="px-4 py-3 font-medium">字数</th>
                <th className="px-4 py-3 font-medium">输入/输出</th>
                <th className="px-4 py-3 font-medium">模型</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">正在加载统计...</td>
                </tr>
              ) : stats.recent.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">暂无调用记录</td>
                </tr>
              ) : (
                stats.recent.map((item) => (
                  <tr key={item.id} className="transition hover:bg-stone-50/60">
                    <td className="px-4 py-3 text-slate-500">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusClass(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                      {item.errorCode ? <p className="mt-1 max-w-[180px] truncate text-xs text-rose-500">{item.errorCode}</p> : null}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.styleLabel}</td>
                    <td className="px-4 py-3 text-slate-600">{item.maxChars ? `${item.maxChars} 字` : "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{item.inputChars} / {item.outputChars}</td>
                    <td className="px-4 py-3 max-w-[220px] truncate text-slate-500">{item.model || "-"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{item.clientIp || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "slate" | "emerald" | "amber" | "sky" | "stone";
}) {
  const cls =
    accent === "emerald"
      ? "from-emerald-500/12 to-emerald-100"
      : accent === "amber"
        ? "from-amber-500/12 to-amber-100"
        : accent === "sky"
          ? "from-sky-500/12 to-sky-100"
          : accent === "stone"
            ? "from-stone-300 to-stone-100"
            : "from-slate-500/10 to-stone-100";
  return (
    <div className={`rounded-[24px] border border-stone-200 bg-gradient-to-br ${cls} p-5 shadow-sm`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function DistributionRow({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-slate-800">{label}</span>
        <span className="text-sm text-slate-500">{value} 次</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-amber-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
