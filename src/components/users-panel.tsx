"use client";

import { Fragment, useEffect, useState } from "react";

type Plan = {
  id: string;
  code: string;
  name: string;
  billingType: string;
  priceCents: number;
  priceLabel: string;
  durationDays: number | null;
  isLifetime: boolean;
  isActive: boolean;
  sortOrder: number;
};

type Membership = {
  status: string;
  startAt: string;
  endAt: string | null;
  isActive: boolean;
  plan: Plan;
};

type User = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  membership: Membership | null;
  signupInviteOwnerName?: string | null;
  articleGenerationCount?: number;
};

type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type UsersPanelMode = "users" | "memberships";

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

function MembershipBadge({ membership }: { membership: Membership | null }) {
  if (!membership?.isActive) {
    return (
      <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-500">
        无会员
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      {membership.plan.name}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-600 ring-rose-200"
        }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-rose-400"}`} />
      {active ? "正常" : "已停用"}
    </span>
  );
}

function UserActionPanel({
  user,
  plans,
  onUpdated,
}: {
  user: User;
  plans: Plan[];
  onUpdated: (updated: User) => void;
}) {
  const [selectedPlanCode, setSelectedPlanCode] = useState(plans[0]?.code ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function grantMembership() {
    if (!selectedPlanCode) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}/membership`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ planCode: selectedPlanCode }),
      });
      const data = (await res.json()) as { ok?: boolean; membership?: Membership; error?: string };
      if (!res.ok) { setMsg(data.error ?? "开通失败"); return; }
      onUpdated({ ...user, membership: data.membership ?? null });
      setMsg("已开通");
    } catch { setMsg("请求失败"); }
    finally { setBusy(false); }
  }

  async function revokeMembership() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}/membership`, {
        method: "DELETE",
        headers: authHeader(),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) { setMsg(data.error ?? "关闭失败"); return; }
      onUpdated({ ...user, membership: user.membership ? { ...user.membership, isActive: false, status: "cancelled" } : null });
      setMsg("已关闭");
    } catch { setMsg("请求失败"); }
    finally { setBusy(false); }
  }

  async function toggleStatus() {
    const nextStatus = user.status === "active" ? "disabled" : "active";
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = (await res.json()) as { ok?: boolean; user?: User; error?: string };
      if (!res.ok) { setMsg(data.error ?? "操作失败"); return; }
      onUpdated({ ...user, status: nextStatus });
      setMsg(nextStatus === "active" ? "已启用" : "已停用");
    } catch { setMsg("请求失败"); }
    finally { setBusy(false); }
  }

  const adminRole = typeof window === "undefined" ? "super_admin" : window.localStorage.getItem("openclaw-admin-role");
  const isAgent = adminRole === "agent";

  return (
    <div className="flex flex-wrap items-center gap-4">
      {!isAgent && (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <select
            value={selectedPlanCode}
            onChange={(e) => setSelectedPlanCode(e.target.value)}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-400 sm:w-auto sm:py-1.5"
            disabled={busy}
          >
            {plans.length === 0 && <option value="">无可用套餐</option>}
            {plans.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}（¥{p.priceLabel}
                {p.isLifetime ? " · 永久" : p.durationDays ? ` · ${p.durationDays}天` : ""}）
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={grantMembership}
            disabled={busy || plans.length === 0}
            className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50 sm:py-1.5"
          >
            手动开通
          </button>
        </div>
      )}

      {!isAgent && user.membership?.isActive && (
        <button
          type="button"
          onClick={revokeMembership}
          disabled={busy}
          className="rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 sm:py-1.5"
        >
          关闭会员
        </button>
      )}

      {!isAgent && (
        <button
          type="button"
          onClick={toggleStatus}
          disabled={busy}
          className={`rounded-full border px-4 py-2 text-xs font-semibold transition disabled:opacity-50 sm:py-1.5 ${user.status === "active"
            ? "border-slate-300 text-slate-600 hover:bg-slate-100"
            : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            }`}
        >
          {user.status === "active" ? "停用账号" : "启用账号"}
        </button>
      )}

      {msg && (
        <span className="text-xs font-medium text-slate-500">{msg}</span>
      )}
    </div>
  );
}

