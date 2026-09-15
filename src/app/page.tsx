"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabase/browser";

const supabase = createBrowserClient();
const projectId = "00000000-0000-0000-0000-000000000010";
const documentId = "00000000-0000-0000-0000-000000000040";

type Requirement = { id: string; document_number: string; title: string; status: { name: string } | { name: string }[] | null };
const getStatus = (status: Requirement["status"]) => Array.isArray(status) ? status[0]?.name ?? "Draft" : status?.name ?? "Draft";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signup, setSignup] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session) return;
    void supabase.from("work_items").select("id, document_number, title, status:workflow_states(name)").eq("project_id", projectId).eq("document_id", documentId).is("deleted_at", null).order("document_number").then(({ data, error }) => {
      if (error) setMessage(error.message);
      setRequirements((data as Requirement[] | null) ?? []);
      setLoading(false);
    });
  }, [session]);

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setMessage("");
    const result = signup ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setMessage(result.error.message);
    else if (signup) setMessage("가입 확인 이메일을 확인해 주세요.");
  }

  if (!session) return <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-6 text-slate-900"><div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-sm font-bold text-[#12355b]">ALM Studio</p><h1 className="mt-5 text-2xl font-bold">요구사항 추적성 workspace</h1><p className="mt-2 text-sm text-slate-500">이메일로 로그인하면 프로젝트 데이터가 표시됩니다.</p><form onSubmit={submitAuth} className="mt-7 space-y-4"><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" /><input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 (6자 이상)" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" /><button className="w-full rounded-lg bg-[#12355b] px-4 py-2.5 text-sm font-semibold text-white">{signup ? "회원가입" : "로그인"}</button></form>{message && <p className="mt-4 text-sm text-amber-700">{message}</p>}<button onClick={() => setSignup(!signup)} className="mt-5 text-sm text-blue-600">{signup ? "이미 계정이 있나요? 로그인" : "처음 사용하시나요? 회원가입"}</button></div></main>;

  return <main className="min-h-screen bg-[#f4f7fb] text-slate-900"><header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6"><div className="flex items-center gap-10"><span className="text-lg font-bold tracking-tight text-[#12355b]">ALM Studio</span><nav className="hidden gap-6 text-sm text-slate-500 md:flex"><span>Projects</span><span className="font-semibold text-[#12355b]">Requirements</span><span>Traceability</span><span>Baselines</span><span>Settings</span></nav></div><div className="flex items-center gap-3 text-sm"><span className="hidden text-slate-500 sm:inline">{session.user.email}</span><button onClick={() => void supabase?.auth.signOut()} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs">로그아웃</button></div></header><div className="flex min-h-[calc(100vh-4rem)]"><aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 lg:block"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current project</p><p className="mt-2 font-semibold">ADAS Platform 2026</p><p className="mt-1 text-xs text-slate-500">Requirements / System</p><p className="mb-3 mt-7 text-[11px] font-bold uppercase tracking-wider text-slate-400">Documents</p><p className="rounded-lg bg-[#eff6ff] px-3 py-2 text-sm font-medium text-[#1d4ed8]">▾ System Requirements</p></aside><section className="min-w-0 flex-1 p-6 lg:p-8"><div className="mx-auto max-w-6xl"><p className="text-xs font-semibold uppercase tracking-widest text-[#2563eb]">System requirements</p><div className="mt-2 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">Requirements workspace</h1><p className="mt-2 text-sm text-slate-500">Supabase에서 읽어온 실제 요구사항 목록입니다.</p></div><button className="rounded-lg bg-[#12355b] px-4 py-2.5 text-sm font-semibold text-white">+ Add requirement</button></div><div className="mt-7 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-sm font-semibold">System Requirements</p><p className="mt-1 text-xs text-slate-500">{requirements.length} items · Live from Supabase</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">RLS protected</span></div>{loading ? <p className="px-5 py-8 text-sm text-slate-500">불러오는 중...</p> : requirements.length === 0 ? <p className="px-5 py-8 text-sm text-slate-500">표시할 요구사항이 없습니다.</p> : <div className="divide-y divide-slate-100">{requirements.map((item) => <article key={item.id} className="px-5 py-4"><span className="font-mono text-xs font-semibold text-[#2563eb]">{item.document_number}</span><span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">{getStatus(item.status)}</span><h2 className="mt-2 text-sm font-medium text-slate-800">{item.title}</h2></article>)}</div>}</div>{message && <p className="mt-4 text-sm text-amber-700">{message}</p>}</div></section></div></main>;
}
