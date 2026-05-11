import React from 'react';
import styles from '@/styles/modules/ui/cyberbadge.module.css';
import clsx from 'clsx';

/**
 * CyberBadge - Cyberpunk badge component with neon borders
 * 
 * Variants:
 * - accent: Green/primary neon
 * - secondary: Magenta neon
 * - tertiary: Cyan neon
 * - success: Green for positive states
 * - warning: Orange for caution
 * - danger: Red for errors/destructive
 */
export default function CyberBadge({
  children,
  variant = 'accent',
  size = 'md',
  className,
  ...props
}) {
  return (
    <span
      className={clsx(
        styles.badge,
        styles[`variant-${variant}`],
        styles[`size-${size}`],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
