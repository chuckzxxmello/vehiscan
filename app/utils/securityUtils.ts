// securityUtils.ts
// Utility functions for input sanitization, validation, rate limiting, and security alerts.
// These help protect the app from XSS, enforce input formats, and provide user feedback.

import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Sanitize user input to prevent XSS attacks.
 * Removes HTML tags, script protocols, and event handlers.
 * @param input - Raw user input string
 * @returns Sanitized string safe for display
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove any HTML tags and special characters
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/script/gi, '') // Remove script tags
    .replace(/\s{2,}/g, ' '); // Replace multiple spaces with single space
};

/**
 * Input validation functions for vehicle-specific fields.
 * Ensures user input matches expected formats for vehicle registration.
 */
export const validateInput = {
  /**
   * Validate vehicle plate number (alphanumeric, up to 15 chars)
   */
  licensePlate: (plate: string): boolean => {
    const plateRegex = /^[A-Z0-9\s-]{1,15}$/;
    return plateRegex.test(plate);
  },

  /**
   * Validate owner name (letters, spaces, periods, 2-100 chars)
   */
  ownerName: (name: string): boolean => {
    const nameRegex = /^[a-zA-Z\s.]{2,100}$/;
    return nameRegex.test(name);
  },

  /**
   * Validate vehicle make (letters, numbers, spaces, 1-50 chars)
   */
  make: (make: string): boolean => {
    const makeRegex = /^[a-zA-Z0-9\s]{1,50}$/;
    return makeRegex.test(make);
  },

  /**
   * Validate model (letters, numbers, spaces, hyphens, 1-50 chars)
   */
  model: (model: string): boolean => {
    const modelRegex = /^[a-zA-Z0-9\s-]{1,50}$/;
    return modelRegex.test(model);
  },

  /**
   * Validate year (4 digits, reasonable range)
   */
  yearModel: (year: string): boolean => {
    const yearRegex = /^\d{4}$/;
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();
    return yearRegex.test(year) && yearNum >= 1900 && yearNum <= currentYear + 2;
  },

  /**
   * Validate body type (letters, spaces, 1-30 chars)
   */
  bodyType: (bodyType: string): boolean => {
    const bodyTypeRegex = /^[a-zA-Z\s]{1,30}$/;
    return bodyTypeRegex.test(bodyType);
  },

  /**
   * Validate chassis number (alphanumeric, 8-25 chars)
   */
  chassisNumber: (chassis: string): boolean => {
    const chassisRegex = /^[A-Z0-9]{8,25}$/;
    return chassisRegex.test(chassis);
  },

  /**
   * Validate engine number (alphanumeric, 5-25 chars)
   */
  engineNumber: (engine: string): boolean => {
    const engineRegex = /^[A-Z0-9]{5,25}$/;
    return engineRegex.test(engine);
  },

  /**
   * Validate color (letters, spaces, 2-20 chars)
   */
  color: (color: string): boolean => {
    const colorRegex = /^[a-zA-Z\s]{2,20}$/;
    return colorRegex.test(color);
  },

  /**
   * Validate fuel type (letters, spaces, 2-20 chars)
   */
  fuel: (fuel: string): boolean => {
    const fuelRegex = /^[a-zA-Z\s]{2,20}$/;
    return fuelRegex.test(fuel);
  },

  /**
   * Validate weight/capacity (numbers with optional decimal, 1-10 chars)
   */
  weight: (weight: string): boolean => {
    const weightRegex = /^\d{1,6}(\.\d{1,2})?$/;
    return weightRegex.test(weight);
  },

  /**
   * Validate displacement (numbers with optional decimal, 1-10 chars)
   */
  displacement: (displacement: string): boolean => {
    const displacementRegex = /^\d{1,6}(\.\d{1,2})?$/;
    return displacementRegex.test(displacement);
  },

  /**
   * Validate series (alphanumeric, spaces, 1-30 chars)
   */
  series: (series: string): boolean => {
    const seriesRegex = /^[a-zA-Z0-9\s]{1,30}$/;
    return seriesRegex.test(series);
  },

  /**
   * Validate date format (YYYY-MM-DD)
   */
  date: (date: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
  },

  /**
   * Validate email address format
   */
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number (10-15 digits, optional +, spaces, or dashes)
   */
  phone: (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s-]{10,15}$/;
    return phoneRegex.test(phone);
  }
};

/**
 * Validate all vehicle form fields at once
 * @param vehicleInfo - Vehicle information object
 * @returns Object with validation results
 */
