'use client'

import {
  Rss, Users, CheckCircle2, Shield, Zap, Droplets, Camera,
  Wrench, Leaf, TrendingUp, Building2, Vote, MessageCircle,
  Heart, Calendar, Star, ChevronRight,
} from 'lucide-react'

/* ── Shared sub-components ───────────────────────────── */

function SectionCard({
  icon: Icon,
  title,
  children,
  accent = false,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: accent ? 'var(--brand)' : 'var(--brand-xlight)' }}
        >
          <Icon className="w-4 h-4" style={{ color: accent ? '#fff' : 'var(--brand)' }} />
        </div>
        <h3 className="font-bold text-base font-display" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
      </div>
      <div className="text-sm leading-relaxed space-y-2" style={{ color: 'var(--text-secondary)' }}>
        {children}
      </div>
    </div>
  )
}

function StatCard({
  value,
  label,
  sub,
}: {
  value: string
  label: string
  sub?: string
}) {
  return (
    <div
      className="card flex flex-col items-center justify-center p-5 text-center"
      style={{ minHeight: '110px' }}
    >
      <p className="text-2xl font-bold font-display" style={{ color: 'var(--brand)' }}>
        {value}
      </p>
      <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
        {label}
      </p>
      {sub && (
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--brand)' }} />
      <span>{children}</span>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────── */

export default function CommunityUpdatesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--brand)' }}
        >
          <Rss className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
          Community Updates
        </h1>
      </div>

      {/* ── Hero Banner ── */}
      <div
        className="card overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)' }}
      >
        <div className="px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
            >
              OFFICIAL NEWSLETTER
            </span>
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
            >
              MAY 2026
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white leading-tight mb-2">
            General Assembly<br />May 2026 Highlights
          </h2>
          <p className="text-sm sm:text-base" style={{ color: 'rgba(255,255,255,0.82)' }}>
            Sabella Homeowners' Association Inc. — Official Community Newsletter
          </p>
          <div className="flex flex-wrap gap-3 mt-5 text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>May 2026 General Assembly</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" />
              <span>S.H.A.I. Official Publication</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Attendance Summary ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4" style={{ color: 'var(--brand)' }} />
          <h2 className="text-base font-bold font-display" style={{ color: 'var(--text-primary)' }}>
            Attendance Summary
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value="1,171" label="Active Members" />
          <StatCard value="195" label="Onsite Attendance" sub="In-person" />
          <StatCard value="184" label="Online Attendance" sub="Virtual" />
          <StatCard value="379" label="Total Attendance" sub="Combined" />
        </div>
      </div>

      {/* ── Content Sections ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <SectionCard icon={Heart} title="Message from the Board">
          <p>
            The Board of Trustees expresses its gratitude to all homeowners who participated in the
            May 2026 General Assembly. Your continued engagement and support are vital to the growth
            and well-being of our community.
          </p>
          <p>
            We remain committed to transparency, responsible stewardship, and delivering quality
            services to every resident of Sabella.
          </p>
        </SectionCard>

        <SectionCard icon={Star} title="President's State of the Association" accent>
          <p>
            President Renante Martinez reported that SHAI has made significant strides in financial
            stability, security, and community infrastructure. With a healthy excess revenue of
            PHP 1,648,932 in 2025, the association is well-positioned for continued improvements.
          </p>
          <p>
            Key priorities include continued security enhancements, environmental compliance, and
            preparation for upcoming HOA elections.
          </p>
        </SectionCard>

        <SectionCard icon={Wrench} title="Operations & Ongoing Projects">
          <BulletItem>Continuous monitoring and maintenance of all common areas</BulletItem>
          <BulletItem>Coordination with contractors for infrastructure upgrades</BulletItem>
          <BulletItem>Streamlined work order and resident request processes</BulletItem>
          <BulletItem>Regular site inspections and quality checks</BulletItem>
        </SectionCard>

        <SectionCard icon={Shield} title="Security Enhancements">
          <p>
            Security services remain the association's largest investment at PHP 4,844,649 for 2025,
            reflecting the board's commitment to resident safety.
          </p>
          <BulletItem>24/7 guard deployment at all entry/exit points</BulletItem>
          <BulletItem>Visitor management protocol strictly enforced</BulletItem>
          <BulletItem>Incident reporting system upgraded</BulletItem>
        </SectionCard>

        <SectionCard icon={Zap} title="Solar Streetlights">
          <p>
            The association continues expanding its solar streetlight program to reduce utility costs
            and improve nighttime safety throughout the subdivision.
          </p>
          <BulletItem>New solar units installed along main thoroughfares</BulletItem>
          <BulletItem>Maintenance schedule established for all existing units</BulletItem>
          <BulletItem>Future phases planned pending budget approval</BulletItem>
        </SectionCard>

        <SectionCard icon={Droplets} title="Pool Maintenance">
          <p>
            Pool chemicals and maintenance expenditures reached PHP 165,000 in 2025, ensuring the
            community pool remains clean and safe for all residents.
          </p>
          <BulletItem>Weekly water quality testing maintained</BulletItem>
          <BulletItem>Pool revenue collected: PHP 316,954</BulletItem>
          <BulletItem>Equipment servicing conducted quarterly</BulletItem>
        </SectionCard>

        <SectionCard icon={Camera} title="CCTV Expansion">
          <p>
            As part of the security enhancement program, additional CCTV cameras have been installed
            in key community areas, increasing overall coverage and deterrence.
          </p>
          <BulletItem>New camera installations at blind spots and perimeter areas</BulletItem>
          <BulletItem>Footage retention policy updated to 30-day storage</BulletItem>
          <BulletItem>Integration with guard monitoring station completed</BulletItem>
        </SectionCard>

        <SectionCard icon={Wrench} title="General Repairs">
          <p>
            Repairs and maintenance spending totalled PHP 1,837,774 in 2025, covering roads,
            drainage, amenity areas, and common facilities.
          </p>
          <BulletItem>Road patching and resealing completed in select areas</BulletItem>
          <BulletItem>Drainage clearing and de-clogging program ongoing</BulletItem>
          <BulletItem>Perimeter fence and gate repairs finalized</BulletItem>
        </SectionCard>

        <SectionCard icon={Leaf} title="Environmental Compliance">
          <p>
            SHAI remains committed to environmental stewardship and regulatory compliance. Green
            initiatives are embedded into the association's operational guidelines.
          </p>
          <BulletItem>Proper waste segregation and disposal enforced</BulletItem>
          <BulletItem>Landscaping and green-space maintenance ongoing</BulletItem>
          <BulletItem>Compliance with local environmental ordinances maintained</BulletItem>
        </SectionCard>

        <SectionCard icon={TrendingUp} title="Financial Health Overview" accent>
          <p>
            The association closed 2025 with strong financial health. Total assets grew to
            PHP 3,854,960, with a cash balance of PHP 3,805,172.
          </p>
          <BulletItem>Annual Revenue: PHP 11,374,945</BulletItem>
          <BulletItem>Annual Expenses: PHP 9,726,013</BulletItem>
          <BulletItem>Excess Revenue: PHP 1,648,932</BulletItem>
          <BulletItem>Members' Equity: PHP 2,236,160</BulletItem>
        </SectionCard>

        <SectionCard icon={Building2} title="Local Government & Federation Support">
          <p>
            SHAI continues to coordinate with the local government of General Trias City and
            relevant federations on matters affecting the community and its residents.
          </p>
          <BulletItem>Active participation in LGU-HOA coordination meetings</BulletItem>
          <BulletItem>Representation in homeowners' federation activities</BulletItem>
          <BulletItem>Compliance with HLURB and local regulatory requirements</BulletItem>
        </SectionCard>

        <SectionCard icon={Vote} title="Upcoming HOA Elections">
          <p>
            The board announced that HOA elections are on the horizon. All eligible members are
            encouraged to participate as voters or candidates.
          </p>
          <BulletItem>Election calendar to be published via official channels</BulletItem>
          <BulletItem>Candidate filing period to be announced</BulletItem>
          <BulletItem>All active members in good standing are eligible to vote</BulletItem>
        </SectionCard>

      </div>

      {/* Community Concerns (full width) */}
      <SectionCard icon={MessageCircle} title="Community Concerns Raised">
        <p>
          During the open forum, homeowners raised several concerns which the board acknowledged and
          committed to address:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2">
          <BulletItem>Stray animal management within the subdivision</BulletItem>
          <BulletItem>Speeding vehicles along internal roads</BulletItem>
          <BulletItem>Noise complaints from construction activities</BulletItem>
          <BulletItem>Improvement of visitor parking arrangements</BulletItem>
          <BulletItem>Request for additional outdoor lighting in Phase 3</BulletItem>
          <BulletItem>Clarity on construction bond refund timelines</BulletItem>
        </div>
        <p className="mt-2">
          The board committed to reviewing each concern and providing updates at the next quarterly
          meeting.
        </p>
      </SectionCard>

      {/* Closing Remarks */}
      <div
        className="card px-6 py-5 flex gap-4 items-start"
        style={{ background: 'var(--brand-xlight)', border: '1px solid var(--brand-light)' }}
      >
        <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--brand)' }} />
        <div>
          <p className="font-bold text-sm mb-1" style={{ color: 'var(--brand)' }}>
            Closing Remarks
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--brand)' }}>
            The May 2026 General Assembly concluded with a renewed sense of community solidarity.
            The Board of Trustees thanks all homeowners for their active participation, constructive
            feedback, and unwavering support. Together, we continue to build a safe, thriving, and
            well-managed community in Sabella, General Trias City.
          </p>
        </div>
      </div>

      {/* Footer attribution */}
      <p className="text-center text-xs pb-2" style={{ color: 'var(--text-muted)' }}>
        Source: SHAI General Assembly Newsletter — May 2026 &nbsp;·&nbsp; Sabella Homeowners' Association Inc.
      </p>

    </div>
  )
}
