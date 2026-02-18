import React from 'react';
import { clsx } from 'clsx';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  size: _size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  className,
}) => {
  // Size classes available for future use
  // const sizeClasses = {
  //   sm: 'w-4 h-4',
  //   md: 'w-6 h-6',
  //   lg: 'w-8 h-8',
  //   xl: 'w-12 h-12',
  // };

  const LoadingSpinner = () => (
    <div className="text-primary-600 font-semibold text-sm">
      Loading...
    </div>
  );

  const LoadingDots = () => (
    <div className="text-primary-600 font-semibold text-sm">
      Loading...
    </div>
  );

  const LoadingPulse = () => (
    <div className="text-primary-600 font-semibold text-sm">
      Loading...
    </div>
  );

  const renderLoading = () => {
    switch (variant) {
      case 'dots':
        return <LoadingDots />;
      case 'pulse':
        return <LoadingPulse />;
      case 'spinner':
      default:
        return <LoadingSpinner />;
    }
  };

  const content = (
    <div className={clsx('flex flex-col items-center justify-center', className)}>
      <div className="text-primary-600 mb-2">
        {renderLoading()}
      </div>
      {text && (
        <p className="text-sm text-gray-600 mt-2">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

// Skeleton loading component for content placeholders
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  lines = 1,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200';
  
  const variantClasses = {
    text: 'rounded h-4',
    rectangular: 'rounded',
    circular: 'rounded-full',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={clsx(baseClasses, variantClasses[variant], className)}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : '100%',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={clsx(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  );
};

// Page Loading Component
interface PageLoadingProps {
  message?: string;
  className?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ 
  message = 'Loading...', 
  className 
}) => {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-12 min-h-64', className)}>
      <Loading size="xl" className="mb-4" />
      <p className="text-gray-600 text-lg">{message}</p>
    </div>
  );
};

// Card Loading Skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={clsx('bg-white rounded-lg shadow p-6', className)}>
      <Skeleton variant="rectangular" height={200} className="mb-4" />
      <Skeleton variant="text" className="mb-2" />
      <Skeleton variant="text" width="60%" className="mb-4" />
      <div className="flex justify-between items-center">
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    </div>
  );
};

// Table Loading Skeleton
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ 
  rows = 5, 
  columns = 4, 
  className 
}) => {
  return (
    <div className={clsx('space-y-3', className)}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} variant="text" height={20} />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" height={16} />
          ))}
        </div>
      ))}
    </div>
  );
};

// Form Loading Skeleton
export const FormSkeleton: React.FC<{ fields?: number; className?: string }> = ({ 
  fields = 4, 
  className 
}) => {
  return (
    <div className={clsx('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          <Skeleton variant="text" width="30%" height={16} className="mb-2" />
          <Skeleton variant="rectangular" height={40} />
        </div>
      ))}
      <div className="flex space-x-3 pt-4">
        <Skeleton variant="rectangular" width={100} height={40} />
        <Skeleton variant="rectangular" width={120} height={40} />
      </div>
    </div>
  );
};

// Button Loading State
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({ 
  loading, 
  children, 
  disabled, 
  className,
  ...props 
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'relative inline-flex items-center justify-center',
        loading && 'text-transparent',
        className
      )}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loading size="sm" />
        </div>
      )}
      {children}
    </button>
  );
};

export default Loading;