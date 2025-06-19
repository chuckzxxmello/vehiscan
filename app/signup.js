import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, TouchableOpacity, Pressable, Alert} from 'react-native';
import { useAuth } from '../context/authContext';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, useRouter } from 'expo-router';

export default function Signup() {
  const router = useRouter();
  const {register} = useAuth();
  const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [code, setCode] = useState('');

    const handleSignup = async () => {
  if (!password || !email || !firstName || !lastName || !code) {
    Alert.alert('Sign Up', 'Please fill in all fields');
    return;
    }
    try {
      let response = await register(password, email, firstName, lastName, code);
      console.log('got result: ', response);

      Alert.alert(
        response.success ? 'Sign Up Successful' : 'Error',
        response.success
          ? 'Account created! Please log in. Verify your email before logging in.'
          : response.msg,
        [
          {
            text: 'OK',
            onPress: () => router.replace('login'),
          },
        ]
      );
    } catch (error) {
      console.error('Error registering:', error);
      Alert.alert('Error', 'An error occurred. Please try again.', [
        { text: 'OK', onPress: () => router.replace('login') },
      ]);
    }
  };
  return (
  <View className="flex-1 justify-center items-center bg-[#4169E1] px-4">
    {/* Logo Section */}
    <View className="mb-8 items-center">
      <Image
        source={require('./../assets/images/Vehiscan.png')} // Replace with your actual logo path
        style={{ width: 250, height: 250, marginBottom: 8 }}
      />
      <Text className="text-4xl font-bold text-white">VehiScan</Text>
    </View>

    {/* Input Fields */}
    <View className="flex-row w-full max-w-md mb-4">
      <TextInput
        className="flex-1 border border-gray-400 rounded-lg p-4 text-base bg-[#A29BFE] text-black mr-2"
        placeholder="First Name"
        placeholderTextColor="#F5F6FA"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        className="flex-1 border border-gray-400 rounded-lg p-4 text-base bg-[#A29BFE] text-black"
        placeholder="Last Name"
        placeholderTextColor="#F5F6FA"
        value={lastName}
        onChangeText={setLastName}
      />
    </View>
    <TextInput
      className="w-full max-w-md border border-gray-400 rounded-lg p-4 mb-4 text-base bg-[#A29BFE] text-black"
      placeholder="Email"
      placeholderTextColor="#F5F6FA"
      value={email}
      onChangeText={setEmail}
    />
    <TextInput
      className="w-full max-w-md border border-gray-400 rounded-lg p-4 mb-4 text-base bg-[#A29BFE] text-black"
      placeholder="Password"
      placeholderTextColor="#F5F6FA"
      value={password}
      onChangeText={setPassword}
      secureTextEntry
    />
    <TextInput
      className="w-full max-w-md border border-gray-400 rounded-lg p-4 mb-4 text-base bg-[#A29BFE] text-black"
      placeholder="Code"
      placeholderTextColor="#F5F6FA"
      value={code}
      onChangeText={(text) => setCode(text.toUpperCase())}
      autoCapitalize="characters"
    />

    {/* Sign Up Button */}
    <TouchableOpacity
      className="w-full max-w-md bg-[#D1D5DB] rounded-lg p-4 mb-4"
      onPress={handleSignup}
    >
      <Text className="text-center text-[#4169E1] font-bold">Sign Up</Text>
    </TouchableOpacity>

    {/* Create Account */}
    <View className="flex-row items-center justify-center">
      <Text className="text-[#F5F6FA] mt-4">Already have an account?</Text>
      <Pressable onPress={() => router.replace('login')}>
        <Text className="text-[#2ECC71] mt-4"> Log In</Text>
      </Pressable>
    </View>
  </View>
  );
}