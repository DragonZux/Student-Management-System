"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';

/**
 * Custom hook for paginated data with searching, debouncing, and caching.
 */
export default function usePaginatedData(url, options = {}) {
  const {
    initialLimit = 20,
    initialSkip = 0,
    cacheKey = null,
    cacheTime = 5 * 60 * 1000, // 5 minutes default
  } = options;

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [skip, setSkip] = useState(initialSkip);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState('');
  
  const searchTimeoutRef = useRef(null);
  const currentRequestRef = useRef(null);

  const fetchData = useCallback(async (currentSkip, currentLimit, currentSearch, force = false) => {
    // 1. Check cache if not forced
    if (cacheKey && !force && !currentSearch) {
      const cached = localStorage.getItem(`cache_${cacheKey}_${currentSkip}_${currentLimit}`);
      if (cached) {
        const { timestamp, data: cachedData, total: cachedTotal } = JSON.parse(cached);
        if (Date.now() - timestamp < cacheTime) {
          setData(cachedData);
          setTotal(cachedTotal);
          setLoading(false);
          return;
        }
      }
    }

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
        search: currentSearch || undefined
      };

      const response = await api.get(url, { params });
      
      // The backend now returns { data, total, skip, limit }
      const result = response.data;
      const fetchedData = result.data || [];
      const fetchedTotal = result.total || 0;

      setData(fetchedData);
      setTotal(fetchedTotal);

      // 2. Update cache
      if (cacheKey && !currentSearch) {
        localStorage.setItem(`cache_${cacheKey}_${currentSkip}_${currentLimit}`, JSON.stringify({
          timestamp: Date.now(),
          data: fetchedData,
          total: fetchedTotal
        }));
      }
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setError(err.message || 'Lỗi khi tải dữ liệu');
        console.error('Fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [url, cacheKey, cacheTime]);

  // Initial fetch and on skip/limit change
  useEffect(() => {
    fetchData(skip, limit, search);
  }, [skip, limit, fetchData]);

  // Handle search with debouncing
  const handleSearch = (val) => {
    setSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      setSkip(0); // Reset to first page on search
      fetchData(0, limit, val);
    }, 500);
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

  const refresh = () => fetchData(skip, limit, search, true);

  return {
    data,
    total,
    loading,
    error,
    skip,
    limit,
    search,
    handleSearch,
    nextPage,
    prevPage,
    setPage: (p) => setSkip(p * limit),
    refresh
  };
}
