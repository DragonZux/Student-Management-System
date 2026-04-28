import React from 'react';
import styles from '@/styles/modules/admin/skeleton.module.css';

export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {[...Array(columns)].map((_, i) => (
              <th key={i}><div className={styles.skeletonHeader} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(rows)].map((_, i) => (
            <tr key={i}>
              {[...Array(columns)].map((_, j) => (
                <td key={j}><div className={styles.skeletonBox} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className={`${styles.cardSkeleton} glass`}>
      <div className={styles.skeletonHeader} style={{ width: '40%', marginBottom: '1rem' }} />
      <div className={styles.skeletonBox} style={{ height: '100px' }} />
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className={`${styles.statSkeleton} glass`}>
      <div className={styles.skeletonCircle} />
      <div style={{ flex: 1 }}>
        <div className={styles.skeletonBox} style={{ width: '60%', height: '12px', marginBottom: '0.5rem' }} />
        <div className={styles.skeletonBox} style={{ width: '40%', height: '24px' }} />
      </div>
    </div>
  );
}
