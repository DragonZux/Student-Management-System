import React from 'react';
import styles from '@/styles/modules/ui/cyberinput.module.css';
import clsx from 'clsx';

/**
 * CyberInput - Cyberpunk-styled input with terminal aesthetic
 * 
 * Features:
 * - Terminal-style ">" prefix
 * - Neon border and glow on focus
 * - Monospace typography
 * - Supports all standard input types
 */
export default function CyberInput({
  placeholder,
  value,
  onChange,
  type = 'text',
  variant = 'default',
  className,
  error,
  label,
  helperText,
  prefix = true,
  ...props
}) {
  return (
    <div className={styles.wrapper}>
      {label && (
        <label className={styles.label}>
          {label}
        </label>
      )}
      <div className={clsx(styles.inputContainer, error && styles.error)}>
        {prefix && type === 'text' && (
          <span className={styles.prefix}>&gt;</span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={clsx(styles.input, styles[`variant-${variant}`], className)}
          {...props}
        />
      </div>
      {helperText && (
        <p className={clsx(styles.helperText, error && styles.errorText)}>
          {helperText}
        </p>
      )}
    </div>
  );
}
