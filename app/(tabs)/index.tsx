
import { useEffect } from 'react';

import { useUser } from '@/src/context/UserContext';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';




export default function Index() {


  const { fetchUserProfile } = useUser();

  const getFoods = async () => {
    // try {
    //   const response = await apiClient.get(BackendRoutes.FOOD_LIST_7DAYS);
    //   console.log('Foods fetched successfully:', response.data);
    //   updateFoodDataByDate(response.data)
    //   return response.data;
    // } catch (error) {
    //   console.error('Error fetching foods:', error);
    //   return null;
    // }
  };

  useEffect(() => {
    // fetchUserProfile();
    // getFoods()
  }, []);
  return (
    <GradientBackground>
      {/* <FoodLogMenu /> */}
    </GradientBackground>
  );
}
