"use client";

import React, { useState, useEffect, useMemo } from "react";
import { LayoutDashboard, Users, Wallet, CalendarClock, FileDown, Plus, X, Phone, Trash2, Pencil, Check, Clock, TriangleAlert as AlertTriangle, ChevronRight, ChevronLeft, MessageCircle, Copy, Printer, Banknote, Landmark, ArrowRightLeft, Menu, CircleDollarSign, Crown, Search } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Base app wrapper class                                             */
/*  Fonts are loaded globally in app/layout.jsx via next/font/google   */
/*  (Cairo for headings/"display", Tajawal for body text).             */
/*  Base colors/spacing/print rules live in app/globals.css.           */
/* ------------------------------------------------------------------ */
/*  Palette                                                            */
/* ------------------------------------------------------------------ */
const C = {
  ink: "#1E2A24",
  mute: "#5B685F",
  faint: "#8B958A",
  line: "#DDE2D8",
  paper: "#F2F4EF",
  card: "#FFFFFF",
  emerald: "#0F6B52",
  emeraldDark: "#0B4F3D",
  emeraldFaint: "#E3EFE8",
  gold: "#B8862F",
  goldFaint: "#F6EDDA",
  red: "#B3402F",
  redFaint: "#FBEAE6",
};

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const money = (n) =>
  (Math.round((n || 0) * 100) / 100).toLocaleString("ar-EG", { maximumFractionDigits: 2 });

const ARABIC_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function frequencyText(frequency) {
  return frequency === "weekly"
    ? { adverb: "أسبوعياً", unit: "الأسابيع", singular: "أسبوعاً", label: "أسبوعي" }
    : { adverb: "شهرياً", unit: "الأشهر", singular: "شهراً", label: "شهري" };
}

