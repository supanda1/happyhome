import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    resize = 'vertical',
    id,
    disabled,
    rows = 4,
    ...props 
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    
    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };
    
    const textareaClasses = clsx(
      'input-field',
      resizeClasses[resize],
      error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
      disabled && 'bg-gray-100 cursor-not-allowed',
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="label">
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          className={textareaClasses}
          disabled={disabled}
          rows={rows}
          {...props}
        />
        
        {error && (
          <p className="error-text">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="text-gray-500 text-sm mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;