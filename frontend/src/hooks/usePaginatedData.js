"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';

function normalizeOptions(optionsOrCacheKey, legacyLimit) {
  if (typeof optionsOrCacheKey === 'string') {
    return {
      cacheKey: optionsOrCacheKey,
      initialLimit: legacyLimit ?? 20,
    };
  }
  return optionsOrCacheKey || {};
}

function normalizeResult(result, currentSkip) {
  if (Array.isArray(result)) {
    return {
      data: result,
      total: result.length,
      skip: currentSkip,
    };
  }

  if (Array.isArray(result?.data)) {
    return {
      data: result.data,
      total: Number(result.total ?? result.data.length ?? 0),
      skip: Number(result.skip ?? currentSkip ?? 0),
    };
  }

  return {
    data: [],
    total: 0,
    skip: Number(result?.skip ?? currentSkip ?? 0),
  };
}

export default function usePaginatedData(url, optionsOrCacheKey = {}, legacyLimit) {
  const options = normalizeOptions(optionsOrCacheKey, legacyLimit);
  const {
    initialLimit = 20,
    initialSkip = 0,
    searchParam = 'search',
    extraParams = {},
    responseAdapter = null,
  } = options;
  const extraParamsKey = JSON.stringify(extraParams || {});

  const [data, setData] = useState([]);
  const [rawData, setRawData] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [skip, setSkip] = useState(initialSkip);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const searchTimeoutRef = useRef(null);
  const currentRequestRef = useRef(null);
  const responseAdapterRef = useRef(responseAdapter);
  const extraParamsRef = useRef(extraParams || {});

  useEffect(() => {
    responseAdapterRef.current = responseAdapter;
  }, [responseAdapter]);

  useEffect(() => {
    extraParamsRef.current = extraParamsKey ? JSON.parse(extraParamsKey) : {};
  }, [extraParamsKey]);

  const fetchData = useCallback(async (currentSkip, currentLimit, currentSearch, force = false) => {
    try {
      setLoading(true);
      setError(null);

      // Cancel previous request if still running
      if (currentRequestRef.current) {
        // Axios cancel token could be used here, but for now we just track identity
      }

      const params = {
        skip: currentSkip,
        limit: currentLimit,
        ...extraParamsRef.current,
      };
      if (currentSearch) params[searchParam] = currentSearch;

      const response = await api.get(url, { params });
      const result = response.data;
      const adapted = typeof responseAdapterRef.current === 'function'
        ? responseAdapterRef.current(result, { skip: currentSkip, limit: currentLimit, search: currentSearch })
        : normalizeResult(result, currentSkip);
      const fetchedData = adapted.data || [];
      const fetchedTotal = Number(adapted.total || 0);
      const resolvedSkip = Number(adapted.skip ?? currentSkip ?? 0);

      setData(fetchedData);
      setRawData(result);
      setTotal(fetchedTotal);
      setSkip(resolvedSkip);
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setError(err.message || 'Lỗi khi tải dữ liệu');
        console.error('Fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [url, searchParam]);

  useEffect(() => {
    fetchData(skip, limit, debouncedSearch);
  }, [skip, limit, debouncedSearch, fetchData]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSkip(0);
      setDebouncedSearch(search);
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search]);

  const handleSearch = (value) => {
    setSearch(value);
  };

  const nextPage = () => {
    if (skip + limit < total) {
      setSkip(prev => prev + limit);
    }
  };

  const prevPage = () => {
    if (skip - limit >= 0) {
      setSkip(prev => prev - limit);
    }
  };

  const setPage = (value) => {
    const nextPageValue = typeof value === 'function'
      ? value(Math.floor(skip / limit) + 1)
      : value;
    const normalizedPage = Math.max(1, Number(nextPageValue) || 1);
    setSkip((normalizedPage - 1) * limit);
  };

  const setPageSize = (value) => {
    const normalized = Math.max(1, Number(value) || initialLimit);
    setLimit(normalized);
    setSkip(0);
  };

  const refresh = () => fetchData(skip, limit, debouncedSearch, true);
  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    data,
    rawData,
    total,
    loading,
    error,
    skip,
    limit,
    page: currentPage,
    pageSize: limit,
    search,
    query: search,
    handleSearch,
    setSearch,
    setQuery: setSearch,
    nextPage,
    prevPage,
    setPage,
    currentPage,
    setCurrentPage: setPage,
    totalPages,
    setPageSize,
    refresh,
  };
}
