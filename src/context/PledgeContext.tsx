import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';

export interface PledgeData {
  id: string;
  user_id: string;
  check_in_at: string;
}

interface PledgeContextType {
  pledgeHistory: PledgeData[];
  canMakePledge: boolean;
  activePledgeTimeRemaining: string | null;
  activePledgeStartTime: string | null;
  activePledgeEndTime: string | null;
  isLoadingPledgeHistory: boolean;
  fetchPledgeHistory: () => Promise<void>;
}

const PledgeContext = createContext<PledgeContextType>({
  pledgeHistory: [],
  canMakePledge: true,
  activePledgeTimeRemaining: null,
  activePledgeStartTime: null,
  activePledgeEndTime: null,
  isLoadingPledgeHistory: false,
  fetchPledgeHistory: async () => {},
});

export const PledgeProvider = ({ children }: { children: ReactNode }) => {
  const [pledgeHistory, setPledgeHistory] = useState<PledgeData[]>([]);
  const [canMakePledge, setCanMakePledge] = useState(true);
  const [activePledgeTimeRemaining, setActivePledgeTimeRemaining] = useState<string | null>(null);
  const [activePledgeStartTime, setActivePledgeStartTime] = useState<string | null>(null);
  const [activePledgeEndTime, setActivePledgeEndTime] = useState<string | null>(null);
  const [isLoadingPledgeHistory, setIsLoadingPledgeHistory] = useState(false);

  const formatPledgeTime = (date: Date): string => {
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchPledgeHistory = async () => {
    try {
      setIsLoadingPledgeHistory(true);
      const response = await apiClient.get<{ pledges: PledgeData[] }>(BackendRoutes.PLEDGE_HISTORY);
      if (response.data && response.data.pledges && response.data.pledges.length > 0) {
        const sortedPledges = [...response.data.pledges].sort((a, b) => 
          new Date(b.check_in_at).getTime() - new Date(a.check_in_at).getTime()
        );
        setPledgeHistory(sortedPledges);
        const latestPledge = sortedPledges[0];
        const pledgeDate = new Date(latestPledge.check_in_at);
        const now = new Date();
        const diffMs = now.getTime() - pledgeDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours < 24) {
          setCanMakePledge(false);
          const remainingMs = (24 * 60 * 60 * 1000) - diffMs;
          const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
          const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
          setActivePledgeTimeRemaining(`${remainingHours}h ${remainingMinutes}m`);
          setActivePledgeStartTime(formatPledgeTime(pledgeDate));
          const endDate = new Date(pledgeDate.getTime() + (24 * 60 * 60 * 1000));
          setActivePledgeEndTime(formatPledgeTime(endDate));
        } else {
          setCanMakePledge(true);
          setActivePledgeTimeRemaining(null);
          setActivePledgeStartTime(null);
          setActivePledgeEndTime(null);
        }
      } else {
        setPledgeHistory([]);
        setCanMakePledge(true);
        setActivePledgeTimeRemaining(null);
        setActivePledgeStartTime(null);
        setActivePledgeEndTime(null);
      }
    } catch (error) {
      console.error('Error fetching pledge history:', error);
      setCanMakePledge(true);
      setActivePledgeTimeRemaining(null);
      setActivePledgeStartTime(null);
      setActivePledgeEndTime(null);
    } finally {
      setIsLoadingPledgeHistory(false);
    }
  };

  useEffect(() => {
    fetchPledgeHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PledgeContext.Provider value={{
      pledgeHistory,
      canMakePledge,
      activePledgeTimeRemaining,
      activePledgeStartTime,
      activePledgeEndTime,
      isLoadingPledgeHistory,
      fetchPledgeHistory,
    }}>
      {children}
    </PledgeContext.Provider>
  );
};

export const usePledge = () => useContext(PledgeContext); 