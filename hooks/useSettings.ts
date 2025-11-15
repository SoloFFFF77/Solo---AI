import { useState, useEffect } from 'react';
import { Personality } from '../types';

export const useSettings = () => {
  const [personality, setPersonalityState] = useState<Personality>('default');

  useEffect(() => {
    const storedPersonality = (localStorage.getItem('personality') as Personality) || 'default';
    setPersonalityState(storedPersonality);
  }, []);

  const setPersonality = (newPersonality: Personality) => {
    localStorage.setItem('personality', newPersonality);
    setPersonalityState(newPersonality);
  };

  return { personality, setPersonality };
};
