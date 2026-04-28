"use client";

import { useEffect, useMemo, useState } from 'react';

export default function useClientPagination(items, options = {}) {
  const {
    initialPageSize = 10,
    filter = null,
  } = options;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const filteredItems = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    return typeof filter === 'function' ? filter(list) : list;
  }, [items, filter]);

  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  return {
    data: paginatedItems,
    allItems: filteredItems,
    total,
    page,
    currentPage: page,
    pageSize,
    totalPages,
    setPage,
    setCurrentPage: setPage,
    setPageSize: (value) => {
      setPageSize(Math.max(1, Number(value) || initialPageSize));
      setPage(1);
    },
  };
}
