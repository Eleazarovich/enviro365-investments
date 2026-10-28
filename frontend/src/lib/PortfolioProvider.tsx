'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import type { Portfolio } from './types';

interface PortfolioContextValue {
  portfolio: Portfolio | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  // Bumped after every successful withdrawal so history views refetch
  historyVersion: number;
  bumpHistory: () => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPortfolio();
      setPortfolio(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "We couldn't load your portfolio. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const bumpHistory = useCallback(() => setHistoryVersion((v) => v + 1), []);

  const value = useMemo(
    () => ({ portfolio, loading, error, refresh: load, historyVersion, bumpHistory }),
    [portfolio, loading, error, load, historyVersion, bumpHistory]
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
}
