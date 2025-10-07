import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'danger' | 'ghost' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
  glow?: boolean;
  elevated?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    fullWidth = false,
    glow = false,
    elevated = false,
    disabled,
    children, 
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform active:scale-95';
    
    const variantClasses = {
      primary: 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-button hover:shadow-button-hover hover:from-primary-700 hover:to-primary-600 focus:ring-primary-500 hover:scale-105',
      secondary: 'bg-white text-secondary-700 border border-secondary-200 shadow-button hover:bg-secondary-50 hover:shadow-button-hover hover:border-secondary-300 focus:ring-secondary-500 hover:scale-105',
      accent: 'bg-gradient-to-r from-accent-600 to-accent-500 text-white shadow-button hover:shadow-button-hover hover:from-accent-700 hover:to-accent-600 focus:ring-accent-500 hover:scale-105',
      outline: 'border-2 border-primary-500 text-primary-600 bg-transparent hover:bg-primary-50 hover:border-primary-600 hover:shadow-soft focus:ring-primary-500 hover:scale-105',
      danger: 'bg-gradient-to-r from-danger-600 to-danger-500 text-white shadow-button hover:shadow-button-hover hover:from-danger-700 hover:to-danger-600 focus:ring-danger-500 hover:scale-105',
      ghost: 'text-secondary-700 bg-transparent hover:bg-secondary-100 hover:text-secondary-900 focus:ring-secondary-500 hover:scale-105',
      success: 'bg-gradient-to-r from-success-600 to-success-500 text-white shadow-button hover:shadow-button-hover hover:from-success-700 hover:to-success-600 focus:ring-success-500 hover:scale-105',
      warning: 'bg-gradient-to-r from-warning-600 to-warning-500 text-white shadow-button hover:shadow-button-hover hover:from-warning-700 hover:to-warning-600 focus:ring-warning-500 hover:scale-105',
    };
    
    const sizeClasses = {
      xs: 'px-3 py-1.5 text-xs',
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
      xl: 'px-10 py-5 text-lg',
    };

    const glowClasses = {
      primary: 'shadow-glow',
      secondary: '',
      accent: 'shadow-glow-accent',
      outline: '',
      danger: 'shadow-glow-accent',
      ghost: '',
      success: 'shadow-glow',
      warning: 'shadow-glow-accent',
    };

    const elevatedClasses = elevated ? 'shadow-card-elevated hover:shadow-soft-lg' : '';
    
    const classes = clsx(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      glow && glowClasses[variant],
      elevatedClasses,
      fullWidth && 'w-full',
      loading && 'cursor-wait',
      className
    );

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="inline-flex items-center">
            <svg 
              className="animate-spin -ml-1 mr-3 h-4 w-4" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </div>
        )}
        {!loading && children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;