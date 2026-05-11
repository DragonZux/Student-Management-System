import React from 'react';
import styles from '@/styles/modules/ui/button.module.css';
import clsx from 'clsx';

/**
 * CyberButton - Cyberpunk-themed button with neon accents
 * 
 * Variants:
 * - default: Outline with accent neon border (most common)
 * - glitch: Solid accent background with chromatic aberration (CTAs)
 * - secondary: Magenta neon border
 * - danger: Red neon border for destructive actions
 * - ghost: Minimal, subtle
 * - tertiary: Cyan neon border
 */
export default function CyberButton({
  children,
  variant = 'default',
  size = 'md',
  className,
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        styles.btn,
        styles[`btn-${variant}`],
        styles[`size-${size}`],
        disabled && styles.disabled,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
