import React from 'react';
import styles from './Card.module.css';

export default function Card({ title, children, footer, className }) {
  return (
    <div className={`${styles.card} ${className}`}>
      {title && <div className={styles.header}><h3>{title}</h3></div>}
      <div className={styles.content}>
        {children}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
