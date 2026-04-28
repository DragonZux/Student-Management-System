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
        gap: '1rem',
        flexWrap: 'wrap',
        marginTop: '1.5rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
        {total > 0 ? `Hiển thị ${from}-${to} / ${total}` : 'Không có dữ liệu'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {showPageSize ? (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>Mỗi trang</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                background: 'var(--card)',
                padding: '0.45rem 0.65rem',
              }}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <button
          type="button"
          onClick={() => onPageChange?.(page - 1)}
          disabled={page <= 1}
          className="btn-primary"
          style={{ padding: '0.5rem 0.9rem', background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: 'none' }}
        >
          Trước
        </button>

        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {items.map((item) => (
            typeof item === 'string' ? (
              <span key={item} style={{ color: 'var(--muted-foreground)', padding: '0 0.25rem' }}>...</span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange?.(item)}
                className="btn-primary"
                style={{
                  padding: '0.5rem 0.85rem',
                  minWidth: '2.5rem',
                  background: item === page ? 'var(--primary)' : 'transparent',
                  color: item === page ? '#fff' : 'var(--foreground)',
                  border: '1px solid var(--border)',
                  boxShadow: 'none',
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
          className="btn-primary"
          style={{ padding: '0.5rem 0.9rem', background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: 'none' }}
        >
          Sau
        </button>
      </div>
    </div>
  );
}
