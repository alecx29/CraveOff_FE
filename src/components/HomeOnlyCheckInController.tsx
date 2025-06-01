import React from 'react';
import { usePathname } from 'expo-router';
import DailyCheckInController from './DailyCheckInController';

/**
 * A wrapper component that only renders the DailyCheckInController
 * when the user is on the home page.
 */
const HomeOnlyCheckInController: React.FC = () => {
  const pathname = usePathname();
  
  // Only show on main home tab and not on other pages
  // The home tab path is '/' or '/index'
  const isHomePage = pathname === '/' || pathname === '/index';
  
  if (!isHomePage) {
    return null;
  }
  
  return <DailyCheckInController />;
};

export default HomeOnlyCheckInController; 