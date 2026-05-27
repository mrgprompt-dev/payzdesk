'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getPusherClient } from '@/lib/pusherClient'
import { apiClient } from '@/lib/axios'
import { AxiosError } from 'axios'
import { Clock, Zap, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react'
import { formatINR } from '@/utils'

interface ILiveJob {
  _id: string
  amount: number
  bankId?: {
    bankName?: string
  } | null
  expiresAt: string
  status: string
}

interface ApiErrorResponse {
  message?: string
}

function CountdownTimer({ expiresAt, onExpire }: { expiresAt: string, onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    const calculateTime = () => {
      const diff = new Date(expiresAt).getTime() - new Date().getTime()
      if (diff <= 0) {
        setTimeLeft('Expired')
        onExpire()
        return
      }
      
      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
      
      if (diff < 60000) { // Less than 1 minute
        setIsUrgent(true)
      }
    }

    calculateTime()
    const interval = setInterval(calculateTime, 1000)
    return () => clearInterval(interval)
  }, [expiresAt, onExpire])

  return (
    <div className={`flex items-center gap-1.5 text-[13px] font-mono font-bold ${isUrgent ? 'text-danger animate-pulse' : 'text-amber'}`}>
      <Clock className="w-3.5 h-3.5" />
      {timeLeft}
    </div>
  )
}

export default function LivePoolPage() {
  const queryClient = useQueryClient()
  
  const [grabbingId, setGrabbingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const { data: jobs = [], isLoading, isError } = useQuery<ILiveJob[]>({
    queryKey: ['livePoolJobs'],
    queryFn: async () => {
      const res = await apiClient.get('/live-pool')
      return res.data.data ?? []
    },
    // Refetch less often because Pusher should handle real-time updates
    staleTime: 1000 * 60 * 5, 
  })

  useEffect(() => {
    const pusher = getPusherClient()
    if (!pusher) return

    const channel = pusher.subscribe('private-live-pool')

    channel.bind('job.available', (newJob: ILiveJob) => {
      queryClient.setQueryData<ILiveJob[]>(['livePoolJobs'], (old) => {
        // Prevent duplicates if API fetch and Pusher event race
        if (old?.some(j => j._id === newJob._id)) return old
        return [newJob, ...(old || [])]
      })
    })

    channel.bind('job.grabbed', (data: { jobId: string, grabbedBy: string }) => {
      // Remove it from available pool
      queryClient.setQueryData<ILiveJob[]>(['livePoolJobs'], (old) => {
        return (old || []).filter(j => j._id !== data.jobId)
      })
    })

    channel.bind('job.expired', (data: { jobId: string }) => {
      queryClient.setQueryData<ILiveJob[]>(['livePoolJobs'], (old) => {
        return (old || []).filter(j => j._id !== data.jobId)
      })
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe('private-live-pool')
    }
  }, [queryClient])

  const handleExpire = (jobId: string) => {
    queryClient.setQueryData<ILiveJob[]>(['livePoolJobs'], (old) => {
      return (old || []).filter(j => j._id !== jobId)
    })
  }

  const grabJob = async (jobId: string) => {
    if (grabbingId) return
    setGrabbingId(jobId)
    setErrorMsg('')
    setSuccessMsg('')
    
    try {
      const res = await apiClient.post('/live-pool/grab', { jobId })
      if (res.data.success) {
        setSuccessMsg('Job grabbed successfully!')
        // Remove locally immediately (Pusher will also handle it, but this is faster for the UI)
        queryClient.setQueryData<ILiveJob[]>(['livePoolJobs'], (old) => {
          return (old || []).filter(j => j._id !== jobId)
        })
        setTimeout(() => setSuccessMsg(''), 3000)
      } else {
        setErrorMsg(res.data.message || 'Failed to grab job.')
      }
    } catch (err: unknown) {
      const error = err as AxiosError<ApiErrorResponse>
      setErrorMsg(error.response?.data?.message || 'Error grabbing job.')
    } finally {
      setGrabbingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_200ms_ease-out]">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full border border-green animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-50" />
            <Zap className="w-5 h-5 text-green" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
              Live Pool
              <span className="px-2 py-0.5 rounded-full bg-green/20 text-green text-[10px] font-bold uppercase tracking-wider">Live</span>
            </h1>
            <p className="text-[13px] text-secondary mt-0.5">Grab incoming withdrawal requests</p>
          </div>
        </div>

      </div>

      {errorMsg && (
        <div className="error-banner animate-[slideDown_200ms_ease-out]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-[14px] text-[13px] font-medium text-green border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.08)] animate-[slideDown_200ms_ease-out]">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" />
          {successMsg}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="page-card h-[160px] relative overflow-hidden">
              <div className="skeleton absolute inset-0" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="page-card flex flex-col items-center justify-center py-10 text-center gap-3">
          <AlertCircle className="w-10 h-10 text-danger opacity-80" />
          <p className="text-sm font-medium text-primary">Failed to load live pool.</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="page-card flex flex-col items-center justify-center py-16 text-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)] pointer-events-none" />
          <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.02)] border border-border-subtle flex items-center justify-center relative z-10">
            <div className="w-12 h-12 rounded-full border-t border-r border-green animate-spin opacity-50" />
            <Zap className="w-6 h-6 text-muted absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="relative z-10">
            <p className="text-[16px] font-bold text-primary">Listening for requests...</p>
            <p className="text-[13px] text-secondary mt-1 max-w-[250px]">
              New withdrawal jobs will appear here instantly. Keep this page open.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map(job => (
            <div key={job._id} className="page-card relative overflow-hidden group flex flex-col gap-4 border border-[rgba(16,185,129,0.2)] hover:border-[rgba(16,185,129,0.5)] transition-colors animate-[fadeIn_300ms_ease-out]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              
              <div className="flex justify-between items-start z-10">
                <div>
                  <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Withdrawal Request</p>
                  <p className="text-[24px] font-bold text-primary mt-1 flex items-center">
                    {formatINR(job.amount)}
                  </p>
                </div>
                <div className="bg-[rgba(0,0,0,0.2)] px-2.5 py-1.5 rounded-md border border-[rgba(255,255,255,0.05)]">
                  <CountdownTimer expiresAt={job.expiresAt} onExpire={() => handleExpire(job._id)} />
                </div>
              </div>

              <div className="flex flex-col gap-1 z-10 p-3 bg-[rgba(0,0,0,0.15)] rounded-xl border border-[rgba(255,255,255,0.03)]">
                <p className="text-[12px] text-secondary">Target Bank</p>
                <p className="text-[14px] font-bold text-primary truncate">
                  {job.bankId?.bankName || 'Unknown Bank'}
                </p>
              </div>

              <button
                onClick={() => grabJob(job._id)}
                disabled={grabbingId !== null}
                className="mt-2 w-full py-3 rounded-[12px] text-[14px] font-bold text-[#1a1000] bg-green hover:bg-[#0ea5e9] transition-all active:scale-[0.98] z-10 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                style={grabbingId === job._id ? { opacity: 0.7 } : {}}
              >
                {grabbingId === job._id ? (
                  <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    GRAB NOW
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
