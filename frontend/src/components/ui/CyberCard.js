import React from 'react';
import styles from '@/styles/modules/ui/cybercard.module.css';
import clsx from 'clsx';

/**
 * CyberCard - Cyberpunk card component with chamfered corners and neon effects
 * 
 * Variants:
 * - default: Standard card with neon border on hover
 * - terminal: Terminal/HUD aesthetic with top bar and traffic lights
 * - holographic: Glassmorphic with gradient borders
 * - hud: Hardware HUD panel with corner accents
 */
export default function CyberCard({
  children,
  title,
  subtitle,
  variant = 'default',
  className,
  headerExtra,
  footer,
  hoverEffect = true,
  ...props
}) {
  const renderTerminalHeader = () => (
    <div className={styles['terminal-header']}>
      <div className={styles['traffic-lights']}>
        <div className={styles['light']} style={{ backgroundColor: '#ff3366' }}></div>
        <div className={styles['light']} style={{ backgroundColor: '#ffaa00' }}></div>
        <div className={styles['light']} style={{ backgroundColor: '#00ff88' }}></div>
      </div>
      {title && <h3 className={styles['terminal-title']}>{title}</h3>}
    </div>
  );

  const renderDefaultHeader = () => (
    (title || subtitle || headerExtra) && (
      <div className={styles.header}>
        <div className={styles['header-content']}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {headerExtra}
      </div>
    )
  );

  return (
    <div
      className={clsx(
        styles.card,
        styles[`variant-${variant}`],
        hoverEffect && styles['hover-effect'],
        className
      )}
      {...props}
    >
      {variant === 'terminal' && renderTerminalHeader()}
      {variant !== 'terminal' && renderDefaultHeader()}
      
      <div className={styles.content}>
        {children}
      </div>
      
      {footer && <div className={styles.footer}>{footer}</div>}

      {/* Corner accents for HUD variant */}
      {variant === 'hud' && (
        <>
          <div className={styles['corner-accent']} style={{ top: 0, left: 0 }}></div>
          <div className={styles['corner-accent']} style={{ top: 0, right: 0 }}></div>
          <div className={styles['corner-accent']} style={{ bottom: 0, left: 0 }}></div>
          <div className={styles['corner-accent']} style={{ bottom: 0, right: 0 }}></div>
        </>
      )}
    </div>
  );
}
