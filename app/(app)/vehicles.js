import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, ToastAndroid, PermissionsAndroid, Modal, TextInput} from 'react-native';
import { vehiclesCollection, db, app, auth } from '../../firebaseConfig';
import { collection, onSnapshot, query, where, doc, getDocs, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/authContext';
import QRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

const Vehicles = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [chassisNumber, setChassisNumber] = useState('');
  const [expandedVehicle, setExpandedVehicle] = useState(null);
  const [scannedVehicles, setScannedVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const qrRef = useRef(null);
  const router = useRouter();

  const { user } = useAuth();
  const firebase = app;
  const firestore = db;

  useEffect(() => {
    let unsubscribe;

    const fetchVehicles = async () => {
      try {
        const vehiclesCollectionRef = collection(db, 'vehicles');
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const userData = userDoc.data();
        const userCode = userData.code;
    
        // Query that combines main vehicle and added vehicles
        const vehiclesQuery = query(
          vehiclesCollectionRef, 
          where('chassisNumber', 'in', [userCode, ...userData.addedVehicles || []])
        );
    
        unsubscribe = onSnapshot(vehiclesQuery, (querySnapshot) => {
          const vehicles = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const status = getRegistrationStatus(data.lastRenewal);
            vehicles.push({
              ...data,
              id: doc.id,
              registrationStatus: status
            });
          });
          setVehicles(vehicles);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        setLoading(false);
      }
    };
    
    fetchVehicles();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const getRegistrationStatus = (lastRenewal) => {
    if (!lastRenewal) return 'Invalid';
    
    const today = new Date();
    const renewalDate = new Date(lastRenewal);
    
    // Calculate difference in years
    const yearDiff = today.getFullYear() - renewalDate.getFullYear();
    const monthDiff = today.getMonth() - renewalDate.getMonth();
    const dayDiff = today.getDate() - renewalDate.getDate();

    if (yearDiff > 1 || (yearDiff === 1 && (monthDiff > 0 || (monthDiff === 0 && dayDiff > 0)))) {
      return 'Expired';
    }
    return 'Valid';
  };

  const handleAddVehicle = async () => {
    try {
      const vehiclesCollectionRef = collection(db, 'vehicles');
      const vehiclesQuery = query(
        vehiclesCollectionRef, 
        where('chassisNumber', '==', chassisNumber)
      );
      
      const querySnapshot = await getDocs(vehiclesQuery);
      if (!querySnapshot.empty) {
        // Update user's document with the new vehicle
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        
        // Create or update addedVehicles array
        const addedVehicles = userData.addedVehicles || [];
        if (!addedVehicles.includes(chassisNumber)) {
          addedVehicles.push(chassisNumber);
          await updateDoc(userDocRef, {
            addedVehicles: addedVehicles
          });
        }
        
        setModalVisible(false);
        setChassisNumber('');
        ToastAndroid.show('Vehicle added successfully', ToastAndroid.SHORT);
      } else {
        Alert.alert('Vehicle not found', 'Please check the chassis number');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add vehicle');
    }
  };

  const renderVehicle = ({ item }) => (
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
      <Text className="text-2xl text-[#ffffff] text-center font-bold">
        {item.licensePlate} - {item.make}
      </Text>
      {item.id === expandedVehicle && (
        <View className="p-4 rounded mb-2 w-full flex-1 justify-center items-center" style={{ backgroundColor: '#4169E1' }}>
          <View className="flex-1">
            <Text className="text-[#ffffff] text-lg">Vehicle ID: {item.id}</Text>
            <Text className="text-[#ffffff] text-lg">Owner Name: {item.ownerName}</Text>
            <Text className="text-[#ffffff] text-lg">License Plate: {item.licensePlate}</Text>
            <Text className="text-[#ffffff] text-lg">Make: {item.make}</Text>
            <Text className="text-[#ffffff] text-lg">Year Model: {item.yearModel}</Text>
            <Text className="text-[#ffffff] text-lg">Color: {item.color}</Text>
            <Text className="text-[#ffffff] text-lg">Body Type: {item.bodyType}</Text>
            <Text className="text-[#ffffff] text-lg">Chassis Number: {item.chassisNumber}</Text>
            <Text className="text-[#ffffff] text-lg">Engine Number: {item.engineNumber}</Text>
            <Text className="text-[#ffffff] text-lg">Fuel: {item.fuel}</Text>
            <Text className="text-[#ffffff] text-lg">Gross Weight: {item.grossWt}</Text>
            <Text className="text-[#ffffff] text-lg">Net Weight: {item.netWt}</Text>
            <Text className="text-[#ffffff] text-lg">Net Capacity: {item.netCapacity}</Text>
            <Text className="text-[#ffffff] text-lg">Piston Displacement: {item.pistonDisplacement}</Text>
            <Text className="text-[#ffffff] text-lg">Series: {item.series}</Text>
            <Text className="text-[#ffffff] text-lg">Registration Month: {item.registrationMonth}</Text>
            <Text className="text-[#ffffff] text-lg">
              Last Renewal: {new Date(item.lastRenewal).toLocaleDateString()}
            </Text>
            <Text
              className={`text-2xl font-bold mt-2 ${
                getRegistrationStatus(item.lastRenewal) === 'Valid'
                  ? 'text-[#ffffff] bg-[#2ECC71] bg-opacity-20 p-2 rounded'
                  : 'text-[#ffffff] bg-[#E74C3C] bg-opacity-20 p-2 rounded'
              }`}
            >
              Registration Status: {getRegistrationStatus(item.lastRenewal)}
            </Text>
            <View className="items-center justify-center my-4">
              <QRCode
                value={item.id}
                size={200}
                color="#000"
                backgroundColor="#fff"
                getRef={(ref) => (qrRef.current = ref)}
              />
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const handleBack = () => {
    router.push('main');
  };

  return (
    <View className="flex-1 justify-center items-center" style={{ backgroundColor: '#D1D5DB', padding: 16 }}>
      <View className="w-full flex-row items-center justify-between mt-12 px-4">
        <TouchableOpacity onPress={handleBack} className="p-2">
          <Ionicons name="arrow-back" size={30} color="#4169E1" />
        </TouchableOpacity>
        <Text className="text-4xl text-[#4169E1] font-bold">MY VEHICLES</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} className="p-2">
          <Ionicons name="add-circle" size={30} color="#4169E1" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#4169E1" />
      ) : (
        <FlatList
          data={vehicles} 
          renderItem={renderVehicle}
          keyExtractor={item => item.id}
          className="w-full mt-4"
        />
      )}

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-[#D1D5DB] p-6 rounded-lg w-[90%]">
            <Text className="text-2xl text-[#4169E1] font-bold mb-4">Add Vehicle</Text>
            
            <TextInput
              className="w-full border border-gray-400 rounded-lg p-4 mb-4 bg-[#F5F6FA]"
              placeholder="Chassis Number"
              value={chassisNumber}
              onChangeText={(text) => setChassisNumber(text.toUpperCase())}
              autoCapitalize="characters"
            />

            <View className="flex-row justify-end">
              <TouchableOpacity 
                onPress={() => {
                  setModalVisible(false);
                  setChassisNumber('');
                }}
                className="bg-gray-500 p-4 rounded-lg mr-2"
              >
                <Text className="text-white">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleAddVehicle}
                className="bg-[#4169E1] p-4 rounded-lg"
              >
                <Text className="text-white">Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Vehicles;