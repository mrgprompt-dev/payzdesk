'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
    const router = useRouter()

    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [showPwd, setShowPwd] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (!phone || !password) {
            setError('Phone and password are required')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/admin/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password }),
            })
            const json = await res.json()

            if (!res.ok || !json.success) {
                setError(json.message ?? 'Login failed')
                return
            }

            router.replace('/admin')
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-page flex items-center justify-center p-5">
            <div className="w-full max-w-[380px]">

                {/* Header */}
                <div className="mb-[28px]">
                    <p className="text-[22px] font-bold text-primary">
                        Payz<span className="text-gold">Desk</span>
                    </p>
                    <p className="text-[13px] text-muted mt-1">
                        Admin sign in
                    </p>
                </div>

                {/* Card */}
                <div className="bg-card-solid border border-border rounded-[12px] py-[28px] px-6">
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-4"
                        noValidate
                    >

                        {/* Phone */}
                        <div>
                            <label
                                htmlFor="phone"
                                className="block text-xs font-semibold tracking-[0.06em] uppercase text-muted mb-[6px]"
                            >
                                Phone Number
                            </label>
                            <div className="relative">
                                <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-sm text-secondary font-medium select-none">
                                    +91
                                </span>
                                <input
                                    id="phone"
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={10}
                                    placeholder="9876543210"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    className="form-input pl-[46px]"
                                    autoComplete="tel"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-xs font-semibold tracking-[0.06em] uppercase text-muted mb-[6px]"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPwd ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="form-input pr-[46px]"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd((v) => !v)}
                                    className="absolute right-[14px] top-1/2 -translate-y-1/2 text-muted leading-none bg-transparent border-none cursor-pointer"
                                    tabIndex={-1}
                                >
                                    {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="py-[10px] px-[14px] bg-danger-dim border border-[rgba(239,68,68,0.3)] rounded-[8px] text-[13px] text-danger-light">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary mt-1"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Signing in…
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}