import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Checkin } from '../types'
import vliscoLogo from '../assets/vlisco-logo.png'

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCheckingSession(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (checkingSession) {
    return <CenteredMessage text="Loading…" />
  }

  return session ? <Dashboard /> : <Login />
}

function CenteredMessage({ text }: { text: string }) {
  return (
    <div className="min-h-dvh bg-plum-950 flex items-center justify-center text-white/50 text-sm">
      {text}
    </div>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-dvh bg-plum-950 flex items-center justify-center px-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-6"
      >
        <div className="bg-white rounded-2xl px-5 py-3 mb-5 inline-block">
          <img src={vliscoLogo} alt="Vlisco" className="h-8 w-auto" />
        </div>
        <h1 className="font-display text-2xl text-white mb-1">Admin Login</h1>
        <p className="text-white/50 text-sm mb-6">VLISCO SIP & SHOP guest list</p>

        <label className="block mb-4">
          <span className="block text-xs font-medium text-white/70 mb-1.5">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-white outline-none focus:border-gold-400/70"
          />
        </label>

        <label className="block mb-4">
          <span className="block text-xs font-medium text-white/70 mb-1.5">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-white outline-none focus:border-gold-400/70"
          />
        </label>

        {error && (
          <p className="text-sm text-red-300 bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gold-500 text-plum-950 font-semibold py-3 disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

function Dashboard() {
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [checkinUrl, setCheckinUrl] = useState('')

  useEffect(() => {
    setCheckinUrl(window.location.origin + '/')
    load()

    const channel = supabase
      .channel('checkins-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'checkins' },
        () => load(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setCheckins(data ?? [])
      setError('')
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this check-in?')) return
    const { error } = await supabase.from('checkins').delete().eq('id', id)
    if (error) {
      alert(error.message)
    } else {
      setCheckins((prev) => prev.filter((c) => c.id !== id))
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return checkins
    return checkins.filter((c) =>
      [c.first_name, c.last_name, c.email, c.phone].some((v) => v.toLowerCase().includes(q)),
    )
  }, [checkins, search])

  function downloadCsv() {
    const header = ['First Name', 'Last Name', 'Phone', 'Email', 'Checked In At']
    const rows = filtered.map((c) => [
      c.first_name,
      c.last_name,
      c.phone,
      c.email,
      new Date(c.created_at).toLocaleString(),
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `vlisco-sip-shop-checkins-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-dvh bg-plum-950 px-4 py-6 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-start justify-between gap-3 mb-6">
          <div>
            <p className="uppercase tracking-[0.3em] text-gold-400 text-[11px] font-semibold mb-1">
              VLISCO SIP &amp; SHOP
            </p>
            <h1 className="font-display text-2xl text-white">Guest Check-Ins</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-white/50 border border-white/15 rounded-lg px-3 py-2 shrink-0"
          >
            Sign out
          </button>
        </header>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Total Checked In" value={checkins.length} />
          <StatCard
            label="Last 30 Min"
            value={
              checkins.filter(
                (c) => Date.now() - new Date(c.created_at).getTime() < 30 * 60 * 1000,
              ).length
            }
          />
        </div>

        {checkinUrl && <QrCard url={checkinUrl} />}

        <div className="flex flex-col sm:flex-row gap-3 mb-4 mt-6">
          <input
            type="text"
            placeholder="Search by name, phone, or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-xl bg-white/10 border border-white/15 px-4 py-2.5 text-white text-sm outline-none focus:border-gold-400/70"
          />
          <button
            onClick={downloadCsv}
            disabled={filtered.length === 0}
            className="rounded-xl bg-gold-500 text-plum-950 font-semibold px-4 py-2.5 text-sm disabled:opacity-40"
          >
            Export CSV
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-300 bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-white/40 text-sm text-center py-10">Loading guests…</p>
        ) : filtered.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-10">No check-ins yet.</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((c) => (
              <li
                key={c.id}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">
                    {c.first_name} {c.last_name}
                  </p>
                  <p className="text-white/50 text-xs truncate">
                    {c.phone} · {c.email}
                  </p>
                  <p className="text-white/30 text-[11px] mt-0.5">
                    {new Date(c.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-red-300/70 text-xs shrink-0 px-2 py-1"
                  aria-label={`Remove ${c.first_name} ${c.last_name}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
      <p className="text-2xl font-display text-gold-400">{value}</p>
      <p className="text-white/50 text-xs mt-0.5">{label}</p>
    </div>
  )
}

function QrCard({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&color=1a0a1f&bgcolor=ffffff&data=${encodeURIComponent(url)}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable; ignore
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
      <img
        src={qrSrc}
        alt="QR code linking to the check-in page"
        className="w-24 h-24 rounded-lg bg-white p-1 shrink-0"
      />
      <div className="min-w-0">
        <p className="text-white text-sm font-medium mb-1">Check-in link</p>
        <p className="text-white/50 text-xs truncate mb-2">{url}</p>
        <button
          onClick={copy}
          className="text-xs text-gold-400 border border-gold-400/30 rounded-lg px-3 py-1.5"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}
