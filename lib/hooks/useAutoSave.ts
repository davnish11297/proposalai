import { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from '@/lib/utils';

interface AutoSaveState {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  error?: string;
}

interface UseAutoSaveProps {
  proposalId: string;
  content: string;
  title?: string;
  description?: string;
  enabled?: boolean;
  saveInterval?: number; // in milliseconds
}

export const useAutoSave = ({
  proposalId,
  content,
  title,
  description,
  enabled = true,
  saveInterval = 10000, // 10 seconds
}: UseAutoSaveProps) => {
  const [saveState, setSaveState] = useState<AutoSaveState>({ status: 'idle' });
  const lastSavedContent = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isInitialLoad = useRef(true);

  const autoSave = useCallback(async () => {
    if (!enabled || !proposalId || proposalId === 'undefined') {
      return;
    }

    // Skip if content hasn't changed
    if (content === lastSavedContent.current) {
      return;
    }

    setSaveState({ status: 'saving' });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/proposals/${proposalId}/auto-save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          title,
          description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Auto-save failed');
      }

      lastSavedContent.current = content;
      setSaveState({ 
        status: 'saved', 
        lastSaved: new Date() 
      });

      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveState(prev => ({ ...prev, status: 'idle' }));
      }, 3000);

    } catch (error) {
      console.error('Auto-save error:', error);
      setSaveState({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Auto-save failed' 
      });

      // Retry after 30 seconds
      setTimeout(() => {
        setSaveState(prev => ({ ...prev, status: 'idle' }));
      }, 30000);
    }
  }, [proposalId, content, title, description, enabled]);

  // Debounced auto-save function
  const debouncedAutoSave = useCallback(
    debounce(autoSave, saveInterval),
    [autoSave, saveInterval]
  );

  // Effect to trigger auto-save when content changes
  useEffect(() => {
    // Skip auto-save on initial load
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      lastSavedContent.current = content;
      return;
    }

    if (!enabled || !content || content === lastSavedContent.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      debouncedAutoSave();
    }, saveInterval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, enabled, saveInterval, debouncedAutoSave]);

  // Manual save function
  const forceSave = useCallback(async () => {
    await autoSave();
  }, [autoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveState,
    forceSave,
  };
};