function addPeriod(dateISO, frequency, n) {
  const d = new Date(dateISO + "T00:00:00");
  if (frequency === "weekly") d.setDate(d.getDate() + 7 * n);
  else d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

function periodLabel(dateISO, frequency) {
  const d = new Date(dateISO + "T00:00:00");
  if (frequency === "weekly") {
    return `أسبوع ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }
  return `${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function generatePeriods(assoc) {
  const periods = [];
  for (let i = 0; i < assoc.totalShares; i++) {
    periods.push(addPeriod(assoc.startDate, assoc.frequency, i));
  }
  return periods;
}

function currentPeriodKey(assoc) {
  const periods = generatePeriods(assoc);
  const today = todayISO();
  let key = periods[0];
  for (const p of periods) {
    if (p <= today) key = p;
  }
  return key;
}

function totalShareCount(assoc) {
  return (assoc.members || []).reduce((s, m) => s + (m.shares || 0), 0);
}

/* ------------------------------------------------------------------ */
/*  Storage (browser localStorage — persists per-device)               */
/*  Swap this module for a Supabase/SQLite-backed API layer later if   */
/*  you need data to sync across devices instead of staying local.     */
/* ------------------------------------------------------------------ */
const STORAGE_KEY = "jamya-associations-v1";

function loadAssociations() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}
function saveAssociations(list) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
}

function seedData() {
  const start = todayISO();
  const id = uid();
  const m1 = uid(), m2 = uid(), m3 = uid(), m4 = uid();
  return [
    {
      id,
      name: "جمعية الموظفين",
      shareAmount: 100,
      totalShares: 4,
      frequency: "monthly",
      startDate: start,
      endDate: addPeriod(start, "monthly", 3),
      members: [
        { id: m1, name: "سارة أحمد", phone: "0791234567", shares: 1 },
        { id: m2, name: "محمد خالد", phone: "0797654321", shares: 1 },
        { id: m3, name: "ليان ناصر", phone: "0788887777", shares: 0.5 },
        { id: m4, name: "عمر يوسف", phone: "0799990000", shares: 1.5 },
      ],
      turns: [],
      payments: {},
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */
function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-sm font-medium mb-1" style={{ color: C.mute }}>{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors";
function inputStyle(focused) {
  return { borderColor: focused ? C.emerald : C.line, background: "#fff" };
}

function TextInput(props) {
  const [f, setF] = useState(false);
  return (
    <input
      {...props}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      className={inputCls + " " + (props.className || "")}
      style={inputStyle(f)}
    />
  );
}
function Select(props) {
  const [f, setF] = useState(false);
  return (
    <select
      {...props}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      className={inputCls + " " + (props.className || "")}
      style={inputStyle(f)}
    />
  );
}

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: { bg: "#EEF1EA", fg: C.mute },
    green: { bg: C.emeraldFaint, fg: C.emeraldDark },
    red: { bg: C.redFaint, fg: C.red },
    gold: { bg: C.goldFaint, fg: "#7A5A1E" },
  };
  const t = tones[tone];
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
      style={{ background: t.bg, color: t.fg }}
    >
      {children}
    </span>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(20,26,22,0.45)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl w-full overflow-hidden flex flex-col"
        style={{ background: C.card, maxWidth: wide ? 640 : 460, maxHeight: "90vh" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: C.line }}
        >
          <h3 className="font-cairo font-bold text-base">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, body, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: C.emeraldFaint, color: C.emeraldDark }}
      >
        <Icon size={28} />
      </div>
      <h3 className="font-cairo font-bold text-lg mb-1">{title}</h3>
      <p className="text-sm mb-5" style={{ color: C.mute, maxWidth: 320 }}>{body}</p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-2"
          style={{ background: C.emerald }}
        >
          <Plus size={16} /> {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  New / Edit Association Modal                                       */
/* ------------------------------------------------------------------ */
function AssociationForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial || {
      name: "",
      shareAmount: 50,
      totalShares: 10,
      frequency: "monthly",
      startDate: todayISO(),
    }
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim()) return;
    const endDate = addPeriod(form.startDate, form.frequency, Number(form.totalShares) - 1);
    onSave({
      ...form,
      shareAmount: Number(form.shareAmount) || 0,
      totalShares: Number(form.totalShares) || 1,
      endDate,
    });
  };

  return (
    <Modal title={initial ? "تعديل الجمعية" : "إنشاء جمعية جديدة"} onClose={onClose}>
      <Field label="اسم الجمعية">
        <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="مثال: جمعية الحي" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`قيمة السهم (${frequencyText(form.frequency).adverb})`}>
          <TextInput type="number" min="0" value={form.shareAmount} onChange={(e) => set("shareAmount", e.target.value)} />
        </Field>
        <Field label={`عدد ${frequencyText(form.frequency).unit}/الدورات`}>
          <TextInput type="number" min="1" step="1" value={form.totalShares} onChange={(e) => set("totalShares", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="التكرار">
          <Select value={form.frequency} onChange={(e) => set("frequency", e.target.value)}>
            <option value="monthly">شهري</option>
            <option value="weekly">أسبوعي</option>
          </Select>
        </Field>
        <Field label="تاريخ البدء">
          <TextInput type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </Field>
      </div>
      <p className="text-xs mb-4" style={{ color: C.faint }}>
        تاريخ الانتهاء المتوقع: {addPeriod(form.startDate, form.frequency, Math.max(0, Number(form.totalShares) - 1))}
      </p>
      <button
        onClick={submit}
        className="w-full py-2.5 rounded-lg text-sm font-bold text-white"
        style={{ background: C.emerald }}
      >
        {initial ? "حفظ التعديلات" : "إنشاء الجمعية"}
      </button>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Member form modal                                                  */
/* ------------------------------------------------------------------ */
function MemberForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { name: "", phone: "", shares: 1 });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, shares: Number(form.shares) || 0 });
  };
  return (
    <Modal title={initial ? "تعديل بيانات المشترك" : "إضافة مشترك جديد"} onClose={onClose}>
      <Field label="الاسم">
        <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="اسم المشترك" />
      </Field>
      <Field label="رقم الهاتف">
        <TextInput value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07XXXXXXXX" dir="ltr" />
      </Field>
      <Field label="عدد الأسهم">
        <Select value={form.shares} onChange={(e) => set("shares", e.target.value)}>
          <option value={0.5}>نصف سهم</option>
          <option value={1}>سهم واحد</option>
          <option value={1.5}>سهم ونصف</option>
          <option value={2}>سهمان</option>
          <option value={2.5}>سهمان ونصف</option>
          <option value={3}>ثلاثة أسهم</option>
        </Select>
      </Field>
      <button
        onClick={submit}
        className="w-full py-2.5 rounded-lg text-sm font-bold text-white mt-2"
        style={{ background: C.emerald }}
      >
        {initial ? "حفظ" : "إضافة المشترك"}
      </button>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                             */
/* ------------------------------------------------------------------ */
function Sidebar({ page, setPage, mobileOpen, setMobileOpen }) {
  const items = [
    { key: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
    { key: "associations", label: "الجمعيات", icon: Wallet },
  ];
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className={`fixed md:static top-0 bottom-0 right-0 z-50 w-64 md:w-56 shrink-0 border-l flex flex-col transition-transform ${
          mobileOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
        style={{ background: C.emeraldDark, borderColor: C.line }}
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center stamp" style={{ color: "#EFE6C8" }}>
            <CircleDollarSign size={18} color="#EFE6C8" />
          </div>
          <div>
            <div className="font-cairo font-extrabold text-white text-base leading-tight">دفتري</div>
            <div className="text-[11px]" style={{ color: "#B9CFC3" }}>إدارة الجمعيات المالية</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1">
          {items.map((it) => {
            const active = page === it.key;
            const Icon = it.icon;
            return (
              <button
                key={it.key}
                onClick={() => { setPage(it.key); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  background: active ? "rgba(255,255,255,0.12)" : "transparent",
                  color: active ? "#fff" : "#B9CFC3",
                }}
              >
                <Icon size={18} />
                {it.label}
              </button>
            );
          })}
        </nav>
        <div className="px-5 py-4 text-[11px]" style={{ color: "#7FA095" }}>
          بياناتك محفوظة على هذا الحساب فقط
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                           */
/* ------------------------------------------------------------------ */
function Dashboard({ associations, openAssociation, goPayments }) {
  const active = associations.filter((a) => todayISO() <= a.endDate);
  const totalMonthly = active.reduce((sum, a) => sum + a.shareAmount * totalShareCount(a), 0);

  const payoutsThisMonth = active
    .map((a) => {
      const period = currentPeriodKey(a);
      const turn = (a.turns || []).find((t) => t.period === period);
      const member = turn ? a.members.find((m) => m.id === turn.memberId) : null;
      const payoutStatus = a.payments?.[period]?.payout?.status || "pending";
      return { assoc: a, period, member, payoutStatus };
    })
    .filter((x) => x.member);

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-cairo text-2xl font-extrabold">لوحة التحكم</h1>
          <p className="text-sm mt-1" style={{ color: C.mute }}>نظرة عامة على جميع جمعياتك</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-2 text-sm mb-2" style={{ color: C.mute }}>
            <Wallet size={16} /> الجمعيات النشطة
          </div>
          <div className="font-cairo text-3xl font-extrabold tabnum">{active.length}</div>
        </div>
        <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-2 text-sm mb-2" style={{ color: C.mute }}>
            <Banknote size={16} /> إجمالي التحصيل الشهري
          </div>
          <div className="font-cairo text-3xl font-extrabold tabnum">{money(totalMonthly)} د.أ</div>
        </div>
        <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-2 text-sm mb-2" style={{ color: C.mute }}>
            <Crown size={16} /> صرف الدور الحالي
          </div>
          <div className="font-cairo text-lg font-extrabold">
            {payoutsThisMonth.filter((p) => p.payoutStatus === "paid").length} / {payoutsThisMonth.length} تم الصرف
          </div>
        </div>
      </div>

      <h2 className="font-cairo font-bold text-base mb-3">جمعياتك</h2>
      {associations.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="لا توجد جمعيات بعد"
          body="ابدأ بإنشاء أول جمعية لتتمكن من متابعة الاشتراكات والأدوار."
          actionLabel="إنشاء جمعية"
          onAction={() => openAssociation("new")}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {associations.map((a) => {
            const period = currentPeriodKey(a);
            const memPay = a.payments?.[period]?.members || {};
            const paidCount = a.members.filter((m) => memPay[m.id]?.status === "paid").length;
            const turn = (a.turns || []).find((t) => t.period === period);
            const receiver = turn ? a.members.find((m) => m.id === turn.memberId) : null;
            return (
              <div key={a.id} className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-base">{a.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: C.mute }}>
                      {periodLabel(period, a.frequency)} · {a.members.length} مشترك
                    </div>
                  </div>
                  <Badge tone={todayISO() <= a.endDate ? "green" : "neutral"}>
                    {todayISO() <= a.endDate ? "نشطة" : "منتهية"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span style={{ color: C.mute }}>الدفعات المسددة هذا الدور</span>
                  <span className="font-bold tabnum">{paidCount}/{a.members.length}</span>
                </div>
                {receiver && (
                  <div className="flex items-center gap-2 text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: C.goldFaint }}>
                    <Crown size={14} color="#7A5A1E" />
                    <span style={{ color: "#7A5A1E" }}>القابض هذا الدور: <b>{receiver.name}</b></span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => goPayments(a.id)}
                    className="flex-1 py-2 rounded-lg text-sm font-bold text-white"
                    style={{ background: C.emerald }}
                  >
                    تسجيل دفعة
                  </button>
                  <button
                    onClick={() => openAssociation(a.id)}
                    className="px-3 py-2 rounded-lg text-sm font-semibold"
                    style={{ border: `1px solid ${C.line}` }}
                  >
                    التفاصيل
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Associations list page                                             */
/* ------------------------------------------------------------------ */
function AssociationsList({ associations, openAssociation, onCreate, onDelete }) {
  const [query, setQuery] = useState("");
  const filtered = associations.filter((a) => a.name.includes(query));
  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-cairo text-2xl font-extrabold">الجمعيات</h1>
        <button
          onClick={onCreate}
          className="px-4 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-2"
          style={{ background: C.emerald }}
        >
          <Plus size={16} /> جمعية جديدة
        </button>
      </div>
      <div className="relative mb-5 max-w-xs">
        <Search size={16} className="absolute top-1/2 -translate-y-1/2 right-3" style={{ color: C.faint }} />
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث باسم الجمعية"
          className="pr-9"
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={Wallet} title="لا توجد نتائج" body="لم يتم العثور على جمعيات مطابقة." />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer hover:shadow-sm"
              style={{ background: C.card, border: `1px solid ${C.line}` }}
              onClick={() => openAssociation(a.id)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-bold"
                  style={{ background: C.emeraldFaint, color: C.emeraldDark }}
                >
                  {a.name.slice(0, 1)}
                </div>
                <div>
                  <div className="font-bold">{a.name}</div>
                  <div className="text-xs" style={{ color: C.mute }}>
                    {a.members.length} مشترك · {money(a.shareAmount)} د.أ للسهم {frequencyText(a.frequency).adverb} · {frequencyText(a.frequency).label}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={todayISO() <= a.endDate ? "green" : "neutral"}>
                  {todayISO() <= a.endDate ? "نشطة" : "منتهية"}
                </Badge>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(a.id); }}
                  className="p-2 rounded-lg hover:bg-black/5"
                  style={{ color: C.red }}
                >
                  <Trash2 size={16} />
                </button>
                <ChevronLeft size={18} style={{ color: C.faint }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Association detail                                                  */
/* ------------------------------------------------------------------ */
function AssociationDetail({ assoc, updateAssoc, deleteAssoc, back, jumpToPayments }) {
  const [tab, setTab] = useState(jumpToPayments ? "ledger" : "overview");
  const [memberModal, setMemberModal] = useState(null); // null | 'new' | member obj
  const [editModal, setEditModal] = useState(false);
  const periods = useMemo(() => generatePeriods(assoc), [assoc]);
  const [period, setPeriod] = useState(currentPeriodKey(assoc));

  useEffect(() => { if (jumpToPayments) setTab("ledger"); }, [jumpToPayments]);

  const saveMember = (m) => {
    let members;
    if (m.id) {
      members = assoc.members.map((x) => (x.id === m.id ? m : x));
    } else {
      members = [...assoc.members, { ...m, id: uid() }];
    }
    updateAssoc({ ...assoc, members });
    setMemberModal(null);
  };
  const deleteMember = (id) => {
    updateAssoc({ ...assoc, members: assoc.members.filter((m) => m.id !== id) });
  };

  const tabs = [
    { key: "overview", label: "نظرة عامة", icon: LayoutDashboard },
    { key: "members", label: "المشتركين", icon: Users },
    { key: "ledger", label: "السجل الحسابي", icon: Wallet },
    { key: "turns", label: "أدوار الاستلام", icon: CalendarClock },
    { key: "reports", label: "التقارير", icon: FileDown },
  ];

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <button onClick={back} className="flex items-center gap-1 text-sm font-semibold mb-4" style={{ color: C.mute }}>
        <ChevronRight size={16} /> رجوع إلى الجمعيات
      </button>

      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="font-cairo text-2xl font-extrabold">{assoc.name}</h1>
          <p className="text-sm mt-1" style={{ color: C.mute }}>
            {money(assoc.shareAmount)} د.أ للسهم {frequencyText(assoc.frequency).adverb} · {assoc.totalShares} {frequencyText(assoc.frequency).singular} · يبدأ {assoc.startDate}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditModal(true)} className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1" style={{ border: `1px solid ${C.line}` }}>
            <Pencil size={14} /> تعديل
          </button>
          <button onClick={() => deleteAssoc(assoc.id)} className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1" style={{ border: `1px solid ${C.line}`, color: C.red }}>
            <Trash2 size={14} /> حذف
          </button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto mb-6 pb-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
              style={{
                background: active ? C.emerald : "transparent",
                color: active ? "#fff" : C.mute,
              }}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <OverviewTab assoc={assoc} periods={periods} />}
      {tab === "members" && (
        <MembersTab
          assoc={assoc}
          onAdd={() => setMemberModal("new")}
          onEdit={(m) => setMemberModal(m)}
          onDelete={deleteMember}
        />
      )}
      {tab === "ledger" && (
        <LedgerTab assoc={assoc} updateAssoc={updateAssoc} periods={periods} period={period} setPeriod={setPeriod} />
      )}
      {tab === "turns" && <TurnsTab assoc={assoc} updateAssoc={updateAssoc} periods={periods} />}
      {tab === "reports" && <ReportsTab assoc={assoc} periods={periods} />}

      {memberModal && (
        <MemberForm
          initial={memberModal === "new" ? null : memberModal}
          onClose={() => setMemberModal(null)}
          onSave={saveMember}
        />
      )}
      {editModal && (
        <AssociationForm
          initial={assoc}
          onClose={() => setEditModal(false)}
          onSave={(data) => { updateAssoc({ ...assoc, ...data }); setEditModal(false); }}
        />
      )}
    </div>
  );
}

function OverviewTab({ assoc, periods }) {
  const shares = totalShareCount(assoc);
  const monthlyPool = assoc.shareAmount * shares;
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          ["عدد المشتركين", assoc.members.length],
          ["إجمالي الأسهم", shares],
          ["قيمة السهم", money(assoc.shareAmount) + " د.أ"],
          ["إجمالي التحصيل بالدور", money(monthlyPool) + " د.أ"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="text-xs mb-1" style={{ color: C.mute }}>{label}</div>
            <div className="font-extrabold text-lg tabnum">{value}</div>
          </div>
        ))}
      </div>
      <h3 className="font-cairo font-bold text-base mb-3">جدول الدورات</h3>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}`, background: C.card }}>
        {periods.map((p, i) => {
          const turn = (assoc.turns || []).find((t) => t.period === p);
          const member = turn ? assoc.members.find((m) => m.id === turn.memberId) : null;
          return (
            <div key={p} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: i < periods.length - 1 ? `1px solid ${C.line}` : "none" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold stamp" style={{ color: C.emeraldDark }}>
                  {i + 1}
                </div>
                <span className="text-sm font-medium">{periodLabel(p, assoc.frequency)}</span>
              </div>
              <span className="text-sm" style={{ color: member ? C.emeraldDark : C.faint }}>
                {member ? member.name : "لم يُحدد بعد"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MembersTab({ assoc, onAdd, onEdit, onDelete }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-cairo font-bold text-base">المشتركين ({assoc.members.length})</h3>
        <button onClick={onAdd} className="px-3 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-1" style={{ background: C.emerald }}>
          <Plus size={15} /> إضافة مشترك
        </button>
      </div>
      {assoc.members.length === 0 ? (
        <EmptyState icon={Users} title="لا يوجد مشتركين" body="أضف أول مشترك للبدء بمتابعة الاشتراكات." actionLabel="إضافة مشترك" onAction={onAdd} />
      ) : (
        <div className="space-y-2">
          {assoc.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: C.emeraldFaint, color: C.emeraldDark }}>
                  {m.name.slice(0, 1)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{m.name}</div>
                  <div className="text-xs flex items-center gap-1" style={{ color: C.mute }}>
                    <Phone size={12} /> {m.phone || "بدون رقم"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone="gold">{m.shares} سهم</Badge>
                <div className="text-sm font-bold tabnum" style={{ color: C.emeraldDark }}>{money(m.shares * assoc.shareAmount)} د.أ</div>
                <button onClick={() => onEdit(m)} className="p-2 rounded-lg hover:bg-black/5"><Pencil size={14} /></button>
                <button onClick={() => onDelete(m.id)} className="p-2 rounded-lg hover:bg-black/5" style={{ color: C.red }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const METHODS = [
  { key: "cash", label: "كاش", icon: Banknote },
  { key: "transfer", label: "تحويل بنكي", icon: Landmark },
  { key: "other", label: "أخرى", icon: ArrowRightLeft },
];

function statusMeta(status) {
  if (status === "paid") return { label: "مسدد", tone: "green", icon: Check };
  if (status === "partial") return { label: "جزئي", tone: "gold", icon: Clock };
  return { label: "غير مسدد", tone: "red", icon: AlertTriangle };
}

function LedgerTab({ assoc, updateAssoc, periods, period, setPeriod }) {
  const idx = periods.indexOf(period);
  const memPayments = assoc.payments?.[period]?.members || {};
  const payout = assoc.payments?.[period]?.payout || {};
  const turn = (assoc.turns || []).find((t) => t.period === period);
  const receiver = turn ? assoc.members.find((m) => m.id === turn.memberId) : null;
  const isOverduePeriod = period < todayISO();

  const patchPeriod = (patch) => {
    const existing = assoc.payments?.[period] || { members: {}, payout: {} };
    updateAssoc({
      ...assoc,
      payments: { ...assoc.payments, [period]: { ...existing, ...patch } },
    });
  };

  const cycleStatus = (memberId) => {
    const current = memPayments[memberId]?.status || "unpaid";
    const next = current === "unpaid" ? "paid" : current === "paid" ? "partial" : "unpaid";
    const prior = memPayments[memberId] || {};
    patchPeriod({
      members: {
        ...memPayments,
        [memberId]: {
          ...prior,
          status: next,
          date: next === "unpaid" ? null : prior.date || todayISO(),
          method: prior.method || "cash",
        },
      },
    });
  };

  const setMethod = (memberId, method) => {
    const prior = memPayments[memberId] || { status: "unpaid" };
    patchPeriod({ members: { ...memPayments, [memberId]: { ...prior, method } } });
  };

  const togglePayout = () => {
    patchPeriod({
      payout: {
        memberId: receiver?.id,
        status: payout.status === "paid" ? "pending" : "paid",
        date: todayISO(),
      },
    });
  };

  const waMessage = (m) => {
    const due = m.shares * assoc.shareAmount;
    const text = `مرحباً ${m.name} 🌿\nتذكير بخصوص جمعية "${assoc.name}"\nقيمة الاشتراك المستحق: ${money(due)} د.أ\nعن دور: ${periodLabel(period, assoc.frequency)}\nنرجو التكرم بالسداد في أقرب وقت ممكن، ولكم جزيل الشكر.`;
    return text;
  };

  const sendWhatsapp = (m) => {
    const text = encodeURIComponent(waMessage(m));
    const phone = (m.phone || "").replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };
  const copyMessage = async (m) => {
    try { await navigator.clipboard.writeText(waMessage(m)); } catch (e) {}
  };

  const totalDue = assoc.members.reduce((s, m) => s + m.shares * assoc.shareAmount, 0);
  const totalPaid = assoc.members.reduce((s, m) => {
    const st = memPayments[m.id]?.status;
    return s + (st === "paid" ? m.shares * assoc.shareAmount : 0);
  }, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            disabled={idx <= 0}
            onClick={() => setPeriod(periods[idx - 1])}
            className="p-2 rounded-lg disabled:opacity-30"
            style={{ border: `1px solid ${C.line}` }}
          >
            <ChevronRight size={16} />
          </button>
          <div className="text-sm font-bold px-3 py-2 rounded-lg" style={{ background: C.emeraldFaint, color: C.emeraldDark }}>
            {periodLabel(period, assoc.frequency)} <span className="tabnum">({idx + 1}/{periods.length})</span>
          </div>
          <button
            disabled={idx >= periods.length - 1}
            onClick={() => setPeriod(periods[idx + 1])}
            className="p-2 rounded-lg disabled:opacity-30"
            style={{ border: `1px solid ${C.line}` }}
          >
            <ChevronLeft size={16} />
          </button>
        </div>
        <div className="text-sm tabnum" style={{ color: C.mute }}>
          محصّل: <b style={{ color: C.emeraldDark }}>{money(totalPaid)}</b> / {money(totalDue)} د.أ
        </div>
      </div>

      {receiver && (
        <div className="flex items-center justify-between rounded-2xl px-4 py-3 mb-5" style={{ background: C.goldFaint }}>
          <div className="flex items-center gap-2">
            <Crown size={18} color="#7A5A1E" />
            <div>
              <div className="text-sm font-bold" style={{ color: "#7A5A1E" }}>القابض هذا الدور: {receiver.name}</div>
              <div className="text-xs" style={{ color: "#8A6B2E" }}>إجمالي المبلغ: {money(assoc.shareAmount * totalShareCount(assoc))} د.أ</div>
            </div>
          </div>
          <button
            onClick={togglePayout}
            className="px-3 py-2 rounded-lg text-sm font-bold"
            style={{
              background: payout.status === "paid" ? C.emerald : "#fff",
              color: payout.status === "paid" ? "#fff" : "#7A5A1E",
              border: payout.status === "paid" ? "none" : "1px solid #C9A968",
            }}
          >
            {payout.status === "paid" ? "تم الصرف ✓" : "تحديد كمصروف"}
          </button>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}`, background: C.card }}>
        <div className="hidden sm:grid grid-cols-[1.6fr_0.8fr_0.9fr_0.9fr_1fr_1.2fr] gap-2 px-4 py-2 text-xs font-bold" style={{ color: C.mute, borderBottom: `1px solid ${C.line}` }}>
          <span>المشترك</span><span>المستحق</span><span>الحالة</span><span>التاريخ</span><span>الطريقة</span><span>تذكير</span>
        </div>
        {assoc.members.map((m, i) => {
          const p = memPayments[m.id] || { status: "unpaid" };
          const meta = statusMeta(p.status);
          const overdue = p.status !== "paid" && isOverduePeriod;
          const due = m.shares * assoc.shareAmount;
          const StatusIcon = meta.icon;
          return (
            <div
              key={m.id}
              className="grid grid-cols-2 sm:grid-cols-[1.6fr_0.8fr_0.9fr_0.9fr_1fr_1.2fr] gap-2 items-center px-4 py-3"
              style={{ borderBottom: i < assoc.members.length - 1 ? `1px solid ${C.line}` : "none" }}
            >
              <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
                <span className="font-semibold text-sm">{m.name}</span>
                {overdue && <Badge tone="red"><AlertTriangle size={11} /> متأخر</Badge>}
              </div>
              <div className="text-sm tabnum" style={{ color: C.mute }}>{money(due)} د.أ</div>
              <button onClick={() => cycleStatus(m.id)} className="text-right">
                <Badge tone={meta.tone}><StatusIcon size={12} /> {meta.label}</Badge>
              </button>
              <div className="text-xs tabnum" style={{ color: C.mute }}>{p.date || "—"}</div>
              <Select value={p.method || "cash"} onChange={(e) => setMethod(m.id, e.target.value)} className="text-xs py-1.5">
                {METHODS.map((meth) => (<option key={meth.key} value={meth.key}>{meth.label}</option>))}
              </Select>
              <div className="flex gap-1">
                <button onClick={() => sendWhatsapp(m)} className="p-2 rounded-lg" style={{ background: "#E7F6EC", color: "#1F8A47" }} title="إرسال واتساب">
                  <MessageCircle size={14} />
                </button>
                <button onClick={() => copyMessage(m)} className="p-2 rounded-lg hover:bg-black/5" title="نسخ الرسالة">
                  <Copy size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs mt-3" style={{ color: C.faint }}>اضغط على شارة الحالة للتبديل بين: غير مسدد ← مسدد ← جزئي.</p>
    </div>
  );
}

function TurnsTab({ assoc, updateAssoc, periods }) {
  const setTurn = (period, memberId) => {
    const others = (assoc.turns || []).filter((t) => t.period !== period);
    const turns = memberId ? [...others, { period, memberId }] : others;
    updateAssoc({ ...assoc, turns });
  };
  const usedMembers = new Set((assoc.turns || []).map((t) => t.memberId));
  return (
    <div>
      <h3 className="font-cairo font-bold text-base mb-1">تعيين أدوار الاستلام</h3>
      <p className="text-sm mb-4" style={{ color: C.mute }}>حدد المشترك الذي سيقبض دفعة كل {assoc.frequency === "weekly" ? "أسبوع" : "شهر"} أو دورة.</p>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}`, background: C.card }}>
        {periods.map((p, i) => {
          const turn = (assoc.turns || []).find((t) => t.period === p);
          return (
            <div key={p} className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap" style={{ borderBottom: i < periods.length - 1 ? `1px solid ${C.line}` : "none" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold stamp" style={{ color: C.emeraldDark }}>{i + 1}</div>
                <span className="text-sm font-medium">{periodLabel(p, assoc.frequency)}</span>
              </div>
              <Select
                value={turn?.memberId || ""}
                onChange={(e) => setTurn(p, e.target.value || null)}
                className="max-w-[220px]"
              >
                <option value="">— لم يُحدد —</option>
                {assoc.members.map((m) => (
                  <option key={m.id} value={m.id} disabled={usedMembers.has(m.id) && turn?.memberId !== m.id}>
                    {m.name}{usedMembers.has(m.id) && turn?.memberId !== m.id ? " (تم تعيينه سابقاً)" : ""}
                  </option>
                ))}
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportsTab({ assoc, periods }) {
  const buildCsv = () => {
    const rows = [["الدورة", "المشترك", "المستحق", "الحالة", "التاريخ", "الطريقة"]];
    periods.forEach((p) => {
      const mp = assoc.payments?.[p]?.members || {};
      assoc.members.forEach((m) => {
        const pay = mp[m.id] || {};
        rows.push([
          periodLabel(p, assoc.frequency),
          m.name,
          (m.shares * assoc.shareAmount).toFixed(2),
          statusMeta(pay.status || "unpaid").label,
          pay.date || "",
          METHODS.find((x) => x.key === (pay.method || "cash"))?.label || "",
        ]);
      });
    });
    return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  };

  const downloadCsv = () => {
    const csv = "\uFEFF" + buildCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${assoc.name}-كشف-حساب.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printStatement = () => window.print();

  return (
    <div>
      <h3 className="font-cairo font-bold text-base mb-1">التقارير والتصدير</h3>
      <p className="text-sm mb-5" style={{ color: C.mute }}>صدّر كشف حساب الجمعية بالكامل بصيغة CSV أو اطبعه كملف PDF.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 no-print">
        <button onClick={downloadCsv} className="rounded-2xl p-5 flex items-center gap-3 text-right" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: C.emeraldFaint, color: C.emeraldDark }}><FileDown size={20} /></div>
          <div>
            <div className="font-bold text-sm">تصدير CSV</div>
            <div className="text-xs" style={{ color: C.mute }}>ملف جدول بيانات كامل لكل الدورات</div>
          </div>
        </button>
        <button onClick={printStatement} className="rounded-2xl p-5 flex items-center gap-3 text-right" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: C.goldFaint, color: "#7A5A1E" }}><Printer size={20} /></div>
          <div>
            <div className="font-bold text-sm">طباعة / تصدير PDF</div>
            <div className="text-xs" style={{ color: C.mute }}>استخدم خيار «حفظ كملف PDF» من نافذة الطباعة</div>
          </div>
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}`, background: C.card }}>
        <div className="px-4 py-3 font-bold text-sm" style={{ borderBottom: `1px solid ${C.line}` }}>
          كشف حساب — {assoc.name}
        </div>
        {periods.map((p) => {
          const mp = assoc.payments?.[p]?.members || {};
          return (
            <div key={p} className="px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
              <div className="text-xs font-bold mb-2" style={{ color: C.emeraldDark }}>{periodLabel(p, assoc.frequency)}</div>
              <div className="space-y-1">
                {assoc.members.map((m) => {
                  const pay = mp[m.id] || {};
                  const meta = statusMeta(pay.status || "unpaid");
                  return (
                    <div key={m.id} className="flex justify-between text-xs">
                      <span>{m.name}</span>
                      <span className="tabnum" style={{ color: C.mute }}>{money(m.shares * assoc.shareAmount)} د.أ — {meta.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Root App                                                            */
/* ------------------------------------------------------------------ */
export default function JamyaApp() {
  const [associations, setAssociations] = useState(null); // null = loading
  const [page, setPage] = useState("dashboard");
  const [activeId, setActiveId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [jumpPayments, setJumpPayments] = useState(false);

  useEffect(() => {
    const loaded = loadAssociations();
    setAssociations(loaded && loaded.length ? loaded : seedData());
  }, []);

  useEffect(() => {
    if (associations) saveAssociations(associations);
  }, [associations]);

  const openAssociation = (id) => {
    if (id === "new") { setCreating(true); return; }
    setActiveId(id);
    setJumpPayments(false);
    setPage("detail");
  };
  const goPayments = (id) => {
    setActiveId(id);
    setJumpPayments(true);
    setPage("detail");
  };
  const updateAssoc = (updated) => {
    setAssociations((list) => list.map((a) => (a.id === updated.id ? updated : a)));
  };
  const deleteAssoc = (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الجمعية؟")) return;
    setAssociations((list) => list.filter((a) => a.id !== id));
    setPage("associations");
  };
  const createAssoc = (data) => {
    setAssociations((list) => [...list, { ...data, id: uid(), members: [], turns: [], payments: {} }]);
    setCreating(false);
  };

  if (!associations) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
        <div className="text-sm" style={{ color: C.mute }}>جارِ التحميل...</div>
      </div>
    );
  }

  const active = associations.find((a) => a.id === activeId);

  return (
    <div className="flex" dir="rtl">
      <Sidebar page={page} setPage={(p) => { setPage(p); setActiveId(null); }} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 min-w-0">
        <div className="md:hidden flex items-center justify-between px-4 py-3 no-print" style={{ borderBottom: `1px solid ${C.line}`, background: C.card }}>
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg" style={{ border: `1px solid ${C.line}` }}>
            <Menu size={18} />
          </button>
          <div className="font-cairo font-extrabold text-sm">دفتري</div>
          <div style={{ width: 34 }} />
        </div>

        {page === "dashboard" && (
          <Dashboard associations={associations} openAssociation={openAssociation} goPayments={goPayments} />
        )}
        {page === "associations" && (
          <AssociationsList
            associations={associations}
            openAssociation={openAssociation}
            onCreate={() => setCreating(true)}
            onDelete={deleteAssoc}
          />
        )}
        {page === "detail" && active && (
          <AssociationDetail
            assoc={active}
            updateAssoc={updateAssoc}
            deleteAssoc={deleteAssoc}
            back={() => setPage("associations")}
            jumpToPayments={jumpPayments}
          />
        )}
      </div>

      {creating && <AssociationForm onClose={() => setCreating(false)} onSave={createAssoc} />}
    </div>
  );
}
