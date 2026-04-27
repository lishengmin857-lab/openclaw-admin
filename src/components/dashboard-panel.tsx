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

export function DashboardPanel() {
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
      setToast(`已复制：${code}`);
    } catch {
      setToast("复制失败");
    }
  }

  async function loadDashboard() {
    setLoading(true);
    setMessage("");

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
        setMessage(`生成失败：${result.error ?? "UNKNOWN_ERROR"}`);
        return;
      }

      setMessage(`已生成 ${result.created?.length ?? 0} 个卡密，并同步到 openClaw 可用池`);
      await loadDashboard();
    } catch {
      setMessage("生成卡密失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="pointer-events-none fixed right-6 top-6 z-50">
          <div className="rounded-2xl bg-slate-950/92 px-4 py-3 text-sm font-medium text-white shadow-[0_18px_40px_rgba(15,23,42,0.24)] backdrop-blur">
            {toast}
          </div>
        </div>
      ) : null}

      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">
              License Workspace
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              卡密生成与激活回流
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              这里负责生成新卡密、查看使用状态，并同步 openClaw 客户端回传的机器码绑定结果。
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-400 hover:bg-stone-50"
          >
            刷新同步
          </button>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {message}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="卡密总数" value={data.stats.total} accent="slate" />
        <StatCard label="未使用" value={data.stats.available} accent="emerald" />
        <StatCard label="已激活" value={data.stats.activated} accent="sky" />
        <StatCard label="已停用" value={data.stats.disabled} accent="rose" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.86fr]">
        <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-950">卡密列表</h3>
              <p className="mt-1 text-sm text-slate-500">点击卡密或机器码可以直接复制。</p>
            </div>
            <div className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-slate-600">
              共 {data.licenses.length} 条记录
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200">
            <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
              <thead className="bg-stone-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">卡密</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">机器码</th>
                  <th className="px-4 py-3 font-medium">激活时间</th>
                  <th className="px-4 py-3 font-medium">创建时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      正在加载数据...
                    </td>
                  </tr>
                ) : data.licenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      还没有卡密记录，先生成一批吧。
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
                        <span className="whitespace-nowrap rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-slate-700">
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
                          <span className="whitespace-nowrap font-mono text-xs text-slate-400">-</span>
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
          <form onSubmit={handleGenerate} className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-950">批量生成卡密</h3>
            <p className="mt-1 text-sm text-slate-500">新卡密会直接进入 openClaw 可用卡池，等待客户端激活。</p>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-slate-700">
                生成数量
                <input
                  value={generateCount}
                  onChange={(event) => setGenerateCount(event.target.value)}
                  className="rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-400"
                  inputMode="numeric"
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-700">
                卡密前缀
                <input
                  value={prefix}
                  onChange={(event) => setPrefix(event.target.value)}
                  className="rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-400"
                  placeholder="CLAW"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting ? "生成中..." : "开始生成"}
            </button>
          </form>

          <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-950">导出快照</h3>
            <p className="mt-1 text-sm text-slate-500">需要备份卡池或转移环境时，可以导出当前记录。</p>

            <label className="mt-5 grid gap-2 text-sm text-slate-700">
              导出范围
              <select
                value={exportScope}
                onChange={(event) => setExportScope(event.target.value as ExportScope)}
                className="rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-400"
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
                下载 .env
              </a>
              <a
                href={`/api/v1/licenses/export?format=txt&scope=${exportScope}`}
                className="rounded-full border border-stone-300 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:border-stone-400 hover:bg-stone-50"
              >
                下载 .txt
              </a>
              <a
                href={`/api/v1/licenses/export?format=json&scope=${exportScope}`}
                className="rounded-full border border-amber-300 px-4 py-3 text-center text-sm font-medium text-amber-700 transition hover:border-amber-400 hover:bg-amber-50"
              >
                下载 .json
              </a>
            </div>
          </section>
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
  value: number;
  accent: "slate" | "emerald" | "sky" | "rose";
}) {
  const accentClass =
    accent === "emerald"
      ? "from-emerald-500/12 to-emerald-100"
      : accent === "sky"
        ? "from-sky-500/12 to-sky-100"
        : accent === "rose"
          ? "from-rose-500/12 to-rose-100"
          : "from-slate-500/10 to-stone-100";

  return (
    <div className={`rounded-[24px] border border-stone-200 bg-gradient-to-br ${accentClass} p-5 shadow-sm`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}
