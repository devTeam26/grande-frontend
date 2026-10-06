import { cn } from '../../utils/cn';

interface BadgeProps {
  variant?: 'gold' | 'navy' | 'green' | 'red' | 'gray' | 'yellow';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const variants = {
  gold: 'bg-gold-100 text-gold-800',
  navy: 'bg-navy-100 text-navy-800',
  green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-700',
  yellow: 'bg-yellow-100 text-yellow-800',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({ variant = 'gray', size = 'md', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 font-medium rounded-full', variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}

export function ChaletTypeBadge({ type }: { type: 'normal' | 'superior' | 'vip' }) {
  const map = {
    normal: { label: 'Standard', variant: 'gray' as const },
    superior: { label: 'Superior', variant: 'gold' as const },
    vip: { label: 'VIP', variant: 'navy' as const },
  };
  const { label, variant } = map[type];
  return <Badge variant={variant}>{label}</Badge>;
}

export function BookingStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    pending: { label: 'Pending', variant: 'yellow' },
    confirmed: { label: 'Confirmed', variant: 'green' },
    cancelled: { label: 'Cancelled', variant: 'red' },
    completed: { label: 'Completed', variant: 'gray' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'gray' };
  return <Badge variant={variant}>{label}</Badge>;
}
