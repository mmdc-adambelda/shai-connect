'use client'

import { useState } from 'react'
import {
  BarChart3, TrendingUp, DollarSign, Wallet,
  Users, ArrowUpRight, ArrowDownRight, Download,
  FileText, Calendar, CheckCircle2, Maximize2, Minimize2, ExternalLink,
} from 'lucide-react'

/* ─── Financial summary data ─────────────────────────── */
const SUMMARY = [
  {
    label: 'Total Assets',
    value: 'PHP 3,854,960',
    icon: Wallet,
    positive: true,
    note: 'As of Dec 31, 2025',
  },
  {
    label: 'Cash Balance',
    value: 'PHP 3,805,172',
    icon: DollarSign,
    positive: true,
    note: 'Cash in bank + on hand',
  },
  {
    label: "Members' Equity",
    value: 'PHP 2,236,160',
    icon: Users,
    positive: true,
    note: 'Fund balance',
  },
  {
    label: 'Annual Revenue',
    value: 'PHP 11,374,945',
    icon: TrendingUp,
    positive: true,
    note: 'FY 2025',
  },
  {
    label: 'Annual Expenses',
    value: 'PHP 9,726,013',
    icon: ArrowDownRight,
    positive: false,
    note: 'FY 2025',
  },
  {
    label: 'Excess Revenue',
    value: 'PHP 1,648,932',
    icon: ArrowUpRight,
    positive: true,
    note: 'Revenue over expenses',
  },
]

const EXPENSE_BREAKDOWN = [
  { label: 'Security Services', amount: 'PHP 4,844,649', pct: 50 },
  { label: 'Repairs & Maintenance', amount: 'PHP 1,837,774', pct: 19 },
  { label: 'Salaries & Wages', amount: 'PHP 1,574,608', pct: 16 },
  { label: 'Utilities', amount: 'PHP 829,128', pct: 9 },
  { label: 'Administrative', amount: 'PHP 639,854', pct: 7 },
]

/* ─── Main page ──────────────────────────────────────── */
export default function FinancialReportsPage() {
  const [expanded, setExpanded] = useState(false)

  // The PDF is served from Supabase storage or a public URL.
  // For now we reference the uploaded file path as a placeholder.
  const PDF_URL = '/SHAI-2025-Audited-FS.pdf'

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--brand)' }}
        >
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
            Financial Reports
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Audited financial statements and annual reports
          </p>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div>
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <TrendingUp className="w-4 h-4" style={{ color: 'var(--brand)' }} />
          2025 Financial Highlights
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SUMMARY.map(({ label, value, icon: Icon, positive, note }) => (
            <div
              key={label}
              className="card p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: positive ? 'var(--brand-xlight)' : '#fff1f2' }}
                >
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color: positive ? 'var(--brand)' : '#ef4444' }}
                  />
                </div>
              </div>
              <p className="text-base font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                {value}
              </p>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {label}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Expense breakdown ── */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          Expense Breakdown — FY 2025
        </h2>
        <div className="space-y-3">
          {EXPENSE_BREAKDOWN.map(({ label, amount, pct }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{amount}</span>
              </div>
              <div className="w-full rounded-full h-1.5" style={{ background: 'var(--surface-3)' }}>
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${pct}%`, background: 'var(--brand)' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Report card ── */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--brand-xlight)' }}
            >
              <FileText className="w-6 h-6" style={{ color: 'var(--brand)' }} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: 'var(--brand)' }}
                >
                  Published
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--brand-xlight)', color: 'var(--brand)' }}
                >
                  Annual Financial Report
                </span>
              </div>
              <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                2025 Audited Financial Statements
              </h3>
              <div
                className="flex flex-wrap gap-3 mt-1.5 text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Year: 2025
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Audited by Mark Kenneth L. Marquez, CPA, CIA
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={PDF_URL}
              download="SHAI-2025-Audited-FS.pdf"
              className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-2"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
            <a
              href={PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open
            </a>
            <button
              className="btn-icon w-8 h-8"
              onClick={() => setExpanded(e => !e)}
              title={expanded ? 'Collapse viewer' : 'Expand viewer'}
            >
              {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── PDF Viewer ── */}
      <div
        className="card overflow-hidden"
        style={{
          height: expanded ? 'calc(100vh - 140px)' : '620px',
          transition: 'height 0.3s ease',
        }}
      >
        {/* Toolbar */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ borderBottom: '1px solid var(--border-soft)', background: 'var(--surface)' }}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              SHAI 2025 Audited Financial Statements
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={PDF_URL}
              download="SHAI-2025-Audited-FS.pdf"
              className="btn-icon w-7 h-7"
              title="Download"
            >
              <Download className="w-3 h-3" />
            </a>
            <button
              className="btn-icon w-7 h-7"
              onClick={() => setExpanded(e => !e)}
              title={expanded ? 'Collapse' : 'Fullscreen'}
            >
              {expanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Embed */}
        <iframe
          src={`${PDF_URL}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
          className="w-full"
          style={{
            height: expanded ? 'calc(100vh - 195px)' : '575px',
            border: 'none',
          }}
          title="SHAI 2025 Audited Financial Statements"
        />
      </div>

      {/* Footer */}
      <p className="text-center text-xs pb-2" style={{ color: 'var(--text-muted)' }}>
        Source: SHAI 2025 Audited Financial Statements &nbsp;·&nbsp; Sabella Homeowners' Association Inc.
        &nbsp;·&nbsp; Audited April 15, 2026
      </p>

    </div>
  )
}
