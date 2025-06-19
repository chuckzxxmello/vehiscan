import { collection, query, where, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const checkVehicleNotifications = (db, auth, setModalVisible, setNotificationMessage) => {
  const user = auth.currentUser;
  if (!user || user.email === 'rekrek@gmail.com') return;

  const vehiclesCollectionRef = collection(db, 'vehicles');
  const q = query(vehiclesCollectionRef, where('userId', '==', user.uid));

  onSnapshot(q, (querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Vehicle data:', data);
      handleNotifications(data.lastRenewal, data.licensePlate, setModalVisible, setNotificationMessage);
    });
  });

  AsyncStorage.setItem('lastLogin', new Date().toISOString());
};

const handleNotifications = async (lastRenewal, licensePlate, setModalVisible, setNotificationMessage) => {
  const today = new Date();
  const renewalDate = new Date(lastRenewal);
  const oneMonthBefore = new Date(renewalDate);
  oneMonthBefore.setMonth(oneMonthBefore.getMonth() - 1);

  const sevenDaysBefore = new Date(renewalDate);
  sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);

  const fiveDaysBefore = new Date(renewalDate);
  fiveDaysBefore.setDate(fiveDaysBefore.getDate() - 5);

  const lastLogin = await AsyncStorage.getItem('lastLogin');
  const lastLoginDate = lastLogin ? new Date(lastLogin) : null;

  console.log('Checking notifications:', { today, oneMonthBefore, sevenDaysBefore, fiveDaysBefore, lastLoginDate });

  if (today >= oneMonthBefore) {
    if (!lastLoginDate || lastLoginDate < new Date(today.getFullYear(), today.getMonth(), 1)) { 
      setModalVisible(true);
      setNotificationMessage(`Your vehicle with plate number ${licensePlate} registration is due in one month.`);
      console.log('Notification for one month before due date');
    }
  }

  if (today >= sevenDaysBefore) {
    if (!lastLoginDate || lastLoginDate < new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)) { 
      setModalVisible(true);
      setNotificationMessage(`Your vehicle with plate number ${licensePlate} registration is due in 7 days.`);
      console.log('Notification for seven days before due date');
    }
  }

  if (today >= fiveDaysBefore) {
    for (let i = 0; i < 5; i++) {
      const notificationDate = new Date(fiveDaysBefore);
      notificationDate.setDate(notificationDate.getDate() + i);
      if (!lastLoginDate || lastLoginDate < notificationDate) { 
        setModalVisible(true);
        setNotificationMessage(`Your vehicle with plate number ${licensePlate} registration is due in ${5 - i} days.`);
        console.log(`Notification for ${5 - i} days before due date`);
      }
    }
  }

  if (setModalVisible) {
    await AsyncStorage.setItem('lastLogin', new Date().toISOString());
  }
};

export default checkVehicleNotifications;