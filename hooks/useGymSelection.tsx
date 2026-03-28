import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SelectedGym {
  id: string;
  name: string;
  address: string;
  logoUrl?: string;
}

export function useGymSelection() {
  const [selectedGym, setSelectedGym] = useState<SelectedGym | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkGymSelection();
  }, []);

  const checkGymSelection = async () => {
    try {
      const gymData = await AsyncStorage.getItem('selectedGym');
      if (gymData) {
        setSelectedGym(JSON.parse(gymData));
      }
    } catch (error) {
      console.error('Error checking gym selection:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectGym = async (gym: SelectedGym) => {
    try {
      await AsyncStorage.setItem('selectedGym', JSON.stringify(gym));
      setSelectedGym(gym);
    } catch (error) {
      console.error('Error saving gym selection:', error);
      throw error;
    }
  };

  const clearGymSelection = async () => {
    try {
      await AsyncStorage.removeItem('selectedGym');
      setSelectedGym(null);
    } catch (error) {
      console.error('Error clearing gym selection:', error);
      throw error;
    }
  };

  return {
    selectedGym,
    loading,
    hasSelectedGym: !!selectedGym,
    selectGym,
    clearGymSelection,
    checkGymSelection,
  };
}