export const validateVehicleForm = (vehicleInfo: any) => {
  const errors: string[] = [];
  
  if (!validateInput.ownerName(vehicleInfo.ownerName)) {
    errors.push('Owner name must be 2-100 characters with letters, spaces, and periods only');
  }
  
  if (!validateInput.licensePlate(vehicleInfo.licensePlate)) {
    errors.push('License plate must be 1-15 characters with letters, numbers, spaces, and hyphens only');
  }
  
  if (!validateInput.make(vehicleInfo.make)) {
    errors.push('Make must be 1-50 characters with letters, numbers, and spaces only');
  }
  
  if (vehicleInfo.model && !validateInput.model(vehicleInfo.model)) {
    errors.push('Model must be 1-50 characters with letters, numbers, spaces, and hyphens only');
  }
  
  if (!validateInput.yearModel(vehicleInfo.yearModel)) {
    errors.push('Year must be a valid 4-digit year between 1900 and current year + 2');
  }
  
  if (!validateInput.bodyType(vehicleInfo.bodyType)) {
    errors.push('Body type must be 1-30 characters with letters and spaces only');
  }
  
  if (!validateInput.chassisNumber(vehicleInfo.chassisNumber)) {
    errors.push('Chassis number must be 8-25 alphanumeric characters');
  }
  
  if (!validateInput.engineNumber(vehicleInfo.engineNumber)) {
    errors.push('Engine number must be 5-25 alphanumeric characters');
  }
  
  if (!validateInput.color(vehicleInfo.color)) {
    errors.push('Color must be 2-20 characters with letters and spaces only');
  }
  
  if (!validateInput.fuel(vehicleInfo.fuel)) {
    errors.push('Fuel type must be 2-20 characters with letters and spaces only');
  }
  
  if (!validateInput.weight(vehicleInfo.grossWt)) {
    errors.push('Gross weight must be a valid number');
  }
  
  if (!validateInput.weight(vehicleInfo.netWt)) {
    errors.push('Net weight must be a valid number');
  }
  
  if (!validateInput.weight(vehicleInfo.netCapacity)) {
    errors.push('Net capacity must be a valid number');
  }
  
  if (!validateInput.displacement(vehicleInfo.pistonDisplacement)) {
    errors.push('Piston displacement must be a valid number');
  }
  
  if (!validateInput.series(vehicleInfo.series)) {
    errors.push('Series must be 1-30 characters with letters, numbers, and spaces only');
  }
  
  if (!validateInput.date(vehicleInfo.lastRenewal)) {
    errors.push('Last renewal must be in YYYY-MM-DD format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize all vehicle form fields
 * @param vehicleInfo - Raw vehicle information object
 * @returns Sanitized vehicle information object
 */
export const sanitizeVehicleForm = (vehicleInfo: any) => {
  const sanitized = { ...vehicleInfo };
  
  // Sanitize all string fields
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]);
    }
  });
  
  return sanitized;
};

/**
 * FIXED: FREE CLIENT-SIDE RATE LIMITING using AsyncStorage with proper per-user isolation
 * This provides excellent protection without requiring Firebase Functions
 * @param userId - User's unique ID
 * @param action - Action to rate limit (e.g., 'scan')
 * @param maxAttempts - Max allowed attempts
 * @param timeWindow - Time window in milliseconds
 * @returns Promise<boolean> - true if allowed, false if rate limited
 */
export const checkRateLimit = async (
  userId: string,
  action: string,
  maxAttempts: number,
  timeWindow: number // in milliseconds
): Promise<boolean> => {
  try {
    const timestamp = Date.now();
    const windowStart = timestamp - timeWindow;
    
    // FIXED: Use proper per-user storage key to prevent cross-user interference
    const storageKey = `rateLimit_${userId}_${action}`;

    // Get stored attempts from AsyncStorage for this specific user
    const storedData = await AsyncStorage.getItem(storageKey);
    let attempts: number[] = storedData ? JSON.parse(storedData) : [];

    // Filter out attempts outside the time window
    attempts = attempts.filter(attemptTime => attemptTime > windowStart);

    // FIXED: Check if THIS USER exceeded max attempts
    if (attempts.length >= maxAttempts) {
      // IMPROVED: Calculate time until this user can attempt again
      const oldestAttemptInWindow = Math.min(...attempts);
      const nextAllowedTimestamp = oldestAttemptInWindow + timeWindow;
      const nextAllowedTime = new Date(nextAllowedTimestamp);
      
      // FIXED: Calculate accurate time until next attempt
      const timeUntilNextAttempt = Math.ceil((nextAllowedTimestamp - timestamp) / 60000);
      
      // Format time in AM/PM format
      const formattedTime = nextAllowedTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true // This ensures AM/PM format like "2:30 PM"
      });
      
      // ENHANCED: More informative alert message
      Alert.alert(
        'Rate Limit Exceeded',
        `You've reached the maximum of ${maxAttempts} ${action} attempts per hour.\n\n` +
        `Please wait ${timeUntilNextAttempt} minutes before trying again.\n\n` +
        `Next allowed: ${formattedTime}`,
        [{ text: 'OK' }]
      );
      
      // Enhanced logging with user context
      console.log(`[RATE_LIMIT] User ${userId.slice(0, 8)}... exceeded limit: ${attempts.length}/${maxAttempts} attempts`);
      
      return false;
    }

    // Add current attempt for this user
    attempts.push(timestamp);

    // Store updated attempts for this user only
    await AsyncStorage.setItem(storageKey, JSON.stringify(attempts));

    // Enhanced logging with attempt tracking
    console.log(`[RATE_LIMIT] User ${userId.slice(0, 8)}... allowed: ${attempts.length}/${maxAttempts} attempts`);
    
    return true;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow the action to proceed (graceful fallback)
    return true;
  }
};

