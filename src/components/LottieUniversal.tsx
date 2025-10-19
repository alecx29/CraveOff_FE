import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export default function LottieUniversal(props: any) {
  const [LottieView, setLottieView] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (Platform.OS === 'web') {
        // const mod = await import('lottie-react');
        // setLottieView(() => mod.default);
      } else {
        // const mod = await import('lottie-react-native');
        // setLottieView(() => mod.default);
      }
    };
    load();
  }, []);

  if (!LottieView) return null; // sau un loader temporar
  return <LottieView {...props} />;
}
