import { useState, useEffect, useCallback } from 'react';
import { debounce } from '@/lib/utils';

interface QualityMetrics {
  score: number;
  readability: number;
  completeness: number;
  persuasiveness: number;
  structure: number;
  suggestions: Array<{
    type: 'missing' | 'improvement' | 'enhancement';
    category: 'content' | 'structure' | 'formatting' | 'strategy';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  industryInsights?: string[];
}

interface UseQualityScoringProps {
  content: string;
  industry?: string;
  proposalType?: string;
  enabled?: boolean;
  debounceMs?: number;
}

export const useQualityScoring = ({
  content,
  industry,
  proposalType,
  enabled = true,
  debounceMs = 2000,
}: UseQualityScoringProps) => {
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeQuality = useCallback(async (contentToAnalyze: string) => {
    if (!enabled || !contentToAnalyze || contentToAnalyze.trim().length < 50) {
      setQualityMetrics(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/ai/quality-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: contentToAnalyze,
          industry,
          proposalType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze quality');
      }

      const data = await response.json();
      setQualityMetrics(data.data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Quality analysis failed';
      setError(errorMessage);
      console.error('Quality scoring error:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled, industry, proposalType]);

  // Debounced analysis function
  const debouncedAnalyze = useCallback(
    debounce(analyzeQuality, debounceMs),
    [analyzeQuality, debounceMs]
  );

  // Effect to trigger analysis when content changes
  useEffect(() => {
    if (enabled && content) {
      debouncedAnalyze(content);
    } else {
      setQualityMetrics(null);
    }
  }, [content, enabled, debouncedAnalyze]);

  // Manual refresh function
  const refreshScore = useCallback(() => {
    if (content) {
      analyzeQuality(content);
    }
  }, [content, analyzeQuality]);

  return {
    qualityMetrics,
    loading,
    error,
    refreshScore,
  };
};