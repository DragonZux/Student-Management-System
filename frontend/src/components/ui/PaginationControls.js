"use client";

function buildPageItems(page, totalPages, siblingCount = 1) {
  if (totalPages <= 1) return [];

  const pages = new Set([1, totalPages, page]);
  for (let i = Math.max(1, page - siblingCount); i <= Math.min(totalPages, page + siblingCount); i += 1) {
    pages.add(i);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const items = [];

  for (let i = 0; i < sorted.length; i += 1) {
    const current = sorted[i];
    const previous = sorted[i - 1];
    if (previous && current - previous > 1) {
      items.push(`ellipsis-${previous}-${current}`);
    }
    items.push(current);
  }

  return items;
}

export default function PaginationControls({
  page = 1,
  totalPages = 1,
  total = 0,
  pageSize = 10,
  currentCount = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  showPageSize = false,
  className = '',
}) {
  if (totalPages <= 1 && !showPageSize) return null;

  const items = buildPageItems(page, totalPages);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = total === 0 ? 0 : Math.min(total, (page - 1) * pageSize + currentCount);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap',
        marginTop: '2.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', fontWeight: 600 }}>
        {total > 0 ? (
          <>
            Đang xem <span style={{ color: 'var(--foreground)', fontWeight: 800 }}>{from}-{to}</span> trên tổng số <span style={{ color: 'var(--foreground)', fontWeight: 800 }}>{total}</span>
          </>
        ) : 'Không có dữ liệu'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {showPageSize ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--muted-foreground)', fontWeight: 600 }}>Số hàng</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '0.85rem',
                background: 'var(--surface-1)',
                padding: '0.5rem 0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s'
              }}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 1}
            className="action-icon-btn"
            style={{ 
              padding: '0.6rem 1.1rem', 
              background: 'var(--surface-1)', 
              color: page <= 1 ? 'var(--muted-foreground)' : 'var(--foreground)', 
              border: '1px solid var(--border)', 
              borderRadius: '1rem',
              fontWeight: 700,
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              opacity: page <= 1 ? 0.5 : 1
            }}
          >
            Trước
          </button>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {items.map((item) => (
              typeof item === 'string' ? (
                <span key={item} style={{ color: 'var(--muted-foreground)', fontWeight: 800 }}>...</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPageChange?.(item)}
                  style={{
                    minWidth: '2.75rem',
                    height: '2.75rem',
                    borderRadius: '1rem',
                    background: item === page ? 'var(--primary)' : 'var(--surface-1)',
                    color: item === page ? '#fff' : 'var(--foreground)',
                    border: '1px solid',
                    borderColor: item === page ? 'var(--primary)' : 'var(--border)',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s var(--ease-out-expo)',
                    boxShadow: item === page ? 'var(--shadow-primary)' : 'none'
                  }}
                >
                  {item}
                </button>
              )
            ))}
          </div>

          <button
            type="button"
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= totalPages}
            style={{ 
              padding: '0.6rem 1.1rem', 
              background: 'var(--surface-1)', 
              color: page >= totalPages ? 'var(--muted-foreground)' : 'var(--foreground)', 
              border: '1px solid var(--border)', 
              borderRadius: '1rem',
              fontWeight: 700,
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              opacity: page >= totalPages ? 0.5 : 1
            }}
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
