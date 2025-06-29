import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

// Keys that should not be scoped to a user and remain global.
const GLOBAL_KEYS = ['darkMode'];

function getValue<T,>(key: string, initialValue: T | (() => T)): T {
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
  }

  return initialValue instanceof Function ? initialValue() : initialValue;
}

export function useLocalStorage<T,>(key: string, initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const { currentUser } = useUser();
  const isUserSpecific = !GLOBAL_KEYS.includes(key);
  
  const getEffectiveKey = () => {
    return isUserSpecific && currentUser ? `${key}-${currentUser.id}` : key;
  };

  const [storedValue, setStoredValue] = useState<T>(() => {
    return getValue(getEffectiveKey(), initialValue);
  });

  useEffect(() => {
    // For user-specific data, only write if a user is logged in.
    // For global data, always write.
    if (!isUserSpecific || currentUser) {
        try {
            window.localStorage.setItem(getEffectiveKey(), JSON.stringify(storedValue));
        } catch (error) {
            console.warn(`Error setting localStorage key "${getEffectiveKey()}":`, error);
        }
    }
  }, [key, storedValue, currentUser, isUserSpecific]);

  // This effect handles user login/logout for user-specific data.
  useEffect(() => {
    if (isUserSpecific) {
        if (currentUser) {
            // User logged in or changed, re-initialize state from their storage.
            setStoredValue(getValue(getEffectiveKey(), initialValue));
        } else {
            // User logged out, reset to initial value to clear UI.
            setStoredValue(initialValue instanceof Function ? initialValue() : initialValue);
        }
    }
  }, [currentUser, key, isUserSpecific]);

  return [storedValue, setStoredValue];
}
