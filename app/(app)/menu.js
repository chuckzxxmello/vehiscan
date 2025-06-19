import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/authContext';

const Menu = () => {
    const router = useRouter();
    const { user } = useAuth();

    const handleLogout = async () => {
        try {
        await signOut(auth);
        router.replace('login');
        } catch (error) {
        Alert.alert('Error', error.message);
        }
    };

    const handleAddVehicle = () => {
      router.push('addVehicle');
    };

    const handleProfile = () => {
      router.push('profile');
    };

    const handleVehicle = () => {
      router.push('vehicles');
    };

    const handleHistory = () => {
      router.push('history');
    };

    const handleBack = () => {
      router.back();
    };

  return (
    <View className="flex-1 bg-[#F5F6FA]">
      {/* Header Section - Matching main.js */}
      <View className="flex-row justify-between items-center p-4 bg-[#4169E1] rounded-b-3xl">
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={30} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-[#ffffff]">Menu</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Profile Section */}
      <View className="items-center mt-8 mb-8">
        <TouchableOpacity 
          onPress={handleProfile} 
          className="bg-[#4169E1] p-6 rounded-full w-20 h-20 justify-center items-center shadow-lg"
          style={{ elevation: 4 }}
        >
          <Ionicons name="person" size={32} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-[#4169E1] text-lg font-bold mt-3">Profile</Text>
      </View>

      {/* Menu Options - Matching main.js slide-in menu style */}
      <View className="px-6 space-y-4">
        {/* Admin Only - Add Vehicle */}
        {user?.isAdmin && (
          <View style={{ marginBottom: 8 }}>
            <TouchableOpacity
              onPress={handleAddVehicle}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#4169E1',
                borderRadius: 12,
                paddingVertical: 14,
                paddingHorizontal: 20,
                elevation: 3
              }}
            >
              <Ionicons name="add" size={28} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 24, marginLeft: 16, fontWeight: 'bold' }}>ADD VEHICLE</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* My Vehicles */}
        <View style={{ marginBottom: 8 }}>
          <TouchableOpacity
            onPress={handleVehicle}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#4169E1',
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 20,
              elevation: 3
            }}
          >
            <Ionicons name="car" size={28} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 24, marginLeft: 16, fontWeight: 'bold' }}>MY VEHICLES</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Scans */}
        <View style={{ marginBottom: 8 }}>
          <TouchableOpacity
            onPress={handleHistory}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#4169E1',
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 20,
              elevation: 3
            }}
          >
            <Ionicons name="time-outline" size={28} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 24, marginLeft: 16, fontWeight: 'bold' }}>RECENT SCANS</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={{ marginTop: 20 }}>
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fff',
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 20,
              elevation: 3
            }}
          >
            <Ionicons name="log-out-outline" size={28} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 24, marginLeft: 16, fontWeight: 'bold' }}>LOGOUT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer Space */}
      <View className="flex-1" />
      
      {/* App Info - Matching VehiScan branding */}
      <View className="items-center pb-8">
        <Text className="text-[#4169E1] text-2xl font-bold">VehiScan</Text>
        <Text className="text-gray-500 text-sm">Vehicle Management System</Text>
      </View>
    </View>
  );
};

export default Menu;