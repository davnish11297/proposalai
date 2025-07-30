import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface ActionData {
  action: string;
  proposalId?: string;
  clientId?: string;
  data?: any;
  emailTemplate?: {
    subject: string;
    body: string;
  };
}

interface UseOneClickActionsReturn {
  executeAction: (actionData: ActionData) => Promise<any>;
  loading: boolean;
  error: string | null;
}

export const useOneClickActions = (): UseOneClickActionsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAction = useCallback(async (actionData: ActionData) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(actionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Action failed');
      }

      const result = await response.json();
      
      // Show success message based on action type
      switch (actionData.action) {
        case 'send-follow-up':
          toast.success('Follow-up email sent successfully!');
          break;
        case 'create-proposal':
          toast.success('New proposal created!');
          break;
        case 'update-status':
          toast.success('Proposal status updated!');
          break;
        case 'download-pdf':
          toast.success('PDF download started!');
          break;
        case 'send-quick-email':
          toast.success('Email sent successfully!');
          break;
        default:
          toast.success('Action completed successfully!');
      }

      return result.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    executeAction,
    loading,
    error,
  };
};