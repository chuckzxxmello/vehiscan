import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';

const menuItems = [
  {
    icon: <Ionicons name="settings-outline" size={26} color="#4169E1" />,
    label: 'App Settings',
  },
  {
    icon: <Feather name="file-text" size={26} color="#4169E1" />,
    label: 'Terms & Privacy',
  },
  {
    icon: <Feather name="help-circle" size={26} color="#4169E1" />,
    label: 'Help & Support',
  },
];

const Profile = () => {
  const router = useRouter();
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDoc);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || ''
          });
        }
      }
    };

    fetchUserData();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('login');
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-[#fff]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-12 pb-4">
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={28} color="#4169E1" />
        </TouchableOpacity>
        <Text className="text-[#4169E1] text-2xl font-extrabold">VehiScan</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Profile Card */}
      <View className="bg-white mx-4 rounded-3xl shadow-lg items-center pt-8 pb-6 mb-4" style={{ elevation: 4 }}>
        <View className="relative">
          <View className="bg-[#4169E1] w-28 h-28 rounded-full items-center justify-center">
            <Ionicons name="person" size={70} color="#fff" />
          </View>
          <TouchableOpacity
            className="absolute bottom-2 right-2 bg-white rounded-full p-1 border border-[#4169E1]"
            style={{ elevation: 2 }}
            onPress={() => {
              // Add edit profile logic here
              console.log('Edit profile pressed');
            }}
          >
            <MaterialIcons name="edit" size={22} color="#4169E1" />
          </TouchableOpacity>
        </View>
        <Text className="text-[#22223b] text-2xl font-extrabold mt-4">
          {userData.firstName && userData.lastName 
            ? `${userData.firstName} ${userData.lastName}` 
            : 'User Name'}
        </Text>
        <Text className="text-[#4169E1] text-base mt-1">
          {userData.email || 'user@email.com'}
        </Text>
      </View>

      {/* Menu List */}
      <View className="bg-white mx-4 rounded-2xl shadow-md pb-2" style={{ elevation: 2 }}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={item.label}
            className="flex-row items-center px-6 py-4"
            style={{
              borderBottomWidth: idx !== menuItems.length - 1 ? 1 : 0,
              borderBottomColor: '#e6e6fa'
            }}
            onPress={() => {
              if (item.route) {
                try {
                  router.push(item.route);
                } catch (e) {
                  console.log('Route not implemented:', item.label);
                }
              }
            }}
          >
            <View className="mr-4">{item.icon}</View>
            <Text className="flex-1 text-lg text-[#22223b] font-semibold">{item.label}</Text>
            <Ionicons name="chevron-forward" size={22} color="#4169E1" />
          </TouchableOpacity>
        ))}
        
        {/* Logout */}
        <TouchableOpacity
          className="flex-row items-center px-6 py-4"
          onPress={handleLogout}
        >
          <FontAwesome name="sign-out" size={24} color="#4169E1" style={{ marginRight: 16 }} />
          <Text className="flex-1 text-lg text-[#4169E1] font-semibold">Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Profile;