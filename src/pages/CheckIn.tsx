import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { CheckinInput } from '../types'
import vliscoLogo from '../assets/vlisco-logo.png'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Status = 'idle' | 'submitting' | 'success' | 'duplicate' | 'error'

const emptyForm: CheckinInput = { first_name: '', last_name: '', phone: '', email: '' }

export default function CheckIn() {
  const [form, setForm] = useState<CheckinInput>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof CheckinInput, string>>>({})
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  function update(field: keyof CheckinInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validate(): boolean {
    const next: Partial<Record<keyof CheckinInput, string>> = {}
    if (!form.first_name.trim()) next.first_name = 'Required'
    if (!form.last_name.trim()) next.last_name = 'Required'
    const digits = form.phone.replace(/\D/g, '')
    if (digits.length < 7) next.phone = 'Enter a valid phone number'
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setStatus('submitting')
    setErrorMessage('')

    const { error } = await supabase.from('checkins').insert({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
    })

    if (!error) {
      setStatus('success')
      return
    }

    if (error.code === '23505') {
      setStatus('duplicate')
    } else {
      setStatus('error')
      setErrorMessage(error.message)
    }
  }

  if (status === 'success' || status === 'duplicate') {
    return (
      <ConfirmationScreen
        name={form.first_name}
        alreadyCheckedIn={status === 'duplicate'}
        onReset={() => {
          setForm(emptyForm)
          setStatus('idle')
        }}
      />
    )
  }

  return (
    <div className="min-h-dvh bg-plum-950 bg-[radial-gradient(circle_at_top,var(--color-plum-800),var(--color-plum-950)_65%)] px-5 py-10 flex flex-col items-center">
      <header className="text-center mb-8 max-w-sm flex flex-col items-center">
        <div className="bg-white rounded-2xl px-6 py-4 mb-5 shadow-lg shadow-black/20">
          <img src={vliscoLogo} alt="Vlisco" className="h-14 w-auto" />
        </div>
        <p className="uppercase tracking-[0.35em] text-gold-400 text-xs font-semibold mb-2">
          You're Invited
        </p>
        <h1 className="font-display text-3xl leading-tight text-white">
          SIP &amp; SHOP
        </h1>
        <p className="text-white/60 text-sm mt-4">
          Welcome! Please check in below to let us know you've arrived.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-sm bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 shadow-xl shadow-black/30"
      >
        <div className="space-y-4">
          <Field
            label="First name"
            value={form.first_name}
            error={errors.first_name}
            onChange={(v) => update('first_name', v)}
            autoComplete="given-name"
          />
          <Field
            label="Last name"
            value={form.last_name}
            error={errors.last_name}
            onChange={(v) => update('last_name', v)}
            autoComplete="family-name"
          />
          <Field
            label="Phone number"
            type="tel"
            value={form.phone}
            error={errors.phone}
            onChange={(v) => update('phone', v)}
            autoComplete="tel"
            inputMode="tel"
          />
          <Field
            label="Email address"
            type="email"
            value={form.email}
            error={errors.email}
            onChange={(v) => update('email', v)}
            autoComplete="email"
            inputMode="email"
          />
        </div>

        {status === 'error' && (
          <p className="mt-4 text-sm text-red-300 bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2">
            {errorMessage || 'Something went wrong. Please try again.'}
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="mt-6 w-full rounded-xl bg-gold-500 text-plum-950 font-semibold py-3.5 text-base active:scale-[0.98] transition disabled:opacity-60 disabled:active:scale-100"
        >
          {status === 'submitting' ? 'Checking in…' : 'Check In'}
        </button>
      </form>

      <p className="text-white/30 text-xs mt-8 text-center">
        Trouble checking in? Ask an event host for help.
      </p>
    </div>
  )
}

function Field({
  label,
  value,
  error,
  onChange,
  type = 'text',
  autoComplete,
  inputMode,
}: {
  label: string
  value: string
  error?: string
  onChange: (v: string) => void
  type?: string
  autoComplete?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-white/70 mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={`w-full rounded-xl bg-white/10 border px-4 py-3 text-base text-white placeholder-white/30 outline-none transition focus:bg-white/15 ${
          error ? 'border-red-400/70' : 'border-white/15 focus:border-gold-400/70'
        }`}
      />
      {error && <span className="block text-xs text-red-300 mt-1">{error}</span>}
    </label>
  )
}

function ConfirmationScreen({
  name,
  alreadyCheckedIn,
  onReset,
}: {
  name: string
  alreadyCheckedIn: boolean
  onReset: () => void
}) {
  return (
    <div className="min-h-dvh bg-plum-950 bg-[radial-gradient(circle_at_top,var(--color-plum-800),var(--color-plum-950)_65%)] px-5 py-10 flex flex-col items-center justify-center text-center">
      <div className="bg-white rounded-2xl px-6 py-4 mb-6 shadow-lg shadow-black/20">
        <img src={vliscoLogo} alt="Vlisco" className="h-10 w-auto" />
      </div>
      <div className="w-16 h-16 rounded-full bg-gold-500/15 border border-gold-400/40 flex items-center justify-center mb-6">
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-gold-400">
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="font-display text-2xl text-white mb-2">
        {alreadyCheckedIn ? "You're already checked in" : `Welcome${name ? `, ${name}` : ''}!`}
      </h1>
      <p className="text-white/60 text-sm max-w-xs mb-8">
        {alreadyCheckedIn
          ? "We already have your check-in for VLISCO SIP & SHOP. Enjoy the event!"
          : "You're checked in for VLISCO SIP & SHOP. Enjoy the sip, the shop, and everything in between."}
      </p>
      <button
        onClick={onReset}
        className="rounded-xl border border-white/20 text-white/80 px-5 py-2.5 text-sm active:scale-[0.98] transition"
      >
        Check in another guest
      </button>
    </div>
  )
}
