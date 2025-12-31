import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';


export default function TabsLayout() {
  const { user } = useAuth();
  // console.log("Layout USER DATA →", data.user);

  if (!user) {
    return null; // or redirect to login
  }

  return (
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
  );
}