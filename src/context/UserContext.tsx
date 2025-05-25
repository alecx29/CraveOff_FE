import React, { createContext, useState, useContext, ReactNode } from 'react';

import { apiClient } from '@/src/axios/apiClient';

export interface UserProfile {
  goalWeight: number;
  weight: number;
  height: number;
  gender: string;
  birthdate: string;
  // Add other fields as needed
}

interface UserContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  fetchUserProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  updateUser: () => {},
  fetchUserProfile: async () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const fetchUserProfile = async () => {
    try {
      const response = await apiClient.get('/users/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, updateUser, fetchUserProfile }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext); 