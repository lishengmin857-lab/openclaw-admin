"use client";

import { useEffect, useState } from "react";

type OrderUser = { id: string; email: string; displayName: string };
type OrderPlan = { code: string; name: string; isLifetime: boolean };

type Order = {
  id: string;
  orderNo: string;
  status: string;
  amountCents: number;
  amountLabel: string;
  paidAt: string | null;
  createdAt: string;
  user: OrderUser;
  plan: OrderPlan;
};

function getToken() {
  return typeof window === "undefined" ? "" : (window.localStorage.getItem("openclaw-admin-token") ?? "");
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  paid: { label: "已支付", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  pending: { label: "待支付", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  cancelled: { label: "已取消", cls: "bg-stone-100 text-slate-500 ring-stone-200" },
  refunded: { label: "已退款", cls: "bg-rose-50 text-rose-600 ring-rose-200" },
};

function OrderStatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, cls: "bg-stone-100 text-slate-500 ring-stone-200" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${getToken()}` },
        cache: "no-store",
      });
      if (!res.ok) {
        const r = (await res.json()) as { error?: string };
        setError(r.error ?? "LOAD_FAILED");
        return;
      }
      const data = (await res.json()) as { orders: Order[] };
      setOrders(data.orders);
    } catch {
      setError("网络请求失败，请检查后端服务。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadOrders(); }, []);

  const filtered = search.trim()
    ? orders.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
          o.user.email.toLowerCase().includes(search.toLowerCase()) ||
          o.user.displayName.toLowerCase().includes(search.toLowerCase()),
      )
    : orders;

  const paidTotal = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.amountCents, 0);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">Order Records</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">订单记录</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              全部用户支付订单流水，含套餐信息与支付状态。
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadOrders()}
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
        <StatCard label="订单总数" value={loading ? "-" : String(orders.length)} accent="slate" />
        <StatCard
          label="已支付"
          value={loading ? "-" : String(orders.filter((o) => o.status === "paid").length)}
          accent="emerald"
        />
        <StatCard
          label="累计收入"
          value={loading ? "-" : `¥${(paidTotal / 100).toFixed(2)}`}
          accent="amber"
        />
      </section>

      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">订单列表</h3>
            <p className="mt-1 text-sm text-slate-500">共 {filtered.length} 条</p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索订单号 / 邮箱 / 昵称"
            className="w-full rounded-2xl border border-stone-300 px-4 py-2.5 text-sm outline-none transition focus:border-amber-400 sm:w-72"
          />
        </div>

        <div className="mt-5 overflow-x-auto overflow-hidden rounded-2xl border border-stone-200">
          <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
            <thead className="bg-stone-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">订单号</th>
                <th className="px-4 py-3 font-medium">用户</th>
                <th className="px-4 py-3 font-medium">套餐</th>
                <th className="px-4 py-3 font-medium">金额</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">支付时间</th>
                <th className="px-4 py-3 font-medium">创建时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">正在加载订单...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    {search ? "没有匹配的订单" : "暂无订单记录"}
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="transition hover:bg-stone-50/60">
                    <td className="px-4 py-3 font-mono text-[12px] text-slate-700">{order.orderNo}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{order.user.displayName}</p>
                      <p className="text-xs text-slate-500">{order.user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{order.plan.name}</p>
                      {order.plan.isLifetime && (
                        <p className="text-xs text-amber-600">永久</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">¥{order.amountLabel}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(order.paidAt)}</td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(order.createdAt)}</td>
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

function StatCard({ label, value, accent }: { label: string; value: string; accent: "slate" | "emerald" | "amber" }) {
  const cls =
    accent === "emerald"
      ? "from-emerald-500/12 to-emerald-100"
      : accent === "amber"
        ? "from-amber-500/12 to-amber-100"
        : "from-slate-500/10 to-stone-100";
  return (
    <div className={`rounded-[24px] border border-stone-200 bg-gradient-to-br ${cls} p-5 shadow-sm`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}
