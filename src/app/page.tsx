"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabase/browser";

const supabase = createBrowserClient();
const projectId = "00000000-0000-0000-0000-000000000010";
const documentId = "00000000-0000-0000-0000-000000000040";
const typeId = "00000000-0000-0000-0000-000000000020";
const draftStatusId = "00000000-0000-0000-0000-000000000030";

type Requirement = {
  id: string;
  document_number: string;
  title: string;
  description?: string;
  status: { name: string } | { name: string }[] | null;
};

const statusName = (status: Requirement["status"]) => Array.isArray(status) ? status[0]?.name ?? "Draft" : status?.name ?? "Draft";
const statusClass = (status: string) => status === "Approved" ? "bg-emerald-50 text-emerald-700" : status === "In Review" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signup, setSignup] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [view, setView] = useState<"Document" | "Grid" | "Traceability">("Document");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadRequirements = useCallback(async () => {
    if (!supabase || !session) return;
    setLoading(true);
    const { data, error } = await supabase.from("work_items").select("id, document_number, title, description, status:workflow_states(name)").eq("project_id", projectId).eq("document_id", documentId).is("deleted_at", null).order("document_number");
    if (error) setMessage(error.message);
    const next = (data as Requirement[] | null) ?? [];
    setRequirements(next);
    setSelectedId((current) => current && next.some((item) => item.id === current) ? current : next[0]?.id ?? null);
    setLoading(false);
  }, [session]);

  useEffect(() => { if (session) void Promise.resolve().then(loadRequirements); }, [session, loadRequirements]);

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setAuthLoading(true);
    setMessage("");
    const result = signup ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setMessage(result.error.message);
    else if (signup) setMessage("가입 확인 이메일을 확인해 주세요.");
    setAuthLoading(false);
  }

  async function addRequirement(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !session || !newTitle.trim()) return;
    setSaving(true);
    setMessage("");
    const maxNumber = requirements.reduce((max, item) => Math.max(max, Number(item.document_number.replace("REQ-", "")) || 0), 0);
    const nextNumber = `REQ-${String(maxNumber + 1).padStart(4, "0")}`;
    const { error } = await supabase.from("work_items").insert({ project_id: projectId, document_id: documentId, type_id: typeId, status_id: draftStatusId, document_number: nextNumber, title: newTitle.trim(), description: newDescription.trim(), created_by: session.user.id, updated_by: session.user.id });
    if (error) setMessage(error.message);
    else { setModalOpen(false); setNewTitle(""); setNewDescription(""); await loadRequirements(); setMessage(`${nextNumber} 요구사항이 생성되었습니다.`); }
    setSaving(false);
  }

  const filteredRequirements = useMemo(() => statusFilter === "All" ? requirements : requirements.filter((item) => statusName(item.status) === statusFilter), [requirements, statusFilter]);
  const selected = requirements.find((item) => item.id === selectedId) ?? filteredRequirements[0] ?? null;

  if (!session) return <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-6 text-slate-900"><div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-sm font-bold text-[#12355b]">ALM Studio</p><h1 className="mt-5 text-2xl font-bold">요구사항 추적성 workspace</h1><p className="mt-2 text-sm text-slate-500">이메일로 로그인하면 프로젝트 데이터가 표시됩니다.</p><form onSubmit={submitAuth} className="mt-7 space-y-4"><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" /><input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 (6자 이상)" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" /><button disabled={authLoading} className="w-full rounded-lg bg-[#12355b] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{authLoading ? "처리 중..." : signup ? "회원가입" : "로그인"}</button></form>{message && <p className="mt-4 text-sm text-amber-700">{message}</p>}<button onClick={() => setSignup(!signup)} className="mt-5 text-sm text-blue-600">{signup ? "이미 계정이 있나요? 로그인" : "처음 사용하시나요? 회원가입"}</button></div></main>;

  return <main className="min-h-screen bg-[#f4f7fb] text-slate-900"><header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6"><div className="flex items-center gap-10"><span className="text-lg font-bold tracking-tight text-[#12355b]">ALM Studio</span><nav className="hidden gap-6 text-sm text-slate-500 md:flex">{["Projects", "Requirements", "Traceability", "Baselines", "Settings"].map((item) => <button key={item} onClick={() => setMessage(`${item} 메뉴는 다음 릴리스에서 연결됩니다.`)} className={item === "Requirements" ? "font-semibold text-[#12355b]" : "hover:text-[#12355b]"}>{item}</button>)}</nav></div><div className="flex items-center gap-3 text-sm"><span className="hidden text-slate-500 sm:inline">{session.user.email}</span><button onClick={() => void supabase?.auth.signOut()} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50">로그아웃</button></div></header><div className="flex min-h-[calc(100vh-4rem)]"><aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 lg:block"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current project</p><p className="mt-2 font-semibold">ADAS Platform 2026</p><p className="mt-1 text-xs text-slate-500">Requirements / System</p><p className="mb-3 mt-7 text-[11px] font-bold uppercase tracking-wider text-slate-400">Documents</p>{["System Requirements", "Chassis", "Powertrain", "Safety"].map((item, index) => <button key={item} onClick={() => setMessage(`${item} 문서를 선택했습니다.`)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${index === 0 ? "bg-[#eff6ff] font-medium text-[#1d4ed8]" : "text-slate-600 hover:bg-slate-50"}`}>{index === 0 ? "▾" : "▸"} {item}</button>)}<div className="mt-8 space-y-2 border-t border-slate-100 pt-5 text-sm text-slate-600"><button onClick={() => setFilterOpen(true)} className="block hover:text-blue-600">⌕ Filters</button><button onClick={() => setMessage("변경 이력은 다음 릴리스에서 연결됩니다.")} className="block hover:text-blue-600">◷ Change history</button><button onClick={() => setMessage("Baseline 관리는 다음 릴리스에서 연결됩니다.")} className="block hover:text-blue-600">◫ Baselines</button></div></aside><section className="min-w-0 flex-1 p-6 lg:p-8"><div className="mx-auto max-w-6xl"><p className="text-xs font-semibold uppercase tracking-widest text-[#2563eb]">System requirements</p><div className="mt-2 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">Requirements workspace</h1><p className="mt-2 text-sm text-slate-500">요구사항을 작성하고 추적성을 관리하세요.</p></div><button onClick={() => setModalOpen(true)} className="rounded-lg bg-[#12355b] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0d2947]">+ Add requirement</button></div><div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200"><div className="flex gap-5 text-sm">{(["Document", "Grid", "Traceability"] as const).map((item) => <button key={item} onClick={() => setView(item)} className={`pb-3 ${view === item ? "border-b-2 border-[#2563eb] font-semibold text-[#1d4ed8]" : "text-slate-500 hover:text-slate-800"}`}>{item}</button>)}</div><div className="mb-2 flex gap-2"><button onClick={() => setFilterOpen(!filterOpen)} className={`rounded-md border px-3 py-1.5 text-xs ${filterOpen ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600"}`}>Filter{statusFilter !== "All" ? `: ${statusFilter}` : ""}</button><button onClick={() => setColumnsOpen(!columnsOpen)} className={`rounded-md border px-3 py-1.5 text-xs ${columnsOpen ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600"}`}>Columns</button></div></div>{filterOpen && <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs"><span className="font-medium text-blue-800">Status</span>{["All", "Draft", "In Review", "Approved"].map((item) => <button key={item} onClick={() => { setStatusFilter(item); setFilterOpen(false); }} className={`rounded-md px-2 py-1 ${statusFilter === item ? "bg-blue-600 text-white" : "bg-white text-slate-600"}`}>{item}</button>)}</div>}{columnsOpen && <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs"><input id="description-column" type="checkbox" checked={showDescription} onChange={(e) => setShowDescription(e.target.checked)} /><label htmlFor="description-column">Description 컬럼 표시</label></div>}<div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]"><div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-sm font-semibold">System Requirements {view === "Grid" && "· Grid view"}{view === "Traceability" && "· Traceability view"}</p><p className="mt-1 text-xs text-slate-500">{filteredRequirements.length} items · Live from Supabase</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">RLS protected</span></div>{loading ? <p className="px-5 py-8 text-sm text-slate-500">불러오는 중...</p> : filteredRequirements.length === 0 ? <p className="px-5 py-8 text-sm text-slate-500">조건에 맞는 요구사항이 없습니다.</p> : <div className="divide-y divide-slate-100">{filteredRequirements.map((item) => { const status = statusName(item.status); return <button key={item.id} onClick={() => setSelectedId(item.id)} className={`block w-full px-5 py-4 text-left transition hover:bg-slate-50 ${selected?.id === item.id ? "bg-blue-50/50" : ""}`}><div className="flex items-start gap-3"><span className="mt-1 text-slate-300">⋮⋮</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-semibold text-[#2563eb]">{item.document_number}</span><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass(status)}`}>{status}</span></div><h2 className="mt-2 text-sm font-medium text-slate-800">{item.title}</h2>{showDescription && <p className="mt-2 text-xs text-slate-500">{item.description || "설명 없음"}</p>}</div><span className="text-xs text-slate-400">선택</span></div></button>; })}</div>}</div><aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Selected item</p><p className="mt-1 font-mono text-xs font-semibold text-[#2563eb]">{selected?.document_number ?? "-"}</p></div>{selected && <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${statusClass(statusName(selected.status))}`}>{statusName(selected.status)}</span>}</div><h2 className="mt-5 text-sm font-semibold leading-6">{selected?.title ?? "요구사항을 선택하세요"}</h2><div className="mt-6 space-y-4 border-t border-slate-100 pt-5 text-xs"><div><p className="text-slate-400">Type</p><p className="mt-1 font-medium">System Requirement</p></div><div><p className="text-slate-400">Trace links</p><button onClick={() => setView("Traceability")} className="mt-1 font-medium text-[#2563eb] hover:underline">3 linked items →</button></div><div><p className="text-slate-400">Updated by</p><p className="mt-1 font-medium">{session.user.email}</p></div></div><button onClick={() => setView("Traceability")} className="mt-7 w-full rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 text-xs font-semibold text-[#1d4ed8]">Open traceability</button></aside></div>{message && <p className="mt-4 text-sm text-amber-700">{message}</p>}</div></section></div>{modalOpen && <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/30 px-6"><form onSubmit={addRequirement} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Add requirement</h2><button type="button" onClick={() => setModalOpen(false)} className="text-slate-400">✕</button></div><p className="mt-1 text-sm text-slate-500">새 시스템 요구사항을 Draft 상태로 생성합니다.</p><label className="mt-6 block text-xs font-semibold text-slate-600">Title<input required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" placeholder="예: 차량은 차선을 이탈하면 경고해야 한다" /></label><label className="mt-4 block text-xs font-semibold text-slate-600">Description<textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" placeholder="검증 기준과 상세 설명" /></label><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancel</button><button disabled={saving} className="rounded-lg bg-[#12355b] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : "Create requirement"}</button></div></form></div>}</main>;
}
