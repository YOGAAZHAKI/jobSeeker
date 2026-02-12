import { Briefcase, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'default' | 'light';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo = ({ variant = 'default', size = 'md', showText = true }: LogoProps) => {
  const sizeClasses = {
    sm: 'h-14 w-14',
    md: 'h-16 w-16',
    lg: 'h-18 w-18',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl p-2',
          sizeClasses[size]
        )}
      >
        <img src="/fav.png" alt="Logo" className="h-full w-full object-contain" />
      </div>
      {showText && (
        <span
          className={cn(
            'font-display font-bold tracking-tight',
            textSizeClasses[size],
            variant === 'light' ? 'text-primary-foreground' : 'text-foreground'
          )}
        >
          SkillBridge
        </span>
      )}
    </div>
  );
};