function UserActionRow(props: {
  user: User;
  plans: Plan[];
  onUpdated: (updated: User) => void;
  colSpan: number;
}) {
  const { colSpan, ...panelProps } = props;
  return (
    <tr className="bg-slate-50/80">
      <td colSpan={colSpan} className="px-6 py-4">
        <UserActionPanel {...panelProps} />
      </td>
    </tr>
  );
}

const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
};

export function UsersPanel({ mode = "users" }: { mode?: UsersPanelMode }) {
  const adminRole = typeof window === "undefined" ? "super_admin" : window.localStorage.getItem("openclaw-admin-role");
  const isAgent = adminRole === "agent";
  const isSuperAdmin = adminRole === "super_admin";
  const isMembershipMode = mode === "memberships";

  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadData(nextPage = pagination.page, nextSearch = debouncedSearch, nextPageSize = pagination.pageSize) {
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
      const [usersRes, plansRes] = await Promise.all([
        fetch(`/api/admin/${isMembershipMode ? "memberships" : "users"}?${params.toString()}`, {
          headers: authHeader(),
          cache: "no-store",
        }),
        fetch("/api/v1/plans", { cache: "no-store" }),
      ]);

      if (!usersRes.ok) {
        const r = (await usersRes.json()) as { error?: string };
        setError(r.error ?? "LOAD_FAILED");
        return;
      }

      const usersData = (await usersRes.json()) as { users: User[]; pagination?: PaginationState };
      setUsers(usersData.users);
      setPagination(usersData.pagination ?? DEFAULT_PAGINATION);
      setExpandedId(null);

      if (plansRes.ok) {
        const plansData = (await plansRes.json()) as { plans: Plan[] };
        setPlans(plansData.plans);
      }
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
    void loadData(pagination.page, debouncedSearch, pagination.pageSize);
  }, [pagination.page, pagination.pageSize, debouncedSearch, isMembershipMode]);

  function handleUserUpdated(updated: User) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  }

  const pageUsers = users;
  const activeCount = pageUsers.filter((u) => u.membership?.isActive).length;
  const generatedTotal = pageUsers.reduce((sum, user) => sum + (user.articleGenerationCount ?? 0), 0);
  const tableColumnCount = isSuperAdmin ? 8 : 6;
  const title = isMembershipMode ? "会员列表" : "用户列表";
  const eyebrow = isMembershipMode ? "Membership Center" : "User Center";
  const description = isMembershipMode
    ? "仅展示当前有效会员，支持查看生成次数、会员到期时间与会员操作。"
    : `点击用户行可展开操作面板${isAgent ? "，查看用户详情并支持启用 / 停用账号" : "，支持手动开通 / 关闭会员、启用 / 停用账号"}。`;
  const recordTitle = isMembershipMode ? "会员记录" : "用户记录";
  const emptyText = isMembershipMode ? "暂无有效会员" : "暂无用户记录";

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">{eyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
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
        <StatCard label={isMembershipMode ? "有效会员" : "注册用户"} value={loading ? "-" : String(pagination.total)} accent="slate" />
        <StatCard label="本页会员" value={loading ? "-" : String(activeCount)} accent="amber" />
        <StatCard
          label={isSuperAdmin ? "本页生成次数" : "本页普通用户"}
          value={loading ? "-" : String(isSuperAdmin ? generatedTotal : pageUsers.length - activeCount)}
          accent="stone"
        />
      </section>

      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">{recordTitle}</h3>
            <p className="mt-1 text-sm text-slate-500">共 {pagination.total} 条 · 点击行展开操作</p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索邮箱 / 昵称"
            className="w-full rounded-2xl border border-stone-300 px-4 py-2.5 text-sm outline-none transition focus:border-amber-400 sm:w-64"
          />
        </div>

        <div className="mt-5 grid gap-3 md:hidden">
          {loading ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-slate-500">
              正在加载...
            </div>
          ) : pageUsers.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-slate-500">
              {search ? "没有匹配的用户" : emptyText}
            </div>
          ) : (
            pageUsers.map((user) => (
              <article key={user.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                      {user.displayName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-slate-950">{user.displayName}</h4>
                        <StatusBadge status={user.status} />
                      </div>
                      <p className="mt-1 break-all text-xs leading-5 text-slate-500">{user.email}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-2xl bg-stone-50 p-3 text-sm">
                    <MobileField label="会员" value={<MembershipBadge membership={user.membership} />} />
                    <MobileField
                      label="到期"
                      value={
                        user.membership?.isActive
                          ? user.membership.plan.isLifetime ? "永久" : formatDate(user.membership.endAt)
                          : "-"
                      }
                    />
                    {isSuperAdmin && <MobileField label="邀请人" value={user.signupInviteOwnerName || "-"} />}
                    {isSuperAdmin && <MobileField label="生成次数" value={`${user.articleGenerationCount ?? 0} 次`} />}
                    <MobileField label="注册" value={formatDate(user.createdAt)} />
                  </div>
                </button>

                {expandedId === user.id && (
                  <div className="mt-4 border-t border-stone-100 pt-4">
                    <UserActionPanel user={user} plans={plans} onUpdated={handleUserUpdated} />
                  </div>
                )}
              </article>
            ))
          )}
        </div>

        <div className="mt-5 hidden overflow-x-auto overflow-hidden rounded-2xl border border-stone-200 md:block">
          <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
            <thead className="bg-stone-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">昵称</th>
                <th className="px-4 py-3 font-medium">邮箱</th>
                <th className="px-4 py-3 font-medium">账号状态</th>
                <th className="px-4 py-3 font-medium">会员</th>
                <th className="px-4 py-3 font-medium">会员到期</th>
                {isSuperAdmin && <th className="px-4 py-3 font-medium">邀请人</th>}
                {isSuperAdmin && <th className="px-4 py-3 font-medium">生成次数</th>}
                <th className="px-4 py-3 font-medium">注册时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={tableColumnCount} className="px-4 py-10 text-center text-slate-500">正在加载...</td>
                </tr>
              ) : pageUsers.length === 0 ? (
                <tr>
                  <td colSpan={tableColumnCount} className="px-4 py-10 text-center text-slate-500">
                    {search ? "没有匹配的用户" : emptyText}
                  </td>
                </tr>
              ) : (
                pageUsers.map((user) => (
                  <Fragment key={user.id}>
                    <tr
                      onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                      className="cursor-pointer transition hover:bg-amber-50/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                            {user.displayName?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <span className="font-medium text-slate-900">{user.displayName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                      <td className="px-4 py-3"><MembershipBadge membership={user.membership} /></td>
                      <td className="px-4 py-3 text-slate-600">
                        {user.membership?.isActive
                          ? user.membership.plan.isLifetime ? "永久" : formatDate(user.membership.endAt)
                          : "-"}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3 font-semibold text-slate-700">
                          {user.signupInviteOwnerName || "-"}
                        </td>
                      )}
                      {isSuperAdmin && (
                        <td className="px-4 py-3 font-semibold text-slate-800">{user.articleGenerationCount ?? 0}</td>
                      )}
                      <td className="px-4 py-3 text-slate-500">{formatDate(user.createdAt)}</td>
                    </tr>
                    {expandedId === user.id && (
                      <UserActionRow
                        user={user}
                        plans={plans}
                        onUpdated={handleUserUpdated}
                        colSpan={tableColumnCount}
                      />
                    )}
                  </Fragment>
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
