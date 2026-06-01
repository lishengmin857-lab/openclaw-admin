"use client";

import { useEffect, useState, useMemo } from "react";
import { Check, Copy, RefreshCw, Ticket, ShieldCheck, Clock, Zap } from "lucide-react";

type ActivationCode = {
  id: string;
  code: string;
  isUsed: boolean;
  usedAt: string | null;
  createdAt: string;
};

function getToken() {
  return typeof window === "undefined" ? "" : (window.localStorage.getItem("openclaw-admin-token") ?? "");
}

function authHeader() {
  return { Authorization: `Bearer ${getToken()}` };
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function ActivationCodesPanel() {
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function loadCodes() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/admin/activation-codes", {
        headers: authHeader(),
        cache: "no-store",
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "获取激活码列表失败");
        return;
      }

      const data = await res.json() as { activationCodes: ActivationCode[] };
      setCodes(data.activationCodes || []);
    } catch {
      setError("网络请求失败，请检查后端服务是否启动。");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (generating) return;
    setGenerating(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/v1/admin/activation-codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ count: generateCount }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "生成激活码失败");
        return;
      }

      const data = await res.json() as { ok: boolean; created: ActivationCode[] };
      setSuccessMsg(`成功批量生成了 ${data.created?.length || generateCount} 个一次性激活码！`);
      void loadCodes();
    } catch {
      setError("网络请求失败，请稍后重试。");
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    void loadCodes();
  }, []);

  const filteredCodes = useMemo(() => {
    const query = searchQuery.trim().toUpperCase();
    if (!query) return codes;
    return codes.filter((c) => c.code.toUpperCase().includes(query));
  }, [searchQuery, codes]);

  const stats = useMemo(() => {
    const total = codes.length;
    const used = codes.filter((c) => c.isUsed).length;
    const unused = total - used;
    return { total, used, unused };
  }, [codes]);

  function handleCopy(code: string, id: string) {
    void navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="space-y-6">
      {/* 头部卡片 */}
      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">Activation Center</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">激活码管理</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              在此管理和生成用于 Chrome 插件的一键重置激活码。激活码均为一次性使用，使用后自动失效。
            </p>
          </div>
          <button
            type="button"
            onClick={loadCodes}
            className="flex items-center gap-2 self-start rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-400 hover:bg-stone-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新数据
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 animate-pulse">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-semibold">
            {successMsg}
          </div>
        )}
      </section>

      {/* 统计指标 */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-stone-200 bg-gradient-to-br from-indigo-500/10 to-stone-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">激活码总数</p>
            <Ticket className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{loading ? "-" : stats.total}</p>
        </div>

        <div className="rounded-[24px] border border-stone-200 bg-gradient-to-br from-emerald-500/10 to-stone-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">未使用（有效）</p>
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{loading ? "-" : stats.unused}</p>
        </div>

        <div className="rounded-[24px] border border-stone-200 bg-gradient-to-br from-stone-300/20 to-stone-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">已使用（失效）</p>
            <Clock className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{loading ? "-" : stats.used}</p>
        </div>
      </section>

      {/* 功能操作与表格 */}
      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* 激活码批量生成 */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-sm font-semibold text-slate-700">生成数量：</span>
              <select
                value={generateCount}
                onChange={(e) => setGenerateCount(Number(e.target.value))}
                disabled={generating}
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-amber-400"
              >
                {[5, 10, 20, 50, 100].map((num) => (
                  <option key={num} value={num}>
                    {num} 个激活码
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2 text-sm font-semibold text-white shadow-md hover:from-amber-600 hover:to-orange-600 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
            >
              <Zap className="h-4 w-4" />
              {generating ? "正在生成..." : "一键生成一次性激活码"}
            </button>
          </div>

          {/* 搜索 */}
          <div className="w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索激活码..."
              className="w-full rounded-2xl border border-stone-300 px-4 py-2 text-sm outline-none transition focus:border-amber-400"
            />
          </div>
        </div>

        {/* 激活码列表表格 */}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200">
          <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
            <thead className="bg-stone-50 text-slate-500">
              <tr>
                <th className="px-6 py-3.5 font-semibold">激活码</th>
                <th className="px-6 py-3.5 font-semibold">状态</th>
                <th className="px-6 py-3.5 font-semibold">生成时间</th>
                <th className="px-6 py-3.5 font-semibold">使用时间</th>
                <th className="px-6 py-3.5 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                    正在加载激活码列表...
                  </td>
                </tr>
              ) : filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                    {searchQuery ? "未找到匹配的激活码" : "暂无激活码数据"}
                  </td>
                </tr>
              ) : (
                filteredCodes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/55 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 select-all tracking-wider">
                      {c.code}
                    </td>
                    <td className="px-6 py-4">
                      {c.isUsed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          已失效
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          未使用
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(c.createdAt)}</td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(c.usedAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleCopy(c.code, c.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          copiedId === c.id
                            ? "bg-emerald-500 text-white"
                            : "border border-stone-300 bg-white text-slate-700 hover:bg-stone-50"
                        }`}
                      >
                        {copiedId === c.id ? (
                          <>
                            <Check className="h-3 w-3" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            复制
                          </>
                        )}
                      </button>
                    </td>
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
