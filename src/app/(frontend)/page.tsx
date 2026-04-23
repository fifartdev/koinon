import React from 'react'
import Link from 'next/link'

/* ─── SVG icons ─────────────────────────────────────────── */

function IconTenant() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  )
}

function IconMembers() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function IconPayment() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  )
}

function IconBell() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  )
}

function IconMegaphone() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
    </svg>
  )
}

function IconPWA() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
  )
}

function IconArrow() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

/* ─── Data ───────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: <IconTenant />,
    label: 'Πολυ-ενοικίαση',
    title: 'Ένας χώρος ανά σύλλογο',
    desc: 'Κάθε σύλλογος έχει το δικό του απομονωμένο περιβάλλον στο /{slug}. Μηδενική ανάμειξη δεδομένων.',
  },
  {
    icon: <IconMembers />,
    label: 'Μέλη',
    title: 'Μόνο κατόπιν πρόσκλησης',
    desc: 'Οι διαχειριστές προσκαλούν μέλη μέσω email. Χωρίς δημόσιες εγγραφές — μόνο οι δικοί σας άνθρωποι.',
  },
  {
    icon: <IconCalendar />,
    label: 'Χρονοδιάγραμμα',
    title: 'Εβδομαδιαία προγράμματα',
    desc: 'Ορίστε υπηρεσίες με εκπαιδευτή, ημέρα, ώρα και τοποθεσία. Τα μέλη βλέπουν το προσωπικό τους πρόγραμμα.',
  },
  {
    icon: <IconPayment />,
    label: 'Πληρωμές',
    title: 'Απλή παρακολούθηση πληρωμών',
    desc: 'Σημειώστε τέλη ως Εξοφλημένα ή Ανεξόφλητα με ένα κλικ. Αυτόματες υπενθυμίσεις email.',
  },
  {
    icon: <IconMegaphone />,
    label: 'Ανακοινώσεις',
    title: 'Ανακοινώσεις πλούσιου κειμένου',
    desc: 'Γράψτε, δημοσιεύστε και καρφιτσώστε αναρτήσεις. Κάθε δημοσίευση ειδοποιεί αυτόματα όλα τα μέλη.',
  },
  {
    icon: <IconPWA />,
    label: 'PWA',
    title: 'Εγκαταστάσιμη εφαρμογή',
    desc: 'Προτροπή "Προσθήκη στην Αρχική" μετά τη σύνδεση. Φαίνεται native σε iOS και Android.',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Δημιουργήστε τον σύλλογό σας',
    desc: 'Ένας superadmin δημιουργεί τον σύλλογό σας. Παίρνετε ζωντανό URL στο koinon.app/{your-club} σε δευτερόλεπτα.',
    detail: 'Slug επιλεγμένο. Έτοιμο.',
  },
  {
    n: '02',
    title: 'Προσκαλέστε τα μέλη σας',
    desc: 'Επικολλήστε ένα email, πατήστε αποστολή. Τα μέλη λαμβάνουν σύνδεσμο πρόσκλησης και ορίζουν τον κωδικό τους.',
    detail: 'Χωρίς λήψη εφαρμογής.',
  },
  {
    n: '03',
    title: 'Διαχειριστείτε τα πάντα',
    desc: 'Υπηρεσίες, προγράμματα, πληρωμές, ανακοινώσεις — όλα από έναν καθαρό πίνακα ελέγχου.',
    detail: 'Σχεδιασμένο για μη τεχνικούς διαχειριστές.',
  },
]

const CLUB_TYPES = [
  'Ακαδημία Ποδοσφαίρου',
  'Σχολή Πολεμικών Τεχνών',
  'Σχολή Χορού',
  'Ομάδα Κολύμβησης',
  'Ακαδημία Τένις',
  'CrossFit Box',
  'Σχολή Yoga',
  'Σύλλογος Σκακιού',
  'Ακαδημία Μπάσκετ',
  'Σύλλογος Γυμναστικής',
  'Σύλλογος Rugby',
  'Σχολή Τοξοβολίας',
]

/* ─── Dashboard Mockup ───────────────────────────────────── */

