import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal, Animated, Dimensions, ScrollView, AppState } from 'react-native';
import { vehiclesCollection, db, app, auth } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import Fontisto from '@expo/vector-icons/Fontisto';
import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Link, useRouter } from 'expo-router';
import { doc, getDoc, addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { checkVehicleNotifications } from './notification';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/authContext';
import { checkRateLimit, logSecurityEvent, showSecurityAlert } from '../utils/securityUtils';

const SCREEN_WIDTH = Dimensions.get('window').width;

const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes in ms

const Main = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [scannedData, setScannedData] = useState(null);
  const [vehicleData, setVehicleData] = useState(null);
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnim] = useState(new Animated.Value(-SCREEN_WIDTH));
  const insets = useSafeAreaInsets ? useSafeAreaInsets() : { top: 0 };
  const { user } = useAuth();

  const firebase = app;
  const firestore = db;

  const inactivityTimer = React.useRef(null);
  const [inactiveModalVisible, setInactiveModalVisible] = useState(false);

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setInactiveModalVisible(true); // Show modal instead of logging out immediately
    }, INACTIVITY_LIMIT);
  };

  // Listen for app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        resetInactivityTimer();
      } else if (nextAppState === 'background') {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      }
    });
    return () => subscription.remove();
  }, []);

  // Listen for user interaction
  useEffect(() => {
    resetInactivityTimer();
    // Add your touch/scroll listeners here if needed
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  // Handler for modal OK button
  const handleInactiveOk = async () => {
    setInactiveModalVisible(false);
    await handleLogout();
  };

  useEffect(() => {
    // Request camera permissions
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    checkVehicleNotifications(db, auth, setModalVisible, setNotificationMessage);
  }, []);

  // Slide in/out menu animation
  useEffect(() => {
    Animated.timing(menuAnim, {
      toValue: menuVisible ? 0 : -SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [menuVisible]);

  useEffect(() => {
    // Check if user is authenticated before setting up listener
    if (!auth.currentUser) {
      setLoadingHistory(false);
      return;
    }

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
      setHistory(scans);
      setLoadingHistory(false);
    }, (error) => {
      console.error('Error fetching scan history:', error);
      setLoadingHistory(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  // Process any QR code with FREE CLIENT-SIDE RATE LIMITING
  const processAnyQRCode = async (type, data) => {
    // Check if user is authenticated
    if (!auth.currentUser) {
      Alert.alert('Authentication Required', 'Please log in to scan QR codes.');
      setScanned(false);
      return;
    }

    let shouldProceedWithScan = false;
    
    try {
      // PRIMARY SECURITY: FREE Client-side rate limiting (10 scans per hour)
      const isAllowed = await checkRateLimit(
        auth.currentUser.uid,
        'scan',
        10, // 10 scans maximum
        60 * 60 * 1000 // per hour (3600000 ms)
      );

      if (!isAllowed) {
        // Rate limit exceeded - user already notified by checkRateLimit function with AM/PM format
        setScanned(false);
        logSecurityEvent('rate_limit_exceeded', {
          userId: auth.currentUser.uid,
          action: 'scan',
          timestamp: new Date().toISOString()
        });
        return;
      }

      shouldProceedWithScan = true;
      
    } catch (error) {
      console.error('Rate limit error:', error);
      // Allow scan to proceed with client-side protection
      shouldProceedWithScan = true;
    }

    // Process the scan if allowed
    if (shouldProceedWithScan) {
      try {
        setScanned(true);

        // Log successful scan attempt
        logSecurityEvent('scan_attempt', {
          userId: auth.currentUser.uid,
          qrData: data.substring(0, 50) + '...', // Log partial data for security
          timestamp: new Date().toISOString()
        });

        // Extract Firestore doc ID from QR code value
        let docId = data;
        if (docId.startsWith('vehiscan://vehicle/')) {
          docId = docId.split('vehiscan://vehicle/')[1];
        }

        const vehicleDoc = await getDoc(doc(db, 'vehicles', docId));
        if (vehicleDoc.exists()) {
          const vehicle = vehicleDoc.data();
        
          // Calculate registration status
          const today = new Date();
          const lastRenewal = new Date(vehicle.lastRenewal);
          const monthsDifference = (today.getFullYear() - lastRenewal.getFullYear()) * 12 + 
            (today.getMonth() - lastRenewal.getMonth());
        
          const registrationStatus = monthsDifference >= 12 ? 'Expired' : 'Registered';
        
          // Store scan data in Firestore (AUDIT TRAIL)
          await addDoc(collection(db, 'scannedVehicles'), {
            vehicleId: docId,
            userId: auth.currentUser.uid,
            scannedAt: new Date().toISOString(),
            vehiclePlate: vehicle.licensePlate,
            registrationStatus,
            scanMethod: 'qr_camera', // Track scan method for analytics
          });

          // Log successful vehicle lookup
          logSecurityEvent('vehicle_found', {
            vehicleId: docId,
            licensePlate: vehicle.licensePlate,
            registrationStatus,
            userId: auth.currentUser.uid
          });

          setVehicleData({
            ...vehicle,
            registrationStatus
          });
          setScannedData(data);
          setModalVisible(true);
        } else {
          // Log failed vehicle lookup
          logSecurityEvent('vehicle_not_found', {
            qrData: data,
            userId: auth.currentUser.uid
          });
          
          Alert.alert('Vehicle Not Found', 'No vehicle found with this QR code.');
          setScanned(false);
        }
      } catch (error) {
        console.error('Error fetching vehicle data:', error);
        
        // Log scan processing error
        logSecurityEvent('scan_processing_error', {
          error: error.message,
          userId: auth.currentUser?.uid || 'unknown'
        });
        
        Alert.alert('Error', 'Failed to fetch vehicle information.');
        setScanned(false);
      }
    }
  };

  const handleProfile = () => {
    router.push('profile');
  };

  const handleAddVehicle = () => {
    router.push('addVehicle');
  };

  const handleVehicle = () => {
    router.push('vehicles');
  };

  const handleHistory = () => {
    router.push('history');
  };

  const handleLogout = async () => {
    try {
      if (auth.currentUser) {
        logSecurityEvent('user_logout', {
          userId: auth.currentUser.uid,
          timestamp: new Date().toISOString()
        });
      }
      
      await signOut(auth);
      router.replace('login');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Handle camera permissions
  if (!permission) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F5F6FA]">
        <Text style={{ color: '#4169E1' }}>Requesting camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center p-4 bg-[#F5F6FA]">
        <Text style={{ color: '#4169E1' }} className="text-center mb-4">
          Camera permission is required to scan QR codes
        </Text>
        <TouchableOpacity 
          className="p-4 rounded-lg"
          style={{ backgroundColor: '#4169E1' }}
          onPress={requestPermission}
        >
          <Text className="text-white font-bold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView 
        className="flex-1 bg-[#F5F6FA]" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header Section */}
        <View className="flex-row justify-between items-center p-4 bg-[#4169E1] rounded-b-3xl">
          <TouchableOpacity onPress={handleProfile}>
            <Ionicons name="person" size={30} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-[#ffffff]">VehiScan</Text>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <View className="bg-transparent w-11 h-11 rounded-full flex items-center justify-center">
              <Entypo name="menu" size={40} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Slide-in Menu */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: SCREEN_WIDTH * 0.8,
            height: '100%',
            backgroundColor: '#D1D5DB',
            zIndex: 100,
            transform: [{ translateX: menuAnim }],
            paddingTop: insets.top + 32,
            paddingHorizontal: 24,
          }}
        >
          <TouchableOpacity onPress={() => setMenuVisible(false)} style={{ alignSelf: 'flex-end', marginBottom: 32 }}>
            <Entypo name="cross" size={36} color="#4169E1" />
          </TouchableOpacity>
          <View style={{ gap: 16 }}>
            {/* Only show Add Vehicle button for admin */}
             {user?.isAdmin && (
              <View style={{ marginBottom: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    setMenuVisible(false);
                    handleAddVehicle();
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#4169E1',
                    borderRadius: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                  }}
                >
                  <Ionicons name="add" size={28} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 24, marginLeft: 16, fontWeight: 'bold' }}>ADD VEHICLE</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={{ marginBottom: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  handleVehicle();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#4169E1',
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                }}
              >
                <Ionicons name="car" size={28} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 24, marginLeft: 16, fontWeight: 'bold' }}>MY VEHICLES</Text>
              </TouchableOpacity>
            </View>
            <View>
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  handleHistory();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#4169E1',
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                }}
              >
                <Ionicons name="time-outline" size={28} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 24, marginLeft: 16, fontWeight: 'bold' }}>RECENT SCANS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Overlay when menu is open */}
        {menuVisible && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.3)',
              zIndex: 99,
            }}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
        )}

        {/* QR Code Scanner*/}
        <View className="items-center mt-6">
          <View
            className="bg-darkgray rounded-xl items-center justify-center"
            style={{ width: 500, height: 500, borderRadius: 24 }}
          >
            <CameraView
              style={{ width: 300, height: 300, borderRadius: 24 }}
              facing="back"
              onBarcodeScanned={(qrcode) => {
                if (!scanned) {
                  processAnyQRCode(qrcode.type, qrcode.data);
                }
              }}
            />
            {scanned && (
              <TouchableOpacity onPress={() => setScanned(false)} className="mt-5 p-2 bg-white rounded">
                <Text className="text-black">SCAN AGAIN</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* COMPLETELY FIXED Last Scanned - Proper Rectangular Container with Date Display */}
        <View className="items-center mt-6 px-4" style={{ marginBottom: 40 }}>
          <View
            style={{ 
              backgroundColor: '#4169E1',
              borderRadius: 12, // More rectangular shape
              padding: 24,
              width: '100%',
              maxWidth: 380,
              minHeight: 220,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 6,
              },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 10, // Android shadow
            }}
          >
            <Text 
              style={{ 
                fontSize: 28,
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: 20
              }}
            >
              Last Scan
            </Text>
            
            {loadingHistory ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 140 }}>
                <Text style={{ textAlign: 'center', color: '#ffffff', fontSize: 18 }}>Loading...</Text>
              </View>
            ) : history.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 140 }}>
                <Text style={{ textAlign: 'center', color: '#ffffff', fontSize: 18 }}>No scan history yet.</Text>
              </View>
            ) : (
              (() => {
                const item = history
                  .sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt))[0];
              
                if (!item) {
                  return (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 140 }}>
                      <Text style={{ textAlign: 'center', color: '#ffffff', fontSize: 18 }}>No recent scans found.</Text>
                    </View>
                  );
                }

                // FIXED: Enhanced date formatting with proper AM/PM format
                let scanDate = 'Date unavailable';
                try {
                  if (item.scannedAt) {
                    const date = new Date(item.scannedAt);
                    if (!isNaN(date.getTime())) {
                      scanDate = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true // This ensures AM/PM format
                      });
                    }
                  }
                } catch (error) {
                  console.error('Date formatting error:', error);
                  scanDate = 'Invalid date';
                }

                return (
                  <View style={{ minHeight: 160 }}>
                    {/* Vehicle Information */}
                    <View style={{ marginBottom: 20 }}>
                      <Text 
                        style={{ 
                          color: '#2ECC71',
                          fontWeight: 'bold',
                          fontSize: 26,
                          marginBottom: 8
                        }}
                      >
                        {item.vehiclePlate || 'Unknown Plate'}
                      </Text>
                      <Text 
                        style={{
                          fontWeight: 'bold',
                          fontSize: 20,
                          color: item.registrationStatus === 'Registered' ? '#A7F3D0' : '#FCA5A5'
                        }}
                      >
                        {item.registrationStatus || 'Unknown Status'}
                      </Text>
                    </View>
                    
                    {/* PROPERLY FIXED DATE DISPLAY - Bottom Right with Border */}
                    <View style={{ 
                      borderTopWidth: 1,
                      borderTopColor: 'rgba(255, 255, 255, 0.3)',
                      paddingTop: 16,
                      marginTop: 'auto'
                    }}>
                      <Text 
                        style={{ 
                          color: '#ffffff',
                          fontSize: 14,
                          textAlign: 'right',
                          opacity: 0.9,
                          fontWeight: '500'
                        }}
                      >
                        Scanned: {scanDate}
                      </Text>
                    </View>
                  </View>
                );
              })()
            )}
          </View>
        </View>

        {/* QR Code Scan Result Modal */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setModalVisible(false);
            setScanned(false);
          }}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View
              className="bg-[#4169E1] rounded-xl items-center"
              style={{ width: 400, minHeight: 300, borderRadius: 24, padding: 24, justifyContent: 'flex-start' }}
            >
              <Text className="text-5xl font-extrabold text-white mb-6 text-left w-full">Vehicle Details</Text>
              {vehicleData && (
                <>
                  <Text className="text-white mb-4 font-extrabold text-4xl w-full">Plate Number: {vehicleData.licensePlate}</Text>
                  <Text
                    className={`font-extrabold mb-6 text-3xl w-full ${
                      vehicleData.registrationStatus === 'Registered' ? 'text-green-300' : 'text-red-300'
                    }`}
                  >
                    Status: {vehicleData.registrationStatus}
                  </Text>
                </>
              )}

              <TouchableOpacity
                className="bg-[#D1D5DB] p-4 rounded-lg mt-auto w-full"
                onPress={() => {
                  setModalVisible(false);
                  setScanned(false);
                  setVehicleData(null);
                  setScannedData(null);
                }}
              >
                <Text className="text-[#4169E1] text-center font-bold text-2xl">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Notification Modal */}
        {notificationMessage && (
          <Modal
            visible={!!notificationMessage}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setNotificationMessage('')}
          >
            <View className="flex-1 justify-center items-center bg-black/50">
              <View className="p-6 rounded-lg w-[80%] max-w-sm border" style={{ backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }}>
                <Text className="text-lg font-bold mb-4" style={{ color: '#92400E' }}>Notification</Text>
                <Text className="mb-4" style={{ color: '#78350F' }}>{notificationMessage}</Text>
                
                <TouchableOpacity 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: '#D97706' }}
                  onPress={() => setNotificationMessage('')}
                >
                  <Text className="text-white text-center font-bold">OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>

      {/* Inactivity Modal */}
      <Modal
        visible={inactiveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInactiveModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 12,
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 18, marginBottom: 16 }}>Inactive</Text>
            <Text style={{ marginBottom: 24, textAlign: 'center' }}>
              You have been inactive for 5 minutes.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#727D73',
                paddingVertical: 10,
                paddingHorizontal: 24,
                borderRadius: 8
              }}
              onPress={handleInactiveOk}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default Main;