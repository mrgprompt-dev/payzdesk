'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, MessageSquare, Clock, Send } from 'lucide-react'
import { formatDateTime } from '@/utils'
import { apiClient } from '@/lib/axios'

interface ITicket {
  _id: string
  subject: string
  message: string
  status: 'open' | 'closed'
  createdAt: string
}

export default function SupportPage() {
  const queryClient = useQueryClient()
  const { data: tickets = [], isLoading: loadingTickets, isError: ticketsError } = useQuery<ITicket[]>({
    queryKey: ['supportTickets'],
    queryFn: async () => {
      const res = await apiClient.get('/api/support')
      return res.data.data ?? []
    },
  })

  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')



  const canSubmit = subject.trim() !== '' && message.trim() !== '' && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      const res = await apiClient.post('/api/support', {
        subject: subject.trim(),
        message: message.trim(),
      })
      
      if (res.data.success) {
        setSuccess(true)
        setSubject('')
        setMessage('')
        queryClient.setQueryData<ITicket[]>(['supportTickets'], (old) => [res.data.data, ...(old || [])])
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit ticket. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 animate-[fadeIn_200ms_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-[10px] bg-(--accent-blue-dim) border border-border-subtle shrink-0">
          <MessageSquare className="w-4.5 h-4.5 text-blue" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary">Customer Support</h1>
          <p className="text-[13px] text-secondary">Submit a ticket for assistance</p>
        </div>
      </div>

      {/* Ticket Form */}
      <form onSubmit={handleSubmit} className="page-card flex flex-col gap-4">
        <p className="section-label mb-0">CREATE NEW TICKET</p>
        
        {success && (
          <div className="flex items-start gap-2 p-3.5 rounded-[14px] text-[13px] font-medium text-green border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.08)]">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" />
            Your ticket has been submitted successfully. Our team will review it shortly.
          </div>
        )}

        {error && (
          <div className="error-banner text-[13px]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="subject" className="text-[12px] font-medium text-muted uppercase tracking-wider">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            placeholder="Briefly describe your issue"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="form-input"
            maxLength={100}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="text-[12px] font-medium text-muted uppercase tracking-wider">
            Message
          </label>
          <textarea
            id="message"
            placeholder="Provide details about your issue..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="form-input min-h-[120px] resize-y py-3 leading-relaxed"
            maxLength={1000}
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary flex items-center justify-center gap-2 mt-2"
          style={{ opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
        >
          {submitting ? 'Submitting...' : 'Submit Ticket'}
          {!submitting && <Send className="w-4 h-4" />}
        </button>
      </form>

      {/* Past Tickets */}
      <div className="flex flex-col gap-3 mt-2">
        <p className="section-label">YOUR PAST TICKETS</p>

        {loadingTickets ? (
          <div className="flex flex-col gap-2">
            <div className="skeleton h-[80px] rounded-[16px]" />
            <div className="skeleton h-[80px] rounded-[16px]" />
          </div>
        ) : ticketsError ? (
          <div className="error-banner">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Failed to load past tickets.
          </div>
        ) : tickets.length === 0 ? (
          <div className="page-card text-center py-8">
            <p className="text-sm text-secondary">You haven't submitted any support tickets yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="page-card flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-[15px] font-bold text-primary">{ticket.subject}</p>
                    <div className="flex items-center gap-1.5 text-[12px] text-muted font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(ticket.createdAt)}
                    </div>
                  </div>
                  <div className={`status-badge ${ticket.status === 'open' ? 'status-pending' : 'status-completed'}`}>
                    {ticket.status.toUpperCase()}
                  </div>
                </div>
                <div className="text-[13px] text-secondary leading-relaxed p-3 bg-bg-secondary rounded-[10px] border border-border-subtle">
                  {ticket.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
