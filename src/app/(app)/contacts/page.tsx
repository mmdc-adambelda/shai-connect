import { Phone, Shield, Flame, AlertTriangle, Droplets, Building2, HeadphonesIcon, FileCheck } from 'lucide-react'

const HOA_EMERGENCY = [
  {
    label: 'SHAI Admin',
    number: '09544200144',
    icon: Building2,
    color: 'var(--brand)',
    bg: 'var(--brand-xlight)',
  },
  {
    label: 'Barangay Hotline',
    number: '09671286478',
    icon: Shield,
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    label: 'Fire Department',
    number: '09190664274',
    icon: Flame,
    color: '#DC2626',
    bg: '#FEF2F2',
  },
  {
    label: 'PNP Gen. Trias',
    number: '09985985612',
    icon: AlertTriangle,
    color: '#D97706',
    bg: '#FFFBEB',
  },
  {
    label: 'Basic Water (Viber)',
    number: '09178297533',
    icon: Droplets,
    color: '#0891B2',
    bg: '#ECFEFF',
  },
]

const MOVE_IN = [
  {
    label: 'House & Unit Concerns',
    number: '09612148626',
    icon: Building2,
    color: 'var(--brand)',
    bg: 'var(--brand-xlight)',
  },
  {
    label: 'Customer Service',
    number: '09985901876',
    icon: HeadphonesIcon,
    color: 'var(--brand)',
    bg: 'var(--brand-xlight)',
  },
  {
    label: 'Title Conversion Dept.',
    number: '09954692569',
    icon: FileCheck,
    color: 'var(--brand)',
    bg: 'var(--brand-xlight)',
  },
]

function ContactCard({
  label,
  number,
  icon: Icon,
  color,
  bg,
}: {
  label: string
  number: string
  icon: React.ElementType
  color: string
  bg: string
}) {
  return (
    <div
      className="card p-4 flex items-center gap-4 transition-shadow"
      style={{ borderRadius: 'var(--radius-lg)' }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
          {label}
        </p>
        <p className="text-base font-bold mt-0.5 tracking-wide font-mono" style={{ color }}>
          {number}
        </p>
      </div>

      <a
        href={`tel:${number}`}
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-80 active:scale-95"
        style={{ background: color, color: 'white' }}
        aria-label={`Call ${label}`}
      >
        <Phone className="w-4 h-4" />
      </a>
    </div>
  )
}

export default function ContactsPage() {
  return (
    <div className="max-w-xl mx-auto space-y-6">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--brand)' }}
        >
          <Phone className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
            Important Contacts
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Key numbers for HOA, emergency, and property services
          </p>
        </div>
      </div>

      {/* HOA & Emergency section */}
      <section>
        <h2
          className="text-xs font-bold uppercase tracking-widest mb-3 px-1"
          style={{ color: 'var(--text-muted)' }}
        >
          HOA &amp; Emergency
        </h2>
        <div className="flex flex-col gap-2.5">
          {HOA_EMERGENCY.map(contact => (
            <ContactCard key={contact.number} {...contact} />
          ))}
        </div>
      </section>

      {/* Move-In Department section */}
      <section>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h2
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}
          >
            Move-In Department
          </h2>
        </div>
        <div className="flex flex-col gap-2.5">
          {MOVE_IN.map(contact => (
            <ContactCard key={contact.number} {...contact} />
          ))}
        </div>
      </section>

      <p className="text-center text-xs pb-2" style={{ color: 'var(--text-muted)' }}>
        Tap the <span className="font-semibold">call button</span> to dial directly from your phone.
      </p>
    </div>
  )
}