/**
 * ENHANCED: Reset rate limit for a specific user and action (admin function)
 * @param userId - User's unique ID
 * @param action - Action to reset
 */
export const resetRateLimit = async (userId: string, action: string): Promise<void> => {
  try {
    const storageKey = `rateLimit_${userId}_${action}`;
    await AsyncStorage.removeItem(storageKey);
    console.log(`[RATE_LIMIT] Reset for user ${userId.slice(0, 8)}... action: ${action}`);
  } catch (error) {
    console.error('Rate limit reset failed:', error);
  }
};

/**
 * ENHANCED: Get current rate limit status for a specific user
 * @param userId - User's unique ID
 * @param action - Action to check
 * @param timeWindow - Time window in milliseconds
 * @returns Current attempt count and next reset time for this user
 */
export const getRateLimitStatus = async (
  userId: string,
  action: string,
  timeWindow: number
): Promise<{ attempts: number; nextReset: Date | null }> => {
  try {
    const timestamp = Date.now();
    const windowStart = timestamp - timeWindow;
    const storageKey = `rateLimit_${userId}_${action}`;

    const storedData = await AsyncStorage.getItem(storageKey);
    let attempts: number[] = storedData ? JSON.parse(storedData) : [];

    // Filter current window attempts for this user
    attempts = attempts.filter(attemptTime => attemptTime > windowStart);

    const nextReset = attempts.length > 0 ? new Date(Math.min(...attempts) + timeWindow) : null;

    return {
      attempts: attempts.length,
      nextReset
    };
  } catch (error) {
    console.error('Rate limit status check failed:', error);
    return { attempts: 0, nextReset: null };
  }
};

/**
 * ENHANCED: Get detailed rate limit status with warning levels
 * @param userId - User's unique ID
 * @param action - Action to check
 * @param maxAttempts - Maximum allowed attempts
 * @param timeWindow - Time window in milliseconds
 * @returns Detailed rate limit information
 */
export const getDetailedRateLimitStatus = async (
  userId: string,
  action: string,
  maxAttempts: number,
  timeWindow: number
): Promise<{
  attempts: number;
  maxAttempts: number;
  nextReset: Date | null;
  timeUntilReset: number; // minutes
  isAtLimit: boolean;
  warningLevel: 'safe' | 'warning' | 'critical';
}> => {
  try {
    const timestamp = Date.now();
    const windowStart = timestamp - timeWindow;
    const storageKey = `rateLimit_${userId}_${action}`;

    const storedData = await AsyncStorage.getItem(storageKey);
    let attempts: number[] = storedData ? JSON.parse(storedData) : [];

    // Filter current window attempts
    attempts = attempts.filter(attemptTime => attemptTime > windowStart);

    const nextReset = attempts.length > 0 ? new Date(Math.min(...attempts) + timeWindow) : null;
    const timeUntilReset = nextReset ? Math.ceil((Math.min(...attempts) + timeWindow - timestamp) / 60000) : 0;
    const isAtLimit = attempts.length >= maxAttempts;
    
    // Determine warning level
    const percentage = (attempts.length / maxAttempts) * 100;
    let warningLevel: 'safe' | 'warning' | 'critical';
    
    if (percentage >= 80) {
      warningLevel = 'critical';
    } else if (percentage >= 60) {
      warningLevel = 'warning';
    } else {
      warningLevel = 'safe';
    }

    return {
      attempts: attempts.length,
      maxAttempts,
      nextReset,
      timeUntilReset,
      isAtLimit,
      warningLevel
    };
  } catch (error) {
    console.error('Rate limit status check failed:', error);
    return {
      attempts: 0,
      maxAttempts,
      nextReset: null,
      timeUntilReset: 0,
      isAtLimit: false,
      warningLevel: 'safe'
    };
  }
};

