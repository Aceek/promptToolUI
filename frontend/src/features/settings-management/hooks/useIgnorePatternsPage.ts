import { useState, useEffect } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { toastService } from '../../../services/toastService';

export const useIgnorePatternsPage = () => {
  const { settings, loadSettings, updateSettings, isLoading } = useAppStore();
  
  const [patterns, setPatterns] = useState<string[]>([]);
  const [newPattern, setNewPattern] = useState('');

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      setPatterns(settings.globalIgnorePatterns || []);
    }
  }, [settings]);

  const addPattern = () => {
    if (newPattern.trim() && !patterns.includes(newPattern.trim())) {
      setPatterns([...patterns, newPattern.trim()]);
      setNewPattern('');
    }
  };

  const removePattern = (index: number) => {
    setPatterns(patterns.filter((_, i) => i !== index));
  };

  const defaultPatterns = [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    '*.log',
    '.env*',
    '*.tmp',
    '*.cache',
    '.DS_Store',
    'Thumbs.db'
  ];

  const addDefaultPattern = (pattern: string) => {
    if (!patterns.includes(pattern)) {
      setPatterns([...patterns, pattern]);
    }
  };

  const saveSettings = async () => {
    const promise = updateSettings({ globalIgnorePatterns: patterns });
    
    toastService.promise(promise, {
      loading: 'Sauvegarde en cours...',
      success: 'Paramètres sauvegardés avec succès !',
      error: 'Erreur lors de la sauvegarde',
    });

    try {
      await promise;
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return {
    // State
    patterns,
    newPattern,
    isLoading,
    defaultPatterns,
    // Methods
    setNewPattern,
    addPattern,
    removePattern,
    addDefaultPattern,
    saveSettings,
  };
};