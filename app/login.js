import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, Pressable, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { getAuth, signInWithEmailAndPassword, sendEmailVerification, reload, signOut, sendPasswordResetEmail } from 'firebase/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  const LOCKOUT_DURATION = 10 * 60 * 1000; // 10 minutes
  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    if (email.trim()) {
      checkLockoutStatus(email.trim().toLowerCase());
    }
  }, [email]);

  useEffect(() => {
    let interval;
    if (isLocked && lockTimeRemaining > 0) {
      interval = setInterval(() => {
        setLockTimeRemaining(prev => {
          if (prev <= 1000) {
            setIsLocked(false);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockTimeRemaining]);

  const checkLockoutStatus = async (sanitizedEmail) => {
    try {
      const lockoutData = await AsyncStorage.getItem(`lockout_${sanitizedEmail}`);
      if (lockoutData) {
        const { lockoutTime, attempts } = JSON.parse(lockoutData);
        const now = Date.now();
        const timeSinceLockout = now - lockoutTime;

        if (timeSinceLockout < LOCKOUT_DURATION && attempts >= MAX_ATTEMPTS) {
          setIsLocked(true);
          setLockTimeRemaining(LOCKOUT_DURATION - timeSinceLockout);
        } else if (timeSinceLockout >= LOCKOUT_DURATION) {
          await AsyncStorage.removeItem(`lockout_${sanitizedEmail}`);
        }
      }
    } catch (error) {
      console.error('Error checking lockout status:', error);
    }
  };

  const getFailedAttempts = async (sanitizedEmail) => {
    try {
      const lockoutData = await AsyncStorage.getItem(`lockout_${sanitizedEmail}`);
      if (lockoutData) {
        const { attempts, lockoutTime } = JSON.parse(lockoutData);
        const now = Date.now();

        if (now - lockoutTime >= LOCKOUT_DURATION) {
          await AsyncStorage.removeItem(`lockout_${sanitizedEmail}`);
          return 0;
        }
        return attempts;
      }
      return 0;
    } catch (error) {
      console.error('Error getting failed attempts:', error);
      return 0;
    }
  };

  const incrementFailedAttempts = async (sanitizedEmail) => {
    try {
      const currentAttempts = await getFailedAttempts(sanitizedEmail);
      const newAttempts = currentAttempts + 1;
      const now = Date.now();

      const existingData = await AsyncStorage.getItem(`lockout_${sanitizedEmail}`);
      let lockoutTime = now;

      if (existingData) {
        const parsed = JSON.parse(existingData);
        lockoutTime = parsed.lockoutTime || now;
      }

      await AsyncStorage.setItem(`lockout_${sanitizedEmail}`, JSON.stringify({
        attempts: newAttempts,
        lockoutTime: newAttempts >= MAX_ATTEMPTS ? now : lockoutTime
      }));

      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setLockTimeRemaining(LOCKOUT_DURATION);
        Alert.alert(
          'Account Locked',
          'Too many failed login attempts. Your account has been locked for 10 minutes.',
          [{ text: 'OK' }]
        );
        return;
      } else {
        const remainingAttempts = MAX_ATTEMPTS - newAttempts;
        Alert.alert(
          'Login Failed',
          `Invalid email or password. You have ${remainingAttempts} attempt(s) remaining before your account is locked.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error incrementing failed attempts:', error);
    }
  };

  const clearFailedAttempts = async (sanitizedEmail) => {
    try {
      await AsyncStorage.removeItem(`lockout_${sanitizedEmail}`);
    } catch (error) {
      console.error('Error clearing failed attempts:', error);
    }
  };

  const handleLogin = async () => {
    const sanitizedEmail = email.trim().toLowerCase();

    if (!sanitizedEmail || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isLocked) {
      const minutes = Math.ceil(lockTimeRemaining / 60000);
      Alert.alert(
        'Account Locked',
        `Your account is locked. Please try again in ${minutes} minute(s).`
      );
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);

      if (!userCredential.user.emailVerified) {
        await sendEmailVerification(userCredential.user);
        setPendingVerification(true);
        setCurrentUser(userCredential.user);
        Alert.alert(
          'Email Not Verified',
          'A verification email has been sent. Please verify your email before logging in.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await signOut(auth); // <-- Automatically logs out after alert
                setPendingVerification(false);
                setCurrentUser(null);
              }
            }
          ]
        );
        setLoading(false);
        return;
      }

      await clearFailedAttempts(sanitizedEmail);
      router.replace('(app)/main');
    } catch (error) {
      console.error('Login error:', error);
      await incrementFailedAttempts(sanitizedEmail);
      // Remove the generic Alert.alert('Login Failed', error.message);
      // Only incrementFailedAttempts will show the alert now
    } finally {
      setLoading(false);
    }
  };

  // Check verification status again
  const handleCheckVerification = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await reload(currentUser);
      if (currentUser.emailVerified) {
        await clearFailedAttempts(currentUser.email);
        setPendingVerification(false);
        router.replace('(app)/main');
      } else {
        Alert.alert('Not Verified', 'Your email is still not verified. Please check your inbox.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const sanitizedEmail = email.trim().toLowerCase();
    if (!sanitizedEmail) {
      Alert.alert('Reset Password', 'Please enter your email address first.');
      return;
    }
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, sanitizedEmail);
      Alert.alert('Reset Password', 'A password reset email has been sent to your email address.');
    } catch (error) {
      console.log('Password reset error:', error);
      Alert.alert('Reset Password Failed', error.message);
    }
  };

  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (pendingVerification) {
    return (
      <View className="flex-1 justify-center items-center bg-[#D0DDD0] px-4">
        <ActivityIndicator size="large" color="#727D73" />
        <Text className="text-xl text-gray-700 mt-6 mb-2 text-center">
          Please verify your email address.
        </Text>
        <Text className="text-gray-500 mb-6 text-center">
          We have sent a verification link to your email. After verifying, tap the button below.
        </Text>
        <TouchableOpacity
          className="w-full max-w-md bg-[#727D73] rounded-lg p-4 mb-4"
          onPress={handleCheckVerification}
          disabled={loading}
        >
          <Text className="text-center text-white font-bold">
            {loading ? 'Checking...' : 'I have verified my email'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-full max-w-md bg-[#A0A0A0] rounded-lg p-4"
          onPress={() => setPendingVerification(false)}
          disabled={loading}
        >
          <Text className="text-center text-white font-bold">
            Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center bg-[#D0DDD0] px-4">
      <View className="mb-8 items-center">
        <Image
          //source={require('./path-to-your-logo.png')}
          style={{ width: 100, height: 100, marginBottom: 8 }}
        />
        <Text className="text-4xl font-bold text-white">VehiScan</Text>
      </View>

      <TextInput
        className="w-full max-w-md border border-gray-400 rounded-lg p-4 mb-4 text-base bg-[#F0F0D7] text-black"
        placeholder="Email Address"
        placeholderTextColor="#A0A0A0"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="w-full max-w-md border border-gray-400 rounded-lg p-4 mb-4 text-base bg-[#F0F0D7] text-black"
        placeholder="Password"
        placeholderTextColor="#A0A0A0"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        onPress={handleForgotPassword}
        style={{ alignSelf: 'flex-end', marginBottom: 12 }}
      >
        <Text style={{ color: '#4285F4', fontWeight: 'bold' }}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="w-full max-w-md bg-[#727D73] rounded-lg p-4 mb-4"
        onPress={handleLogin}
        disabled={loading}
      >
        <Text className="text-center text-white font-bold">
          {loading ? 'Logging In...' : 'Log In'}
        </Text>
      </TouchableOpacity>

      {isLocked && (
        <Text className="text-red-600 mb-4">
          Account locked. Try again in {formatTime(lockTimeRemaining)}.
        </Text>
      )}

      <View className="flex-row items-center justify-center">
        <Text className="text-gray-500 mt-4">Don't have an account?</Text>
        <Pressable onPress={() => router.replace('signup')}>
          <Text className="text-indigo-500 mt-4"> Sign Up</Text>
        </Pressable>
      </View>
    </View>
  );
}