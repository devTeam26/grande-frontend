import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className, hover = false, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-sm border border-gray-100',
        hover && 'transition-all duration-300 hover:shadow-md hover:-translate-y-1',
        paddings[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, icon, color = 'gold' }: {
  label: string; value: string | number; sub?: string; icon?: React.ReactNode; color?: 'gold' | 'navy' | 'green' | 'blue';
}) {
  const colors = {
    gold: 'bg-gold-50 text-gold-600',
    navy: 'bg-navy-50 text-navy-700',
    green: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <Card className="flex items-center gap-4" padding="md">
      {icon && (
        <div className={cn('rounded-xl p-3 flex-shrink-0', colors[color])}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}
