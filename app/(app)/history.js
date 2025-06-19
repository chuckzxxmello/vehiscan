import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { vehiclesCollection, db, app, auth } from '../../firebaseConfig';
import { collection, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

const History = () => {
  const [expandedVehicle, setExpandedVehicle] = useState(null);
  const [scannedVehicles, setScannedVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]); // Initial empty array of users

  const router = useRouter();

  const firebase = app;
  const firestore = db;

  useEffect(() => {
    const scannedVehiclesRef = collection(db, 'scannedVehicles');
    const userScansQuery = query(
      scannedVehiclesRef, 
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(userScansQuery, (querySnapshot) => {
      const scans = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        scans.push({
          ...data,
          id: doc.id,
        });
      });
      setScannedVehicles(scans);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderVehicle = ({ item }) => {
    const scanDate = new Date(item.scannedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const handleDelete = async () => {
      try {
        await deleteDoc(doc(db, 'scannedVehicles', item.id));
      } catch (error) {
        console.error('Error deleting scan:', error);
      }
    };

    return (
      <TouchableOpacity
        onPress={() => {
          if (expandedVehicle === item.id) {
            setExpandedVehicle(null);
          } else {
            setExpandedVehicle(item.id);
          }
        }}
        className="p-4 rounded mb-2 w-full flex-1 justify-center items-center"
        style={{ backgroundColor: '#4169E1' }}
      >
        <Text className="text-2xl text-[#ffffff] text-center font-bold">{item.vehiclePlate}</Text>
        {item.id === expandedVehicle && (
          <View className="p-4 rounded mb-2 w-full flex-1 justify-center items-center" style={{ backgroundColor: '#4169E1' }}>
            <View className="flex-1">
              <Text className="text-[#FFFFFF] text-lg">Scanned At: {scanDate}</Text>
              <Text className={`text-2xl font-bold mt-2 ${
                item.registrationStatus === 'Registered'
                  ? 'text-[#ffffff] bg-[#2ECC71] bg-opacity-20 p-2 rounded'
                  : 'text-[#ffffff] bg-[#E74C3C] bg-opacity-20 p-2 rounded'
              }`}>
                Registration Status: {item.registrationStatus}
              </Text>
              <TouchableOpacity 
                onPress={handleDelete}
                className="bg-red-500 p-2 rounded mt-4"
              >
                <Text className="text-white text-center">DELETE HISTORY</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const handleBack = () => {
    router.push('main');
  };

  return (
    <View className="flex-1 justify-center items-center" style={{ backgroundColor: '#fff', padding: 16 }}>
      <View className="w-full flex-row items-center justify-between mt-12 px-4">
        <TouchableOpacity onPress={handleBack} className="p-2">
          <Ionicons name="arrow-back" size={30} color="#4169E1" />
        </TouchableOpacity>
        <Text className="text-4xl text-[#4169E1] font-bold">HISTORY</Text>
        <View className="w-10" />
      </View>
      <FlatList
        data={scannedVehicles}
        renderItem={renderVehicle}
        keyExtractor={item => item.id}
        className="w-full mt-4"
      />
    </View>
  );
};

export default History;