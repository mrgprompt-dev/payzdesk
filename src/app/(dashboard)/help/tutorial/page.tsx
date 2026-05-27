'use client'

import { BookOpen, PlayCircle, FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'

// ─── Tutorial Card ────────────────────────────────────────────────────────────

function TutorialCard({
    icon: Icon,
    iconColor,
    iconBg,
    title,
    description,
    duration,
    link,
}: {
    icon: React.ElementType
    iconColor: string
    iconBg: string
    title: string
    description: string
    duration: string
    link: string
}) {
    return (
        <Link href={link} className="block group">
            <div className="page-card flex gap-4 transition-colors hover:bg-bg-secondary touch-manipulation active:scale-[0.99] duration-200">
                <div
                    className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0"
                    style={{ background: iconBg }}
                >
                    <Icon className="w-6 h-6" style={{ color: iconColor }} />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                    <div className="flex justify-between items-start gap-2">
                        <p className="text-[15px] font-bold text-primary group-hover:text-blue transition-colors">
                            {title}
                        </p>
                        <span className="text-[12px] font-medium text-secondary bg-bg-primary px-2 py-0.5 rounded border border-border-subtle shrink-0">
                            {duration}
                        </span>
                    </div>
                    <p className="text-[13px] text-secondary leading-relaxed line-clamp-2">
                        {description}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[13px] font-medium text-blue opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                        Read Guide <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                </div>
            </div>
        </Link>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TutorialPage() {
    return (
        <div className="flex flex-col gap-4 animate-[fadeIn_200ms_ease-out]">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-[10px] bg-(--accent-green-dim) border border-border-subtle shrink-0">
                    <BookOpen className="w-4.5 h-4.5 text-green" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-primary">Tutorials & Guides</h1>
                    <p className="text-[13px] text-secondary">Learn how to use PayzDesk</p>
                </div>
            </div>

            {/* Video Intro (Placeholder) */}
            <div className="page-card p-0! overflow-hidden relative group cursor-pointer border border-border-subtle">
                <div className="aspect-video bg-bg-secondary flex flex-col items-center justify-center relative">
                    <div className="absolute inset-0 bg-linear-to-t from-[rgba(0,0,0,0.6)] to-transparent" />
                    <PlayCircle className="w-12 h-12 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all relative z-10 drop-shadow-lg" />
                    <p className="text-white font-medium mt-3 relative z-10 drop-shadow-md">Watch Full Platform Overview</p>
                </div>
            </div>

            {/* Guides Section */}
            <div className="flex flex-col gap-3">
                <p className="section-label">STEP-BY-STEP GUIDES</p>
                
                <TutorialCard
                    icon={FileText}
                    iconColor="var(--accent-blue)"
                    iconBg="var(--accent-blue-dim)"
                    title="How to Process a Deposit"
                    description="Learn the complete flow of taking a deposit request, selecting a bank, and submitting the UTR number."
                    duration="3 min read"
                    link="#"
                />

                <TutorialCard
                    icon={FileText}
                    iconColor="var(--accent-amber)"
                    iconBg="var(--accent-amber-dim)"
                    title="Withdrawing Funds Securely"
                    description="Understand the withdrawal process, timelines, and how to verify customer banking details before transfer."
                    duration="4 min read"
                    link="#"
                />

                <TutorialCard
                    icon={FileText}
                    iconColor="var(--accent-green)"
                    iconBg="var(--accent-green-dim)"
                    title="Using the Live Pool"
                    description="A guide to grabbing real-time withdrawal jobs from the live pool to maximize your daily earnings."
                    duration="5 min read"
                    link="#"
                />
            </div>
        </div>
    )
}
