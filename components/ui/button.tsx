import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const base =
      'px-3 py-2 rounded-lg border text-sm transition-colors';
    const styles =
      variant === 'outline'
        ? 'bg-transparent'
        : variant === 'ghost'
        ? 'bg-transparent border-transparent'
        : 'bg-black text-white border-black';
    return <button ref={ref} className={`${base} ${styles} ${className}`} {...props} />;
  }
);
Button.displayName = 'Button';

export default Button;
