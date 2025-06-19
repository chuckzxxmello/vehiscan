// ProtectedRoute.tsx
// Higher-order component to protect routes/screens that require authentication and/or rate limiting.
// Redirects unauthenticated users to login and rate-limited users to home.

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { checkRateLimit } from '../utils/securityUtils';
import { showSecurityAlert } from '../utils/securityUtils';

/**
 * Props for ProtectedRoute
 * @property children - The protected content to render
 * @property requireAuth - If true, user must be authenticated
 * @property requireRateLimit - If true, user must not be rate-limited
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRateLimit?: boolean;
}

/**
 * ProtectedRoute
 * Wraps a screen/component to enforce authentication and/or rate limiting.
 * - Redirects unauthenticated users to /login
 * - Shows alert and redirects rate-limited users to /
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireRateLimit = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (requireAuth) {
          // Check authentication
          onAuthStateChanged(auth, async (user) => {
            if (!user) {
              router.replace('/login');
              return;
            }

            if (requireRateLimit) {
              // Check rate limit
              const isWithinLimit = await checkRateLimit(
                user.uid,
                'route_access',
                10,
                60 * 60 * 1000 // 1 hour
              );

              if (!isWithinLimit) {
                showSecurityAlert('Rate limit exceeded. Please try again later.');
                router.replace('/');
                return;
              }
            }

            setIsAuthorized(true);
            setIsLoading(false);
          });
        } else {
          setIsAuthorized(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        showSecurityAlert('Authentication failed. Please try again.');
        router.replace('/login');
      }
    };

    checkAuth();
  }, [requireAuth, requireRateLimit]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}; 