/**
 * ENHANCED: Show progressive warnings as users approach rate limit
 * @param userId - User's unique ID
 * @param action - Action being performed
 * @param maxAttempts - Maximum allowed attempts
 * @param timeWindow - Time window in milliseconds
 */
export const showRateLimitWarning = async (
  userId: string,
  action: string,
  maxAttempts: number,
  timeWindow: number
): Promise<void> => {
  const status = await getDetailedRateLimitStatus(userId, action, maxAttempts, timeWindow);
  
  if (status.warningLevel === 'critical' && !status.isAtLimit) {
    const remaining = status.maxAttempts - status.attempts;
    Alert.alert(
      'Warning: Approaching Rate Limit',
      `You have ${remaining} ${action} attempts remaining in this hour.\n\nPlease pace your activity to avoid being temporarily blocked.`,
      [{ text: 'Understood' }]
    );
  }
};

/**
 * ENHANCED: Clear all rate limit data for all users (admin function)
 */
export const clearAllRateLimits = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const rateLimitKeys = keys.filter(key => key.startsWith('rateLimit_'));
    
    if (rateLimitKeys.length > 0) {
      await AsyncStorage.multiRemove(rateLimitKeys);
      console.log(`[RATE_LIMIT] Cleared ${rateLimitKeys.length} rate limit entries`);
    }
  } catch (error) {
    console.error('Failed to clear rate limits:', error);
  }
};

/**
 * Show a security-related alert to the user.
 * @param message - Message to display
 */
export const showSecurityAlert = (message: string) => {
  Alert.alert(
    'Security Alert',
    message,
    [{ text: 'OK' }]
  );
};

/**
 * Show validation errors to the user.
 * @param errors - Array of error messages
 */
export const showValidationAlert = (errors: string[]) => {
  Alert.alert(
    'Validation Error',
    errors.join('\n\n'),
    [{ text: 'OK' }]
  );
};

/**
 * Log security events for monitoring
 * @param event - Security event type
 * @param details - Event details
 */
export const logSecurityEvent = (event: string, details: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${timestamp} - ${event}:`, details);
  
  // In production, you could send this to your analytics service
  // analytics.track('security_event', { event, details, timestamp });
};

/**
 * Enhanced security utility for additional protection
 * @param attempts - Current attempt count
 * @param maxAttempts - Maximum allowed attempts
 * @param timeWindow - Time window in milliseconds
 * @returns Security status and recommendations
 */
export const getSecurityStatus = (attempts: number, maxAttempts: number, timeWindow: number) => {
  const percentage = (attempts / maxAttempts) * 100;
  
  if (percentage >= 80) {
    return {
      status: 'critical',
      message: 'Approaching rate limit. Please slow down.',
      color: '#EF4444'
    };
  } else if (percentage >= 60) {
    return {
      status: 'warning',
      message: 'High activity detected. Monitor usage.',
      color: '#F59E0B'
    };
  } else {
    return {
      status: 'normal',
      message: 'Normal usage patterns.',
      color: '#10B981'
    };
  }
};

/**
 * FIXED: Validate and sanitize QR code data with enhanced Firebase ID validation
 * @param qrData - Raw QR code data
 * @returns Sanitized and validated QR data
 */
export const validateQRCode = (qrData: string): { isValid: boolean; sanitizedData: string; error?: string } => {
  if (!qrData || typeof qrData !== 'string') {
    return {
      isValid: false,
      sanitizedData: '',
      error: 'Invalid QR code data'
    };
  }

  // Sanitize the QR data
  const sanitizedData = sanitizeInput(qrData);

  // Check if it's a VehiScan QR code
  if (sanitizedData.startsWith('vehiscan://vehicle/')) {
    const vehicleId = sanitizedData.split('vehiscan://vehicle/')[1];
    
    // FIXED: Enhanced Firebase document ID validation (they're typically 20+ characters)
    const vehicleIdRegex = /^[a-zA-Z0-9]{15,30}$/;
    
    if (vehicleIdRegex.test(vehicleId)) {
      return {
        isValid: true,
        sanitizedData: sanitizedData
      };
    } else {
      return {
        isValid: false,
        sanitizedData: sanitizedData,
        error: 'Invalid vehicle ID format'
      };
    }
  }

  // Allow other QR codes but sanitize them
  return {
    isValid: true,
    sanitizedData: sanitizedData
  };
};