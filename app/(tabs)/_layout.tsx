import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useGymSelection } from '../../hooks/useGymSelection';
import GymSelectionModal from '../../components/GymSelectionModal';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';


export default function TabsLayout() {
  const { user } = useAuth();
  const { selectedGym, loading } = useGymSelection();
  const [showGymModal, setShowGymModal] = useState(false);
  const router = useRouter();

  // Show gym selection modal if user hasn't selected a gym
  useEffect(() => {
    if (!loading && user && !selectedGym) {
      setShowGymModal(true);
    }
  }, [loading, user, selectedGym]);

  const handleGymSelected = (gym: any) => {
    // Navigate to home screen after gym selection
    router.replace("/(tabs)");
  };

  if (!user) {
    return null; // or redirect to login
  }

  return (
    <>
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }} 
        />
        <Tabs.Screen
    name="plans"
    options={{
      title: "Plans",
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="wallet-outline" size={size} color={color} />
      ),
    }}
/>

        {/* <Tabs.Screen 
          name="plans" 
          options={{ 
            title: 'Plans',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-text-outline" size={size} color={color} />
            ),
          }} 
        /> */}
        <Tabs.Screen 
          name="gyms" 
          options={{ 
            title: 'Gyms',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="barbell-outline" size={size} color={color} />
            ),
          }} 
        />
        <Tabs.Screen 
          name="profile" 
          options={{ 
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-circle-outline" size={size} color={color} />
            ),
          }} 
        />
      </Tabs>
      
      <GymSelectionModal
        visible={showGymModal}
        onClose={() => setShowGymModal(false)}
        onGymSelected={handleGymSelected}
      />
    </>
  );
}