"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCcw, Trash2, Power, Users, Edit3, X, Check, Mail, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface Agent {
  id: string;
  name: string;
  email: string;
  inviteCode: string;
  contactWechat?: string;
  canGrantMembership: boolean;
  status: string;
  createdAt: string;
  userCount: number;
}

export function AgentsPanel() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formContactWechat, setFormContactWechat] = useState("");
  const [formCanGrantMembership, setFormCanGrantMembership] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const token = window.localStorage.getItem("openclaw-admin-token");
      const res = await fetch("/api/v1/admin/agents", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (err) {
      console.error("Failed to fetch agents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreate = async () => {
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      toast.error("请完整填写代理人信息");
      return;
    }
    setSubmitting(true);
    try {
      const token = window.localStorage.getItem("openclaw-admin-token");
      const res = await fetch("/api/v1/admin/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword.trim(),
          contactWechat: formContactWechat.trim(),
          canGrantMembership: formCanGrantMembership,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("代理商账号创建成功");
        setIsAddModalOpen(false);
        setFormName("");
        setFormEmail("");
        setFormPassword("");
        setFormContactWechat("");
        setFormCanGrantMembership(false);
        fetchAgents();
      } else {
        toast.error(data.error || "创建失败");
      }
    } catch (err) {
      toast.error("请求失败，请检查网络");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateName = async () => {
    if (!currentAgent || !formName.trim()) return;
    setSubmitting(true);
    try {
      const token = window.localStorage.getItem("openclaw-admin-token");
      const res = await fetch(`/api/v1/admin/agents/${currentAgent.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formName.trim(),
          contactWechat: formContactWechat.trim(),
          canGrantMembership: formCanGrantMembership,
        }),
      });
      if (res.ok) {
        toast.success("代理信息已更新");
        setIsEditModalOpen(false);
        setCurrentAgent(null);
        setFormName("");
        setFormContactWechat("");
        setFormCanGrantMembership(false);
        fetchAgents();
      } else {
        toast.error("更新失败");
      }
    } catch (err) {
      toast.error("请求失败");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "disabled" : "active";
    try {
      const token = window.localStorage.getItem("openclaw-admin-token");
      await fetch(`/api/v1/admin/agents/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      toast.success(nextStatus === "active" ? "已启用" : "已停用");
      fetchAgents();
    } catch (err) {
      toast.error("操作失败");
      console.error(err);
    }
  };

  const handleToggleMembershipGrant = async (id: string, currentValue: boolean) => {
    try {
      const token = window.localStorage.getItem("openclaw-admin-token");
      const res = await fetch(`/api/v1/admin/agents/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ canGrantMembership: !currentValue }),
      });
      if (!res.ok) {
        toast.error("权限更新失败");
        return;
      }
      toast.success(!currentValue ? "已开启会员开通权限" : "已关闭会员开通权限");
      fetchAgents();
    } catch (err) {
      toast.error("操作失败");
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此代理吗？关联的用户账号不会被删除，但该代理将无法继续管理。")) return;
    try {
      const token = window.localStorage.getItem("openclaw-admin-token");
      await fetch(`/api/v1/admin/agents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("代理记录已删除");
      fetchAgents();
    } catch (err) {
      toast.error("删除失败");
      console.error(err);
    }
  };

  const openAddModal = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormContactWechat("");
    setFormCanGrantMembership(false);
    setIsAddModalOpen(true);
  };

  const openEditModal = (agent: Agent) => {
    setCurrentAgent(agent);
    setFormName(agent.name);
    setFormContactWechat(agent.contactWechat ?? "");
    setFormCanGrantMembership(Boolean(agent.canGrantMembership));
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-full bg-slate-950 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 shadow-lg shadow-slate-200"
        >
          <Plus className="h-4 w-4" />
          新增代理人
        </button>

        <button
          onClick={fetchAgents}
          className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-stone-50 transition"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          刷新
        </button>
      </div>

      {/* Agents Table */}
      <div className="grid gap-3 md:hidden">
        {loading && agents.length === 0 ? (
          <div className="rounded-[26px] border border-stone-200 bg-white px-4 py-10 text-center text-sm text-stone-400 shadow-sm">
            <RefreshCcw className="mx-auto mb-4 h-8 w-8 animate-spin opacity-20" />
            正在获取数据...
          </div>
        ) : agents.length === 0 ? (
          <div className="rounded-[26px] border border-stone-200 bg-white px-4 py-10 text-center text-sm text-stone-400 shadow-sm">
            目前没有任何代理商记录
          </div>
        ) : (
          agents.map((agent) => (
            <article key={agent.id} className="rounded-[26px] border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-950">{agent.name}</h3>
                  <p className="mt-1 break-all text-xs font-medium text-slate-400">{agent.email}</p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
                    agent.status === "active"
                      ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                      : "border border-rose-100 bg-rose-50 text-rose-700"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${agent.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                  {agent.status === "active" ? "Active" : "Disabled"}
                </span>
              </div>

              <div className="mt-4 grid gap-3 rounded-2xl bg-stone-50 p-3">
                <MobileField label="联系微信" value={agent.contactWechat || "默认微信"} />
                <MobileField
                  label="注册码"
                  value={
                    <span className="rounded-lg border border-amber-100 bg-amber-50 px-2 py-1 font-mono font-bold text-amber-700">
                      {agent.inviteCode}
                    </span>
                  }
                />
                <MobileField label="已邀请" value={`${agent.userCount}`} />
                <MobileField
                  label="开通会员权限"
                  value={
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        agent.canGrantMembership
                          ? "border border-sky-100 bg-sky-50 text-sky-700"
                          : "border border-stone-200 bg-white text-stone-500"
                      }`}
                    >
                      {agent.canGrantMembership ? "已开启" : "未开启"}
                    </span>
                  }
                />
                <MobileField label="创建日期" value={new Date(agent.createdAt).toLocaleDateString()} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => openEditModal(agent)}
                  className="flex items-center justify-center gap-1 rounded-2xl border border-stone-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 shadow-sm"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  编辑
                </button>
                <button
                  onClick={() => handleToggleMembershipGrant(agent.id, agent.canGrantMembership)}
                  className={`flex items-center justify-center gap-1 rounded-2xl border bg-white px-3 py-2.5 text-xs font-semibold shadow-sm ${
                    agent.canGrantMembership
                      ? "border-sky-200 text-sky-600"
                      : "border-stone-200 text-slate-600"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {agent.canGrantMembership ? "关权限" : "开权限"}
                </button>
                <button
                  onClick={() => handleToggleStatus(agent.id, agent.status)}
                  className={`flex items-center justify-center gap-1 rounded-2xl border bg-white px-3 py-2.5 text-xs font-semibold shadow-sm ${
                    agent.status === "active"
                      ? "border-amber-200 text-amber-600"
                      : "border-emerald-200 text-emerald-600"
                  }`}
                >
                  <Power className="h-3.5 w-3.5" />
                  {agent.status === "active" ? "停用" : "启用"}
                </button>
                <button
                  onClick={() => handleDelete(agent.id)}
                  className="flex items-center justify-center gap-1 rounded-2xl border border-rose-200 bg-white px-3 py-2.5 text-xs font-semibold text-rose-500 shadow-sm"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  删除
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-[30px] border border-stone-200 bg-white shadow-sm md:block">
        <table className="min-w-[1100px] w-full text-left text-sm">
          <thead className="bg-stone-50/50 text-stone-500">
            <tr>
              <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px]">代理人/登录邮箱</th>
              <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px]">联系微信</th>
              <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px]">专属注册码</th>
              <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px] text-center">已邀请人数</th>
              <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px]">开通会员权限</th>
              <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px]">状态</th>
              <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px]">创建日期</th>
              <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px] text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading && agents.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-8 py-20 text-center text-stone-400">
                  <RefreshCcw className="mx-auto mb-4 h-8 w-8 animate-spin opacity-20" />
                  正在获取数据...
                </td>
              </tr>
            ) : agents.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-8 py-20 text-center text-stone-400">
                  目前没有任何代理商记录
                </td>
              </tr>
            ) : (
              agents.map((agent) => (
                <tr key={agent.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-900 text-base">{agent.name}</div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">{agent.email}</div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-mono text-xs font-semibold text-slate-600">
                      {agent.contactWechat || "默认微信"}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="rounded-xl bg-amber-50 px-3 py-1.5 font-mono font-bold text-amber-700 border border-amber-100">
                      {agent.inviteCode}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-700">
                      <Users className="h-3.5 w-3.5" />
                      {agent.userCount}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold ${
                        agent.canGrantMembership
                          ? "border border-sky-100 bg-sky-50 text-sky-700"
                          : "border border-stone-200 bg-stone-50 text-stone-500"
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {agent.canGrantMembership ? "已开启" : "未开启"}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
                        agent.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-rose-50 text-rose-700 border border-rose-100"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${agent.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                      {agent.status === "active" ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-slate-500 font-medium">
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(agent)}
                        className="p-2.5 rounded-2xl bg-white border border-stone-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
                        title="编辑姓名"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleMembershipGrant(agent.id, agent.canGrantMembership)}
                        className={`p-2.5 rounded-2xl border transition shadow-sm ${
                          agent.canGrantMembership
                            ? "bg-white border-sky-200 text-sky-600 hover:bg-sky-50"
                            : "bg-white border-stone-200 text-slate-600 hover:bg-slate-50"
                        }`}
                        title={agent.canGrantMembership ? "关闭开通会员权限" : "开启开通会员权限"}
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(agent.id, agent.status)}
                        className={`p-2.5 rounded-2xl border transition shadow-sm ${
                          agent.status === "active"
                            ? "bg-white border-amber-200 text-amber-600 hover:bg-amber-50"
                            : "bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={agent.status === "active" ? "停用" : "启用"}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="p-2.5 rounded-2xl bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 transition shadow-sm"
                        title="删除代理"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg scale-in-center overflow-hidden rounded-[32px] bg-white p-10 shadow-2xl border border-white/20">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">新增代理商及其账号</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100 transition">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">代理人姓名</label>
                  <input
                    autoFocus
                    type="text"
                    placeholder="例如：王小明"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-slate-50 px-5 py-4 text-slate-900 focus:border-slate-950 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">登录邮箱 (用于代理后台登录)</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="agent@example.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-slate-50 pl-14 pr-5 py-4 text-slate-900 focus:border-slate-950 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">会员咨询微信号</label>
                  <input
                    type="text"
                    placeholder="不填则显示默认微信"
                    value={formContactWechat}
                    onChange={(e) => setFormContactWechat(e.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-slate-50 px-5 py-4 text-slate-900 focus:border-slate-950 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <label className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-slate-50 px-5 py-4">
                  <span>
                    <span className="block text-sm font-bold text-slate-800">允许手动开通会员</span>
                    <span className="mt-1 block text-xs text-slate-500">开启后，该代理可给名下用户开通会员。</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={formCanGrantMembership}
                    onChange={(e) => setFormCanGrantMembership(e.target.checked)}
                    className="h-5 w-5 rounded border-stone-300 text-slate-950"
                  />
                </label>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">初始登录密码</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="password"
                      placeholder="至少 6 位字符"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-slate-50 pl-14 pr-5 py-4 text-slate-900 focus:border-slate-950 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 rounded-2xl border border-stone-200 px-6 py-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  disabled={submitting || !formName.trim() || !formEmail.trim() || !formPassword.trim()}
                  className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-40 transition shadow-lg shadow-slate-200"
                >
                  {submitting ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  确认创建账号
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md scale-in-center overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl border border-white/20">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">编辑代理信息</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100 transition">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">代理人姓名</label>
                <input
                  autoFocus
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-2xl border border-stone-200 bg-slate-50 px-5 py-4 text-slate-900 focus:border-slate-950 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">会员咨询微信号</label>
                <input
                  type="text"
                  value={formContactWechat}
                  onChange={(e) => setFormContactWechat(e.target.value)}
                  placeholder="不填则显示默认微信"
                  className="w-full rounded-2xl border border-stone-200 bg-slate-50 px-5 py-4 text-slate-900 focus:border-slate-950 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <label className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-slate-50 px-5 py-4">
                <span>
                  <span className="block text-sm font-bold text-slate-800">允许手动开通会员</span>
                  <span className="mt-1 block text-xs text-slate-500">仅允许该代理操作自己邀请码注册的用户。</span>
                </span>
                <input
                  type="checkbox"
                  checked={formCanGrantMembership}
                  onChange={(e) => setFormCanGrantMembership(e.target.checked)}
                  className="h-5 w-5 rounded border-stone-300 text-slate-950"
                />
              </label>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">登录账号</div>
                  <div className="font-medium text-slate-700">{currentAgent?.email}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">专属注册码 (不可更改)</div>
                  <div className="font-mono font-bold text-amber-800">{currentAgent?.inviteCode}</div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 rounded-2xl border border-stone-200 px-6 py-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateName}
                  disabled={
                    submitting ||
                    !formName.trim() ||
                    (formName === currentAgent?.name &&
                      formContactWechat === (currentAgent?.contactWechat ?? "") &&
                      formCanGrantMembership === Boolean(currentAgent?.canGrantMembership))
                  }
                  className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-40 transition shadow-lg shadow-slate-200"
                >
                  {submitting ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  保存修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-xs font-medium text-slate-400">{label}</span>
      <span className="min-w-0 text-right text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}
