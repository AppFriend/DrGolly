import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { apiRequest } from '@/lib/queryClient';

interface PersonalizationData {
  primaryConcerns: string[];
  phoneNumber: string;
  profilePictureUrl: string;
  userRole: string;
  acceptedTerms: boolean;
  marketingOptIn: boolean;
  newMemberOfferShown: boolean;
  newMemberOfferAccepted: boolean;
}

export function usePersonalization() {
  const { user, isAuthenticated } = useAuth();
  const [personalization, setPersonalization] = useState<PersonalizationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if we have signup data in localStorage that needs to be saved
      const signupData = localStorage.getItem('signupData');
      if (signupData) {
        const parsedData = JSON.parse(signupData);
        if (parsedData.personalization) {
          savePersonalization(parsedData.personalization);
          localStorage.removeItem('signupData'); // Clean up
        }
      }
    }
  }, [isAuthenticated, user]);

  const savePersonalization = async (data: PersonalizationData) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/personalization', data);
      setPersonalization(data);
    } catch (error) {
      console.error('Failed to save personalization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPersonalization = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', '/api/personalization');
      const data = await response.json();
      setPersonalization(data);
    } catch (error) {
      console.error('Failed to load personalization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    personalization,
    savePersonalization,
    loadPersonalization,
    isLoading
  };
}