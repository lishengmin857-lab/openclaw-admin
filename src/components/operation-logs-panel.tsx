"use client";

import { useEffect, useState } from "react";

type GrantLog = {
  id: string;
  actorType: string;
  actorAccount: string;
  actorName: string;
  targetUserEmail: string;
  targetUserName: string;
  planCode: string;
  planName: string;
  createdAt: string;
};

type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
};

function getToken() {
  return typeof window === "undefined" ? "" : (window.localStorage.getItem("openclaw-admin-token") ?? "");
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function actorRoleLabel(role: string) {
  if (role === "super_admin") return "超管";
  if (role === "agent") return "代理";
  if (role === "admin") return "管理员";
  return role || "-";
}

export function OperationLogsPanel() {
  const [logs, setLogs] = useState<GrantLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);

  async function loadLogs(
    nextPage = pagination.page,
    nextSearch = debouncedSearch,
    nextPageSize = pagination.pageSize,
  ) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(nextPageSize),
      });
      if (nextSearch.trim()) {
        params.set("search", nextSearch.trim());
      }

      const res = await fetch(`/api/admin/operation-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        cache: "no-store",
      });
      if (!res.ok) {
        const r = (await res.json()) as { error?: string };
        setError(r.error ?? "LOAD_FAILED");
        return;
      }

      const data = (await res.json()) as { logs: GrantLog[]; pagination?: PaginationState };
      setLogs(data.logs ?? []);
      setPagination(data.pagination ?? DEFAULT_PAGINATION);
    } catch {
      setError("网络请求失败，请检查后端服务。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((current) => ({ ...current, page: 1 }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void loadLogs(pagination.page, debouncedSearch, pagination.pageSize);
  }, [pagination.page, pagination.pageSize, debouncedSearch]);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">Operation Logs</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">操作日志</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              记录后台手动开通会员操作，包含操作者账号、被开通用户账号、会员套餐和操作时间。
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadLogs()}
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

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="日志总数" value={loading ? "-" : String(pagination.total)} accent="slate" />
        <StatCard label="本页记录" value={loading ? "-" : String(logs.length)} accent="amber" />
        <StatCard label="权限范围" value="仅超管" accent="stone" />
      </section>

      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">开通会员记录</h3>
            <p className="mt-1 text-sm text-slate-500">共 {pagination.total} 条</p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索操作者 / 用户 / 套餐"
            className="w-full rounded-2xl border border-stone-300 px-4 py-2.5 text-sm outline-none transition focus:border-amber-400 sm:w-72"
          />
        </div>

        <div className="mt-5 grid gap-3 md:hidden">
          {loading ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-slate-500">
              正在加载日志...
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-slate-500">
              {search ? "没有匹配的日志" : "暂无开通记录"}
            </div>
          ) : (
            logs.map((log) => (
              <article key={log.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <PersonBlock title="操作人" name={log.actorName} account={log.actorAccount} />
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {actorRoleLabel(log.actorType)}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 rounded-2xl bg-stone-50 p-3 text-sm">
                  <MobileField
                    label="被开通用户"
                    value={<PersonBlock compact name={log.targetUserName} account={log.targetUserEmail} />}
                  />
                  <MobileField
                    label="会员套餐"
                    value={
                      <span>
                        <span className="block font-semibold text-slate-800">{log.planName}</span>
                        <span className="block font-mono text-xs text-slate-500">{log.planCode}</span>
                      </span>
                    }
                  />
                  <MobileField label="开通时间" value={formatDate(log.createdAt)} />
                </div>
              </article>
            ))
          )}
        </div>

        <div className="mt-5 hidden overflow-x-auto overflow-hidden rounded-2xl border border-stone-200 md:block">
          <table className="min-w-[980px] divide-y divide-stone-200 text-left text-sm">
            <thead className="bg-stone-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">操作人</th>
                <th className="px-4 py-3 font-medium">被开通用户</th>
                <th className="px-4 py-3 font-medium">开通会员</th>
                <th className="px-4 py-3 font-medium">操作时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">正在加载日志...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    {search ? "没有匹配的日志" : "暂无开通记录"}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="transition hover:bg-stone-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {actorRoleLabel(log.actorType)}
                        </span>
                        <PersonBlock name={log.actorName} account={log.actorAccount} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <PersonBlock name={log.targetUserName} account={log.targetUserEmail} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{log.planName}</p>
                      <p className="font-mono text-xs text-slate-500">{log.planCode}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(log.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          pagination={pagination}
          loading={loading}
          onPageChange={(page) => setPagination((current) => ({ ...current, page }))}
          onPageSizeChange={(pageSize) => setPagination((current) => ({ ...current, page: 1, pageSize }))}
        />
      </section>
    </div>
  );
}

function PersonBlock({
  title,
  name,
  account,
  compact = false,
}: {
  title?: string;
  name: string;
  account: string;
  compact?: boolean;
}) {
  return (
    <span className="block min-w-0">
      {title ? <span className="block text-xs font-medium text-slate-400">{title}</span> : null}
      <span className={`${compact ? "text-sm" : "text-base"} block font-semibold text-slate-950`}>
        {name || "-"}
      </span>
      <span className="block break-all text-xs text-slate-500">{account || "-"}</span>
    </span>
  );
}

function PaginationBar({
  pagination,
  loading,
  onPageChange,
  onPageSizeChange,
}: {
  pagination: PaginationState;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const start = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const end = Math.min(pagination.total, pagination.page * pagination.pageSize);

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-stone-100 pt-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <div>
        显示 {start}-{end} / 共 {pagination.total} 条
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={pagination.pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          disabled={loading}
          className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-400 disabled:opacity-60"
        >
          {[10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size} 条/页
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
          disabled={loading || pagination.page <= 1}
          className="rounded-xl border border-stone-300 px-3 py-2 font-medium text-slate-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          上一页
        </button>
        <span className="rounded-xl bg-stone-100 px-3 py-2 font-medium text-slate-700">
          {pagination.page} / {pagination.totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
          disabled={loading || pagination.page >= pagination.totalPages}
          className="rounded-xl border border-stone-300 px-3 py-2 font-medium text-slate-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          下一页
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: "slate" | "amber" | "stone" }) {
  const cls =
    accent === "amber"
      ? "from-amber-500/12 to-amber-100"
      : accent === "slate"
        ? "from-slate-500/10 to-stone-100"
        : "from-stone-300/20 to-stone-100";
  return (
    <div className={`rounded-[24px] border border-stone-200 bg-gradient-to-br ${cls} p-5 shadow-sm`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function MobileField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-xs font-medium text-slate-400">{label}</span>
      <span className="min-w-0 text-right text-xs font-medium text-slate-700">{value}</span>
    </div>
  );
}
