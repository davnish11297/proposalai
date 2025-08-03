import { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from '@/lib/utils';

interface AutoSaveState {
  status: 'idle' | 'pending' | 'saving' | 'saved' | 'error';
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
  debounceDelay?: number; // in milliseconds
}

export const useAutoSave = ({
  proposalId,
  content,
  title,
  description,
  enabled = true,
  saveInterval = 10000, // 10 seconds
  debounceDelay = 500, // 500ms debounce
}: UseAutoSaveProps) => {
  const [saveState, setSaveState] = useState<AutoSaveState>({ status: 'idle' });
  const lastSavedContent = useRef<string>('');
  const lastSavedTitle = useRef<string>('');
  const lastSavedDescription = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isInitialLoad = useRef(true);

  const autoSave = useCallback(async () => {
    if (!enabled || !proposalId || proposalId === 'undefined') {
      return;
    }

    // Skip if nothing has changed
    if (content === lastSavedContent.current && 
        title === lastSavedTitle.current && 
        description === lastSavedDescription.current) {
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
      lastSavedTitle.current = title || '';
      lastSavedDescription.current = description || '';
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
    debounce(autoSave, debounceDelay),
    [autoSave, debounceDelay]
  );

  // Effect to trigger auto-save when any field changes
  useEffect(() => {
    // Skip auto-save on initial load
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      lastSavedContent.current = content;
      lastSavedTitle.current = title || '';
      lastSavedDescription.current = description || '';
      return;
    }

    // Check if any field has changed
    const hasContentChanged = content !== lastSavedContent.current;
    const hasTitleChanged = title !== lastSavedTitle.current;
    const hasDescriptionChanged = description !== lastSavedDescription.current;

    // Debug logging
    if (hasContentChanged || hasTitleChanged || hasDescriptionChanged) {
      console.log('Auto-save triggered:', {
        hasContentChanged,
        hasTitleChanged,
        hasDescriptionChanged,
        content: content.substring(0, 50) + '...',
        title,
        description: description?.substring(0, 50) + '...'
      });
    }

    if (!enabled || (!hasContentChanged && !hasTitleChanged && !hasDescriptionChanged)) {
      return;
    }

    // Show pending state immediately
    setSaveState({ status: 'pending' });

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced auto-save
    timeoutRef.current = setTimeout(() => {
      debouncedAutoSave();
    }, debounceDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, title, description, enabled, debounceDelay, debouncedAutoSave]);

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