'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Zap, Coins, ArrowRight } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="auth-page" style={{ 
      justifyContent: 'center', 
      overflow: 'hidden',
      background: 'linear-gradient(135deg, var(--bg-gradient-start), var(--bg-gradient-end))'
    }}>
      {/* Decorative background elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '50vw',
        height: '50vw',
        background: 'var(--accent-gold-dim)',
        filter: 'blur(100px)',
        borderRadius: '50%',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-10%',
        width: '60vw',
        height: '60vw',
        background: 'var(--accent-green-dim)',
        filter: 'blur(120px)',
        borderRadius: '50%',
        zIndex: 0
      }} />

      <div style={{ 
        width: '100%', 
        maxWidth: 440, 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        margin: '0 auto',
        zIndex: 1,
        padding: '24px'
      }}>

        {/* Content Container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          {/* Logo */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '6vh',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
          }}>
            <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: 0, color: '#fff', textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              Payz<span style={{ color: 'var(--accent-gold)' }}>Desk</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 8, fontWeight: 500 }}>
              The Premium Agent Platform
            </p>
          </div>

          {/* Features List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: '2vh' }}>
            
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
              transition: 'all 0.6s ease-out 0.2s'
            }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: 'var(--radius-full)', 
                background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
              }}>
                <Zap size={28} color="var(--accent-gold)" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Lightning Fast</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Instant deposits & withdrawals.</p>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
              transition: 'all 0.6s ease-out 0.4s'
            }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: 'var(--radius-full)', 
                background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
              }}>
                <ShieldCheck size={28} color="var(--accent-green)" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Bank-Grade Security</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Your transactions are fully protected.</p>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
              transition: 'all 0.6s ease-out 0.6s'
            }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: 'var(--radius-full)', 
                background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
              }}>
                <Coins size={28} color="var(--accent-blue)" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Earn Commissions</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Maximize revenue with every job.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Action Button */}
        <div style={{ 
          marginTop: 'auto', 
          marginBottom: '4vh',
          opacity: mounted ? 1 : 0, 
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease-out 0.8s' 
        }}>
          <button 
            onClick={() => router.push('/login')}
            className="btn-primary" 
            style={{ 
              padding: '18px 20px', 
              fontSize: 18, 
              boxShadow: '0 8px 32px var(--accent-green-dim)' 
            }}
          >
            Get Started
            <ArrowRight size={20} />
          </button>
          
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)', marginTop: 24 }}>
            New agent?{' '}
            <button onClick={() => router.push('/register')} style={{ color: 'var(--text-link)', fontWeight: 600 }}>
              Create an account
            </button>
          </p>
        </div>

      </div>
    </div>
  )
}
