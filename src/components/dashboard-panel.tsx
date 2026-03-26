"use client";

import { FormEvent, useEffect, useState } from "react";

type LicenseStatus = "available" | "activated" | "disabled";

type LicenseRecord = {
  code: string;
  status: LicenseStatus;
  createdAt: string;
  machineId: string | null;
  activatedAt: string | null;
  note: string | null;
};

type DashboardData = {
  licenses: LicenseRecord[];
  stats: {
    total: number;
    available: number;
    activated: number;
    disabled: number;
  };
};

type ExportScope = "active" | "available" | "activated" | "all";

const initialData: DashboardData = {
  licenses: [],
  stats: {
    total: 0,
    available: 0,
    activated: 0,
    disabled: 0,
  },
};

const statusLabel: Record<LicenseStatus, string> = {
  available: "未使用",
  activated: "已激活",
  disabled: "已停用",
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function DashboardPanel({ onLogout }: { onLogout: () => void }) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");
  const [generateCount, setGenerateCount] = useState("10");
  const [prefix, setPrefix] = useState("CLAW");
  const [exportScope, setExportScope] = useState<ExportScope>("active");

  async function handleCopyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setToast(`已复制: ${code}`);
    } catch {
      setToast("复制失败");
    }
  }

  async function loadDashboard() {
    setLoading(true);

    try {
      const response = await fetch("/api/v1/licenses", { cache: "no-store" });
      const nextData = (await response.json()) as DashboardData;
      setData(nextData);
    } catch {
      setMessage("加载卡密数据失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/v1/licenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          count: Number(generateCount),
          prefix,
        }),
      });

      const result = (await response.json()) as { error?: string; created?: LicenseRecord[] };

      if (!response.ok) {
        setMessage(`生成失败: ${result.error ?? "UNKNOWN_ERROR"}`);
        return;
      }

      setMessage(`已生成 ${result.created?.length ?? 0} 个卡密，并同步到 openClaw 可用卡池`);
      await loadDashboard();
    } catch {
      setMessage("生成卡密失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7ed_0%,#fffbeb_38%,#f8fafc_100%)] px-4 py-10 text-slate-900">
      {toast ? (
        <div className="pointer-events-none fixed right-6 top-6 z-50">
          <div className="rounded-2xl bg-slate-950/92 px-4 py-3 text-sm font-medium text-white shadow-[0_18px_40px_rgba(15,23,42,0.24)] backdrop-blur">
            {toast}
          </div>
        </div>
      ) : null}
      <main className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-[28px] border border-orange-200/70 bg-white/90 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-orange-600">
                License Control Panel
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                卡密生成与激活回流后台
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                后台只负责生成卡密和查看状态。客户在 openClaw 激活后，机器码与激活结果会从
                Python 服务回流到这里，已激活的卡密会自动从可用池移除。
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              退出登录
            </button>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
              {message}
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="卡密总数" value={data.stats.total} />
          <StatCard label="未使用" value={data.stats.available} />
          <StatCard label="已激活" value={data.stats.activated} />
          <StatCard label="已停用" value={data.stats.disabled} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">卡密列表</h2>
                <p className="mt-1 text-sm text-slate-500">
                  页面刷新时会自动从 openClaw 数据库同步机器码绑定状态。
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                刷新同步
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">卡密</th>
                    <th className="px-4 py-3 font-medium">状态</th>
                    <th className="px-4 py-3 font-medium">机器码</th>
                    <th className="px-4 py-3 font-medium">激活时间</th>
                    <th className="px-4 py-3 font-medium">生成时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        正在加载数据...
                      </td>
                    </tr>
                  ) : data.licenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        还没有卡密记录，先生成一批。
                      </td>
                    </tr>
                  ) : (
                    data.licenses.map((item) => (
                      <tr key={item.code}>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => void handleCopyCode(item.code)}
                            className="cursor-pointer whitespace-nowrap font-mono text-[13px] font-semibold text-emerald-600 transition hover:text-emerald-700"
                            title="点击复制卡密"
                          >
                            {item.code}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {statusLabel[item.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {item.machineId ? (
                            <button
                              type="button"
                              onClick={() => void handleCopyCode(item.machineId!)}
                              className="whitespace-nowrap font-mono text-xs text-slate-700 transition hover:text-slate-950"
                              title="点击复制机器码"
                            >
                              {item.machineId}
                            </button>
                          ) : (
                            <span className="whitespace-nowrap font-mono text-xs text-slate-700">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{formatDate(item.activatedAt)}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(item.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <form onSubmit={handleGenerate} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">生成卡密</h2>
              <p className="mt-1 text-sm text-slate-500">新卡密会直接进入 openClaw 可用卡池，等待客户激活。</p>

              <div className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm text-slate-700">
                  生成数量
                  <input
                    value={generateCount}
                    onChange={(event) => setGenerateCount(event.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-orange-400"
                    inputMode="numeric"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-700">
                  卡密前缀
                  <input
                    value={prefix}
                    onChange={(event) => setPrefix(event.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-orange-400"
                    placeholder="CLAW"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                批量生成
              </button>
            </form>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">导出快照</h2>
              <p className="mt-1 text-sm text-slate-500">需要手工备份时，可以导出当前后台台账或可用卡池。</p>

              <label className="mt-5 grid gap-2 text-sm text-slate-700">
                导出范围
                <select
                  value={exportScope}
                  onChange={(event) => setExportScope(event.target.value as ExportScope)}
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-orange-400"
                >
                  <option value="active">仅可用卡密</option>
                  <option value="available">仅未使用卡密</option>
                  <option value="activated">仅已激活卡密</option>
                  <option value="all">全部记录</option>
                </select>
              </label>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <a
                  href={`/api/v1/licenses/export?format=env&scope=${exportScope}`}
                  className="rounded-full bg-slate-950 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  下载 `.env`
                </a>
                <a
                  href={`/api/v1/licenses/export?format=txt&scope=${exportScope}`}
                  className="rounded-full border border-slate-300 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  下载 `.txt`
                </a>
                <a
                  href={`/api/v1/licenses/export?format=json&scope=${exportScope}`}
                  className="rounded-full border border-orange-300 px-4 py-3 text-center text-sm font-medium text-orange-700 transition hover:border-orange-400 hover:bg-orange-50"
                >
                  下载 `.json`
                </a>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}
