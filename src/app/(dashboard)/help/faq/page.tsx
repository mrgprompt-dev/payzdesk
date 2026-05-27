'use client'

import { HelpCircle, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils'

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="border-b border-border-subtle last:border-0">
            <button
                type="button"
                className="w-full py-4 flex items-center justify-between text-left touch-manipulation"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-[15px] font-medium text-primary pr-4">{question}</span>
                <ChevronDown
                    className={cn(
                        "w-5 h-5 text-secondary shrink-0 transition-transform duration-200",
                        isOpen && "rotate-180 text-primary"
                    )}
                />
            </button>
            <div
                className={cn(
                    "grid transition-all duration-200 ease-in-out",
                    isOpen ? "grid-rows-[1fr] pb-4 opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
            >
                <div className="overflow-hidden text-[14px] text-secondary leading-relaxed">
                    {answer}
                </div>
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FaqPage() {
    return (
        <div className="flex flex-col gap-4 animate-[fadeIn_200ms_ease-out]">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-[10px] bg-(--accent-blue-dim) border border-border-subtle shrink-0">
                    <HelpCircle className="w-4.5 h-4.5 text-blue" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-primary">Frequently Asked Questions</h1>
                    <p className="text-[13px] text-secondary">Find answers to common questions</p>
                </div>
            </div>

            {/* General FAQs */}
            <div className="page-card p-0! overflow-hidden">
                <div className="px-4 py-3.5 border-b border-border-subtle bg-bg-secondary">
                    <p className="section-label mb-0">GENERAL</p>
                </div>
                <div className="px-4">
                    <FaqItem
                        question="What is PayzDesk?"
                        answer="PayzDesk is a platform that allows agents to manage payments, deposits, and withdrawals securely and efficiently. Earn commissions on every successful transaction."
                    />
                    <FaqItem
                        question="How do I get started?"
                        answer="Simply register an account, complete your profile, and start processing deposits and withdrawals to earn commissions."
                    />
                    <FaqItem
                        question="Is my data secure?"
                        answer="Yes, PayzDesk uses industry-standard encryption to protect your personal and financial information. We ensure complete privacy and data security."
                    />
                </div>
            </div>

            {/* Transactions FAQs */}
            <div className="page-card p-0! overflow-hidden">
                <div className="px-4 py-3.5 border-b border-border-subtle bg-bg-secondary">
                    <p className="section-label mb-0">TRANSACTIONS & COMMISSIONS</p>
                </div>
                <div className="px-4">
                    <FaqItem
                        question="How do I process a deposit?"
                        answer="Go to the Deposits page, enter the client's details, select the bank, and submit the UTR. Once verified, the deposit is marked as completed."
                    />
                    <FaqItem
                        question="When do I get my commission?"
                        answer="Commissions are instantly credited to your referral or performance commission balance depending on the program criteria once a transaction is successfully completed."
                    />
                    <FaqItem
                        question="What is the Live Pool?"
                        answer="The Live Pool allows verified agents to grab withdrawal requests in real-time. Make sure your withdrawal status is enabled in settings to access the pool."
                    />
                </div>
            </div>
        </div>
    )
}
