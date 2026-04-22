import React from 'react';
import styles from './Card.module.css';

export default function Card({ title, children, footer, className, headerExtra }) {
  return (
    <div className={`${styles.card} ${className}`}>
      {(title || headerExtra) && (
        <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {title && <h3>{title}</h3>}
          {headerExtra}
        </div>
      )}
      <div className={styles.content}>
        {children}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
