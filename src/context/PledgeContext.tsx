import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
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
  
  // Stocăm data de început a pledge-ului ca Date pentru calcule
  const pledgeDateRef = useRef<Date | null>(null);
  const appState = useRef(AppState.currentState);

  const formatPledgeTime = (date: Date): string => {
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Funcție pentru actualizarea timpului rămas
  const updateRemainingTime = () => {
    if (!pledgeDateRef.current) return;
    
    const now = new Date();
    const diffMs = now.getTime() - pledgeDateRef.current.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours >= 24) {
      // Pledge-ul a expirat
      setCanMakePledge(true);
      setActivePledgeTimeRemaining(null);
      setActivePledgeStartTime(null);
      setActivePledgeEndTime(null);
      pledgeDateRef.current = null;
    } else {
      // Actualizăm timpul rămas
      const remainingMs = (24 * 60 * 60 * 1000) - diffMs;
      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      setActivePledgeTimeRemaining(`${remainingHours}h ${remainingMinutes}m`);
    }
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
          pledgeDateRef.current = pledgeDate; // Salvăm data de început
          
          // Calculăm timpul rămas
          const remainingMs = (24 * 60 * 60 * 1000) - diffMs;
          const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
          const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
          setActivePledgeTimeRemaining(`${remainingHours}h ${remainingMinutes}m`);
          
          // Format pledge times
          setActivePledgeStartTime(formatPledgeTime(pledgeDate));
          
          const endDate = new Date(pledgeDate.getTime() + (24 * 60 * 60 * 1000));
          setActivePledgeEndTime(formatPledgeTime(endDate));
        } else {
          setCanMakePledge(true);
          setActivePledgeTimeRemaining(null);
          setActivePledgeStartTime(null);
          setActivePledgeEndTime(null);
          pledgeDateRef.current = null;
        }
      } else {
        setPledgeHistory([]);
        setCanMakePledge(true);
        setActivePledgeTimeRemaining(null);
        setActivePledgeStartTime(null);
        setActivePledgeEndTime(null);
        pledgeDateRef.current = null;
      }
    } catch (error) {
      console.error('Error fetching pledge history:', error);
      setCanMakePledge(true);
      setActivePledgeTimeRemaining(null);
      setActivePledgeStartTime(null);
      setActivePledgeEndTime(null);
      pledgeDateRef.current = null;
    } finally {
      setIsLoadingPledgeHistory(false);
    }
  };

  // Gestionăm schimbările de stare ale aplicației
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App a revenit în prim-plan, actualizăm imediat timerul
        updateRemainingTime();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Inițializăm datele când componenta este montată
  useEffect(() => {
    fetchPledgeHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Setăm un interval pentru actualizarea timpului rămas
  useEffect(() => {
    // Actualizăm imediat pentru a evita întârzierea inițială
    if (!canMakePledge && pledgeDateRef.current) {
      updateRemainingTime();
    }
    
    // Setăm un interval pentru actualizări ulterioare
    const interval = setInterval(() => {
      if (!canMakePledge && pledgeDateRef.current) {
        updateRemainingTime();
      }
    }, 15000); // Actualizare la fiecare 15 secunde pentru a fi mai responsiv
    
    // Curățăm intervalul la demontare
    return () => clearInterval(interval);
  }, [canMakePledge]);

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