function DashboardMockup() {
  return (
    <div
      className="animate-float relative w-85 shrink-0"
      style={{ filter: 'drop-shadow(0 32px 64px rgba(99,102,241,0.25))' }}
    >
      {/* Window chrome */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(13, 13, 26, 0.92)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.05) inset',
        }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-amber-500/70" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
          </div>
          <div
            className="flex-1 mx-2 rounded-md text-center text-[11px]"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.35)',
              padding: '3px 0',
            }}
          >
            golden-eagles · Πίνακας Ελέγχου
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Μέλη', value: '47', color: '#818cf8' },
              { label: 'Υπηρεσίες', value: '6', color: '#34d399' },
              { label: 'Ανεξόφλητα', value: '3', color: '#f87171' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <p
                  className="text-lg font-bold"
                  style={{ fontFamily: 'var(--font-bricolage)', color: s.color }}
                >
                  {s.value}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Notification items */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Πρόσφατη Δραστηριότητα
            </p>
            {[
              { dot: '#818cf8', text: 'Ανακοινώθηκε Καλοκαιρινό Τρένινγκ', time: 'πριν 2λ' },
              { dot: '#f87171', text: 'Αχμεντ Κ. — εκκρεμεί πληρωμή', time: 'πριν 1ω' },
              { dot: '#34d399', text: 'Νέα υπηρεσία: Προστέθηκε Pilates', time: 'πριν 3ω' },
            ].map((n, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <span
                  className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                  style={{ background: n.dot }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    {n.text}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {n.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Member row */}
          <div
            className="rounded-xl px-3 py-3 flex items-center gap-3"
            style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.15)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: 'rgba(129,140,248,0.2)', color: '#818cf8' }}
            >
              MK
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Maria Konstantinou
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Εγγεγραμμένη · 2 υπηρεσίες
              </p>
            </div>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}
            >
              Εξοφλήθη
            </span>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div
        className="absolute -top-3 -right-4 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-[11px] font-semibold"
        style={{
          background: 'rgba(52,211,153,0.15)',
          border: '1px solid rgba(52,211,153,0.25)',
          color: '#34d399',
          boxShadow: '0 4px 16px rgba(52,211,153,0.15)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Ζωντανά · 12 online
      </div>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: '#07070f' }}>

      {/* ── NAV ── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4"
        style={{
          background: 'rgba(7,7,15,0.8)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{
              background: 'linear-gradient(135deg, #818cf8, #6366f1)',
              fontFamily: 'var(--font-bricolage)',
            }}
          >
            K
          </div>
          <span
            className="text-[17px] font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-bricolage)', color: 'rgba(255,255,255,0.92)' }}
          >
            Koinon
          </span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-7 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <a href="#features" className="hover:text-white transition-colors">Λειτουργίες</a>
          <a href="#how" className="hover:text-white transition-colors">Πώς λειτουργεί</a>
          <a href="#pricing" className="hover:text-white transition-colors">Τιμολόγηση</a>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <a
            href="#contact"
            className="hidden md:block text-sm transition-colors"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Σύνδεση
          </a>
          <a
            href="#contact"
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
            }}
          >
            Ζητήστε Πρόσβαση
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-6 md:px-10 pt-20 md:pt-28 pb-20">

        {/* Background orbs */}
        <div
          className="animate-orb pointer-events-none absolute -top-32 -left-32 w-150 h-150 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="pointer-events-none absolute top-10 right-0 w-125 h-125 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animationDelay: '3s',
          }}
        />

        {/* Dot grid */}
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" />

        <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-14 lg:gap-16">

          {/* Left: copy */}
          <div className="flex-1 max-w-2xl">
            {/* Pill badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium mb-7"
              style={{
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.25)',
                color: '#818cf8',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Τώρα σε πρόωρη πρόσβαση · 120+ σύλλογοι
            </div>

            {/* Headline */}
            <h1
              className="animate-fade-up-2 text-5xl md:text-6xl lg:text-[68px] font-bold leading-[1.06] tracking-tight mb-6"
              style={{ fontFamily: 'var(--font-bricolage)' }}
            >
              Σταματήστε να διαχειρίζεστε
              <br />
              <span className="text-gradient">συλλόγους με ομαδικές συνομιλίες.</span>
            </h1>

            {/* Subtext */}
            <p
              className="animate-fade-up-3 text-lg md:text-xl leading-relaxed mb-10 max-w-xl"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Το Koinon δίνει σε κάθε σύλλογο έναν ιδιωτικό χώρο — λίστες μελών, εβδομαδιαία προγράμματα, παρακολούθηση πληρωμών και άμεσες ανακοινώσεις. Φτιαγμένο για διαχειριστές που θέλουν να λειτουργεί.
            </p>

            {/* CTA row */}
            <div className="animate-fade-up-4 flex flex-wrap items-center gap-4">
              <a
                href="#contact"
                className="inline-flex items-center gap-2.5 font-semibold px-6 py-3.5 rounded-xl text-sm transition-all hover:scale-105 hover:shadow-indigo-500/30 hover:shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                  color: '#fff',
                  boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
                }}
              >
                Αποκτήστε πρόωρη πρόσβαση
                <IconArrow />
              </a>
              <a
                href="#how"
                className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                Δείτε πώς λειτουργεί
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </a>
            </div>

            {/* Trust signals */}
            <div className="animate-fade-up-4 mt-10 flex items-center gap-6 flex-wrap">
              {['Χωρίς πιστωτική κάρτα', 'Εγκατάσταση σε 5 λεπτά', 'Συμβατό με GDPR'].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <span className="text-emerald-400">
                    <IconCheck />
                  </span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right: floating mockup */}
          <div className="shrink-0 flex justify-center">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ── TICKER STRIP ── */}
      <div
        className="overflow-hidden py-5"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div className="animate-ticker flex gap-8 w-max">
          {[...CLUB_TYPES, ...CLUB_TYPES].map((type, i) => (
            <span key={i} className="flex items-center gap-2 text-sm whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: i % 3 === 0 ? '#818cf8' : i % 3 === 1 ? '#34d399' : '#fbbf24' }}
              />
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" className="relative px-6 md:px-10 py-28">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="max-w-2xl mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: '#818cf8' }}>
              Λειτουργίες
            </p>
            <h2
              className="text-4xl md:text-5xl font-bold tracking-tight mb-5"
              style={{ fontFamily: 'var(--font-bricolage)', color: '#f1f5f9' }}
            >
              Ό,τι χρειάζεται ο σύλλογός σας. Τίποτα παραπάνω.
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Σχεδιασμένο για τοπικούς συλλόγους. Χωρίς περιττές λειτουργίες. Χωρίς εταιρική τιμολόγηση. Μόνο τα έξι πράγματα που πραγματικά μετράνε.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="feature-card glass rounded-2xl p-6"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{
                    background: 'rgba(99,102,241,0.12)',
                    color: '#818cf8',
                    border: '1px solid rgba(99,102,241,0.2)',
                  }}
                >
                  {f.icon}
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#6366f1' }}>
                  {f.label}
                </p>
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ fontFamily: 'var(--font-bricolage)', color: '#e2e8f0' }}
                >
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="how"
        className="px-6 md:px-10 py-28"
        style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: '#818cf8' }}>
              Πώς λειτουργεί
            </p>
            <h2
              className="text-4xl md:text-5xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-bricolage)', color: '#f1f5f9' }}
            >
              Από το μηδέν σε λειτουργία σε ένα απόγευμα.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div
                    className="hidden md:block absolute top-8 left-[calc(100%+12px)] -right-3 h-px"
                    style={{ background: 'linear-gradient(to right, rgba(99,102,241,0.4), transparent)' }}
                  />
                )}

                <div
                  className="glass rounded-2xl p-7 h-full"
                  style={{ borderColor: i === 0 ? 'rgba(99,102,241,0.25)' : undefined }}
                >
                  {/* Number */}
                  <div
                    className="text-4xl font-black mb-5 leading-none"
                    style={{
                      fontFamily: 'var(--font-bricolage)',
                      WebkitTextStroke: '1px rgba(99,102,241,0.4)',
                      color: 'transparent',
                    }}
                  >
                    {s.n}
                  </div>
                  <h3
                    className="text-xl font-bold mb-3"
                    style={{ fontFamily: 'var(--font-bricolage)', color: '#e2e8f0' }}
                  >
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {s.desc}
                  </p>
                  <div
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}
                  >
                    <IconCheck />
                    {s.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ── */}
      <section id="pricing" className="px-6 md:px-10 py-28">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: '#818cf8' }}>
            Τιμολόγηση
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
            style={{ fontFamily: 'var(--font-bricolage)', color: '#f1f5f9' }}
          >
            Ένα πλάνο. Απεριόριστοι σύλλογοι.
          </h2>
          <p className="text-lg mb-12" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Βρισκόμαστε σε πρόωρη πρόσβαση — η τιμολόγηση οριστικοποιείται. Εγγραφείτε τώρα και κλειδώστε την τιμή σας.
          </p>

          {/* Pricing card */}
          <div
            className="glass rounded-3xl p-8 md:p-12 text-left relative overflow-hidden"
            style={{ border: '1px solid rgba(99,102,241,0.25)', boxShadow: '0 0 80px rgba(99,102,241,0.1)' }}
          >
            {/* Glow */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at top left, rgba(99,102,241,0.08), transparent 60%)' }}
            />

            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-6"
                  style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}
                >
                  ⚡ Πρόωρη Πρόσβαση
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span
                    className="text-6xl font-black leading-none"
                    style={{ fontFamily: 'var(--font-bricolage)', color: '#f1f5f9' }}
                  >
                    Δωρεάν
                  </span>
                  <span className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    κατά τη διάρκεια της beta
                  </span>
                </div>
                <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Πλήρης πρόσβαση. Χωρίς πιστωτική κάρτα. Κλειδώστε την τιμή σας πριν την κυκλοφορία.
                </p>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2.5 font-semibold px-6 py-3.5 rounded-xl text-sm transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                    color: '#fff',
                    boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
                  }}
                >
                  Ζητήστε Πρόσβαση
                  <IconArrow />
                </a>
              </div>

              <div className="space-y-3">
                {[
                  'Απεριόριστοι σύλλογοι',
                  'Απεριόριστα μέλη ανά σύλλογο',
                  'Πλήρες σύστημα ειδοποιήσεων',
                  'Ενσωμάτωση email Resend',
                  'Εγκαταστάσιμη εφαρμογή PWA',
                  'Neon Postgres στην παραγωγή',
                  'Προσαρμοσμένο URL /[slug]',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}
                    >
                      <IconCheck />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section
        id="contact"
        className="px-6 md:px-10 py-28 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(7,7,15,0) 100%)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* bg orb */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div
            className="w-175 h-100 rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <h2
            className="text-5xl md:text-6xl font-bold tracking-tight mb-6"
            style={{ fontFamily: 'var(--font-bricolage)', color: '#f1f5f9' }}
          >
            Έτοιμοι να δώσετε στον σύλλογό σας<br />
            <span className="text-gradient">έναν επίσημο χώρο;</span>
          </h2>
          <p className="text-lg mb-10" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Εγγραφείτε στην πρόωρη πρόσβαση και αποκτήστε τα πάντα δωρεάν κατά τη διάρκεια της beta.
            Ο σύλλογός σας αξίζει κάτι καλύτερο από ένα WhatsApp group.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:hello@koinon.app"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105 hover:shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                color: '#fff',
                boxShadow: '0 8px 40px rgba(99,102,241,0.45)',
              }}
            >
              Ζητήστε πρόωρη πρόσβαση
              <IconArrow />
            </a>
            <a
              href="mailto:hello@koinon.app"
              className="w-full sm:w-auto inline-flex items-center justify-center font-medium px-8 py-4 rounded-xl text-sm transition-colors"
              style={{
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              Μιλήστε μαζί μας πρώτα
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="px-6 md:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-6"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)', fontFamily: 'var(--font-bricolage)' }}
          >
            K
          </div>
          <span
            className="font-semibold text-sm"
            style={{ fontFamily: 'var(--font-bricolage)', color: 'rgba(255,255,255,0.7)' }}
          >
            Koinon
          </span>
          <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Η πλατφόρμα διαχείρισης συλλόγων
          </span>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-6 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <a href="#features" className="hover:text-white transition-colors">Λειτουργίες</a>
          <a href="#how" className="hover:text-white transition-colors">Πώς λειτουργεί</a>
          <a href="#pricing" className="hover:text-white transition-colors">Τιμολόγηση</a>
          <a href="mailto:hello@koinon.app" className="hover:text-white transition-colors">Επικοινωνία</a>
        </nav>

        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          © {new Date().getFullYear()} Koinon. Όλα τα δικαιώματα διατηρούνται.
        </p>
      </footer>

    </div>
  )
}
