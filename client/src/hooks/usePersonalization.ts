import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { apiRequest } from '@/lib/queryClient';

export function usePersonalization() {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [personalization, setPersonalization] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if we have signup data to save
      const signupData = localStorage.getItem('signupData');
      if (signupData) {
        const data = JSON.parse(signupData);
        if (data.personalization) {
          savePersonalization(data.personalization);
          localStorage.removeItem('signupData'); // Clean up
        }
      }
    }
  }, [isAuthenticated, user]);

  const savePersonalization = async (data: any) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/user/personalization', data);
      setPersonalization(data);
    } catch (error) {
      console.error('Failed to save personalization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPersonalization = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', '/api/user/personalization');
      setPersonalization(response);
    } catch (error) {
      console.error('Failed to fetch personalization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    personalization,
    isLoading,
    savePersonalization,
    fetchPersonalization
  };
}