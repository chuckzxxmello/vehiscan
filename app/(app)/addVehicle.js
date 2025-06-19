import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { vehiclesCollection, db, app, auth } from '../../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import { addDoc } from 'firebase/firestore';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { sanitizeInput, validateVehicleForm, sanitizeVehicleForm, showValidationAlert } from '../utils/securityUtils';

const AddVehicle = () => {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState('');
  const qrRef = useRef(null);

  const router = useRouter();
  
  const handleBack = () => {
    router.back();
  };

  const firebase = app;
  const firestore = db;

  useEffect(() => {
    const vehiclesCollectionRef = collection(firestore, 'vehicles');

    const unsubscribe = onSnapshot(vehiclesCollectionRef, (querySnapshot) => {
      const vehicles = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        vehicles.push({
          id: doc.id, 
          ...data,
        });
      });
      console.log(vehicles);
      setVehicles(vehicles);
    });

    return () => unsubscribe();
  }, []);

  const [vehicleInfo, setVehicleInfo] = useState({
    licensePlate: '', 
    make: '', 
    yearModel: '',  
    bodyType: '',
    chassisNumber: '',
    engineNumber: '',
    color: '',
    fuel: '',
    grossWt: '',
    netWt: '',
    netCapacity: '',
    pistonDisplacement: '',
    series: '',
    ownerName: '',
    lastRenewal: '',
  });

  const handleInputChange = (field, value) => {
    // Sanitize input before setting state (YOUR SECURITY FEATURE)
    const sanitizedValue = sanitizeInput(value);
    // For owner name, preserve normal case and spaces
    if (field === 'ownerName') {
      setVehicleInfo({ ...vehicleInfo, [field]: sanitizedValue });
    } else {
    // For other fields, convert to uppercase
      setVehicleInfo({ ...vehicleInfo, [field]: sanitizedValue.toUpperCase() });
    }
  };

  const getMonthFromPlateNumber = (licensePlate) => {
    const lastNumber = parseInt(licensePlate.slice(-1));
    const months = [
      "October", "January", "February", "March", "April", 
      "May", "June", "July", "August",
      "September"
    ];
    return months[lastNumber % 12];
  };

  const handleSubmit = async () => {
    // Check for empty fields
    if (Object.values(vehicleInfo).some(value => value === '')) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // YOUR SECURITY: Sanitize all form data
    const sanitizedVehicleInfo = sanitizeVehicleForm(vehicleInfo);

    // YOUR SECURITY: Validate all form data
    const validation = validateVehicleForm(sanitizedVehicleInfo);
    if (!validation.isValid) {
      showValidationAlert(validation.errors);
      return;
    }

    try {
      const registrationMonth = getMonthFromPlateNumber(sanitizedVehicleInfo.licensePlate);
      const vehicleData = {
        ...sanitizedVehicleInfo,
        userId: auth.currentUser.uid,
        registrationMonth: registrationMonth,
        createdAt: new Date().toISOString(),
        lastRenewal: new Date(sanitizedVehicleInfo.lastRenewal).toISOString()
      };

      const docRef = await addDoc(collection(db, 'vehicles'), vehicleData);
      setQrCodeValue(`vehiscan://vehicle/${docRef.id}`);
      setModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'There was an error submitting your vehicle information.');
      console.error('Error adding vehicle: ', error);
    }
  };

  const saveQrToDisk = async () => {
    if (qrRef.current) {
      qrRef.current.toDataURL(async (data) => {
        const path = `${FileSystem.documentDirectory}qrcode.png`;
        await FileSystem.writeAsStringAsync(path, data, { encoding: FileSystem.EncodingType.Base64 });

        const asset = await MediaLibrary.createAssetAsync(path);
        await MediaLibrary.createAlbumAsync('Download', asset, false)
          .then(() => {
            Alert.alert('Success', 'QR Code saved to gallery');
          })
          .catch((err) => {
            console.error('Error saving QR Code:', err);
            Alert.alert('Failed to save QR Code');
          });
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="flex-1" style={{ backgroundColor: '#D1D5DB' }}>
        <View className="absolute top-12 left-4 z-10">
          <TouchableOpacity onPress={handleBack} className="p-2">
            <Ionicons name="arrow-back" size={30} color="#4169E1" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 justify-center items-center p-4 mt-16">
          <Text className="text-2xl font-bold mb-8" style={{ color: '#4169E1' }}>Add Vehicle</Text>
          
          <Text className="font-bold mb-2" style={{ color: '#4169E1' }}>Vehicle Information</Text>
          <TextInput
            className="w-full max-w-md border border-gray-400 rounded-lg p-4 mb-4 text-base"
            style={{ backgroundColor: '#F5F6FA', color: '#22223b' }}
            placeholder="Owner Name (full name)"
            placeholderTextColor="#A0A0A0"
            value={vehicleInfo.ownerName}
            onChangeText={(value) => handleInputChange('ownerName', value)}
            autoCapitalize="characters"
          />
          <TextInput
            className="w-full max-w-md border border-gray-400 rounded-lg p-4 mb-4 text-base"
            style={{ backgroundColor: '#F5F6FA', color: '#22223b' }}
            placeholder="License Plate"
            placeholderTextColor="#A0A0A0"
            value={vehicleInfo.licensePlate}
            onChangeText={(value) => handleInputChange('licensePlate', value)}
            autoCapitalize="characters"
          />
          <View className="flex-row w-full max-w-md mb-4">
            <TextInput
              className="flex-1 border border-gray-400 rounded-lg p-4 text-base mr-2"
              style={{ backgroundColor: '#F5F6FA', color: '#22223b' }}
              placeholder="Make"
              placeholderTextColor="#A0A0A0"
              value={vehicleInfo.make}
              onChangeText={(value) => handleInputChange('make', value)}
              autoCapitalize="characters"
            />
            <TextInput
              className="flex-1 border border-gray-400 rounded-lg p-4 text-base"
              style={{ backgroundColor: '#F5F6FA', color: '#22223b' }}
              placeholder="Year Model"
              placeholderTextColor="#A0A0A0"
              value={vehicleInfo.yearModel}
              onChangeText={(value) => handleInputChange('yearModel', value)}
              autoCapitalize="characters"
              keyboardType="numeric"
            />
          </View>
          <View className="flex-row w-full max-w-md mb-4">
            <TextInput
              className="flex-1 border border-gray-400 rounded-lg p-4 text-base mr-2"
              style={{ backgroundColor: '#F5F6FA', color: '#22223b' }}
              placeholder="Body Type"
              placeholderTextColor="#A0A0A0"
              value={vehicleInfo.bodyType}
              onChangeText={(value) => handleInputChange('bodyType', value)}
              autoCapitalize="characters"
            />
            <TextInput
              className="flex-1 border border-gray-400 rounded-lg p-4 text-base"
              style={{ backgroundColor: '#F5F6FA', color: '#22223b' }}
              placeholder="Chassis Number"
              placeholderTextColor="#A0A0A0"
              value={vehicleInfo.chassisNumber}
              onChangeText={(value) => handleInputChange('chassisNumber', value)}
              autoCapitalize="characters"
            />
          </View>
          <View className="flex-row w-full max-w-md mb-4">
            <TextInput
              className="flex-1 border border-gray-400 rounded-lg p-4 text-base mr-2"
              style={{ backgroundColor: '#F5F6FA', color: '#22223b' }}
              placeholder="Engine Number"
              placeholderTextColor="#A0A0A0"
              value={vehicleInfo.engineNumber}
              onChangeText={(value) => handleInputChange('engineNumber', value)}
              autoCapitalize="characters"
            />
            <TextInput
              className="flex-1 border border-gray-400 rounded-lg p-4 text-base"
              style={{ backgroundColor: '#F5F6FA', color: '#22223b' }}
              placeholder="Fuel"
              placeholderTextColor="#A0A0A0"
              value={vehicleInfo.fuel}
              onChangeText={(value) => handleInputChange('fuel', value)}
              autoCapitalize="characters"
            />
          </View>
          <TextInput
            className="w-full max-w-md border border-gray-400 rounded-lg p-4 mb-4 text-base"
            style={{ backgroundColor: '#F5F6FA', color: '#22223b' }}
            placeholder="Color"
            placeholderTextColor="#A0A0A0"
            value={vehicleInfo.color}
            onChangeText={(value) => handleInputChange('color', value)}
            autoCapitalize="characters"
          />
          <TextInput
            className="w-full max-w-md border border-gray-400 rounded-lg p-4 mb-4 text-base"
            style={{ backgroundColor: '#F5F6FA', color: '#22223b' }}
            placeholder="Gross Weight"
            placeholderTextColor="#A0A0A0"
            value={vehicleInfo.grossWt}
            onChangeText={(value) => handleInputChange('grossWt', value)}
            autoCapitalize="characters"
            keyboardType="numeric"
          />
          <View className="flex-row w-full max-w-md mb-4">
            <TextInput
              className="flex-1 border border-gray-400 rounded-lg p-4 text-base mr-2"
              style={{ backgroundColor: '#F5F6FA', color: '#22223b' }}
              placeholder="Net Weight"
              placeholderTextColor="#A0A0A0"
              value={vehicleInfo.netWt}
              onChangeText={(value) => handleInputChange('netWt', value)}
              autoCapitalize="characters"
              keyboardType="numeric"
            />
            <TextInput
              className="flex-1 border border-gray-400 rounded-lg p-4 text-base"
              style={{ backgroundColor: '#F5F6FA', color: '#22223b' }}
              placeholder="Net Capacity"
              placeholderTextColor="#A0A0A0"
              value={vehicleInfo.netCapacity}
              onChangeText={(value) => handleInputChange('netCapacity', value)}
              autoCapitalize="characters"
              keyboardType="numeric"
            />
          </View>
          <View className="flex-row w-full max-w-md mb-4">
            <TextInput
              className="flex-1 border border-gray-400 rounded-lg p-4 text-base"
              style={{ backgroundColor: '#F5F6FA', color: '#22223b' }}
              placeholder="Piston Displacement"
              placeholderTextColor="#A0A0A0"
              value={vehicleInfo.pistonDisplacement}
              onChangeText={(value) => handleInputChange('pistonDisplacement', value)}
              autoCapitalize="characters"
              keyboardType="numeric"
            />
          </View>
          <TextInput
            className="w-full max-w-md border border-gray-400 rounded-lg p-4 mb-4 text-base"
            style={{ backgroundColor: '#F5F6FA', color: '#22223b' }}
            placeholder="Series"
            placeholderTextColor="#A0A0A0"
            value={vehicleInfo.series}
            onChangeText={(value) => handleInputChange('series', value)}
            autoCapitalize="characters"
          />
          <Text className="font-bold mb-2" style={{ color: '#4169E1' }}>Last Renewal Date</Text>
          <TextInput
            className="w-full max-w-md border border-gray-400 rounded-lg p-4 mb-4 text-base"
            style={{ backgroundColor: '#F5F6FA', color: '#22223b' }}
            placeholder="Last Renewal (YYYY-MM-DD)"
            placeholderTextColor="#A0A0A0"
            value={vehicleInfo.lastRenewal}
            onChangeText={(value) => handleInputChange('lastRenewal', value)}
          />

          <TouchableOpacity
            className="w-full max-w-md rounded-lg p-4 mb-4"
            style={{ backgroundColor: '#4169E1' }}
            onPress={handleSubmit}
          >
            <Text className="text-center font-bold" style={{ color: '#fff' }}>Submit</Text>
          </TouchableOpacity>

          <Modal visible={modalVisible} transparent={true}>
            <View className="flex-1 justify-center items-center bg-black/50 p-4">
              <Text className="text-2xl font-bold mb-8" style={{ color: '#4169E1' }}>Generated QR Code</Text>
              <QRCode 
                value={qrCodeValue}
                size={200}
                color="#000"
                backgroundColor="#fff"
                getRef={(ref) => (qrRef.current = ref)}
              />
              <TouchableOpacity 
                  className="w-full max-w-md rounded-lg p-4 mb-4"
                  style={{ backgroundColor: '#4169E1' }}
                  onPress={() => { saveQrToDisk() }}>
                <Text className="margin-top-2 text-center font-bold" style={{ color: '#fff' }}>Save to Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="w-full max-w-md rounded-lg p-4 mb-4"
                style={{ backgroundColor: '#4169E1' }}
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-center font-bold" style={{ color: '#fff' }}>Back</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddVehicle;