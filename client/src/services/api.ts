import axios from 'axios';

// API Base URL configuration
// For local development: use proxy (relative URL)
// For production: use environment variable or fallback to localhost
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? (process.env.REACT_APP_API_URL || 'https://your-backend-url.vercel.app/api')
  : '/api'; // Use proxy for local development

console.log('🔧 API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  API_BASE_URL,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL
});

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable credentials for CORS
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const proposalsAPI = {
  getAll: (params?: any) => api.get('/proposals', { params }),
  getById: (id: string) => api.get(`/proposals/${id}`),
  create: (data: any) => api.post('/proposals', data),
  update: (id: string, data: any) => api.put(`/proposals/${id}`, data),
  delete: (id: string) => api.delete(`/proposals/${id}`),
  generate: (data: any) => api.post('/proposals/generate', data),
  publish: (id: string) => api.post(`/proposals/${id}/publish`),
  duplicate: (id: string) => api.post(`/proposals/${id}/duplicate`),
  sendEmail: (id: string, data: { recipientEmail: string; clientName: string; customMessage?: string }) => 
    api.post(`/proposals/${id}/send-email`, data),
  sendProposal: (id: string, data: { email: string }) => 
    api.post(`/proposals/${id}/send-email`, data),
  downloadPDF: (id: string) => api.get(`/proposals/${id}/download-pdf`, { responseType: 'blob' }),
  getByClient: (clientName: string) => api.get('/proposals', { params: { clientName } }),
  getEmailTrackingStats: (id: string) => api.get(`/email-tracking/stats/${id}`),
  getAccessRequests: (id: string) => api.get(`/proposals/${id}/access-requests`),
  grantAccessRequest: (id: string, requestId: string) => api.post(`/proposals/${id}/access-requests/${requestId}/grant`),
};

export const templatesAPI = {
  getAll: (params?: any) => api.get('/templates', { params }),
  getById: (id: string) => api.get(`/templates/${id}`),
  create: (data: any) => api.post('/templates', data),
  update: (id: string, data: any) => api.put(`/templates/${id}`, data),
  delete: (id: string) => api.delete(`/templates/${id}`),
};

export const snippetsAPI = {
  getAll: (params?: any) => api.get('/snippets', { params }),
  getById: (id: string) => api.get(`/snippets/${id}`),
  create: (data: any) => api.post('/snippets', data),
  update: (id: string, data: any) => api.put(`/snippets/${id}`, data),
  delete: (id: string) => api.delete(`/snippets/${id}`),
  incrementUsage: (id: string) => api.post(`/snippets/${id}/increment-usage`),
};

export const caseStudiesAPI = {
  getAll: (params?: any) => api.get('/case-studies', { params }),
  getById: (id: string) => api.get(`/case-studies/${id}`),
  create: (data: any) => api.post('/case-studies', data),
  update: (id: string, data: any) => api.put(`/case-studies/${id}`, data),
  delete: (id: string) => api.delete(`/case-studies/${id}`),
};

export const pricingAPI = {
  getAll: (params?: any) => api.get('/pricing', { params }),
  getById: (id: string) => api.get(`/pricing/${id}`),
  create: (data: any) => api.post('/pricing', data),
  update: (id: string, data: any) => api.put(`/pricing/${id}`, data),
  delete: (id: string) => api.delete(`/pricing/${id}`),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics'),
  getProposals: (params?: any) => api.get('/analytics', { params }),
};

export const organizationsAPI = {
  getCurrent: () => api.get('/organizations/current'),
  update: (data: any) => api.put('/organizations/current', data),
  getBrandSettings: () => api.get('/organizations/brand-settings'),
  updateBrandSettings: (data: any) => api.put('/organizations/brand-settings', data),
};

export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  changePassword: (data: any) => api.put('/users/password', data),
};

export const publicAPI = {
  getProposal: (id: string, accessCode?: string) => 
    api.get(`/public/proposals/${id}${accessCode ? `?accessCode=${accessCode}` : ''}`),
  submitFeedback: (id: string, data: { accessCode: string; action: string; comment?: string }) =>
    api.post(`/public/proposals/${id}/feedback`, data),
  requestAccess: (id: string, data: { name: string; email: string; company?: string; reason?: string }) =>
    api.post(`/public/proposals/${id}/request-access`, data),
}; 

export const clientsAPI = {
  getAll: (params?: any) => api.get('/clients', { params }),
  getClients: (params?: any) => api.get('/clients', { params }),
  getById: (id: string) => api.get(`/clients/${id}`),
  getClient: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  updateClient: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
  deleteClient: (id: string) => api.delete(`/clients/${id}`),
};

export const commentsAPI = {
  getByProposal: (proposalId: string, params?: any) => 
    api.get(`/comments/proposal/${proposalId}`, { params }),
  getUnreadCount: (proposalId: string) => 
    api.get(`/comments/proposal/${proposalId}/unread`),
  create: (proposalId: string, data: { content: string; position?: any }) => 
    api.post(`/comments/proposal/${proposalId}`, data),
  update: (id: string, data: { content: string; position?: any }) => 
    api.put(`/comments/${id}`, data),
  delete: (id: string) => api.delete(`/comments/${id}`),
};

export const teamsAPI = {
  getAll: (params?: any) => api.get('/teams', { params }),
  getById: (id: string) => api.get(`/teams/${id}`),
  create: (data: { name: string; description?: string }) => 
    api.post('/teams', data),
  update: (id: string, data: { name: string; description?: string }) => 
    api.put(`/teams/${id}`, data),
  delete: (id: string) => api.delete(`/teams/${id}`),
  addMember: (teamId: string, data: { userId: string; role?: string }) =>
    api.post(`/teams/${teamId}/members`, data),
  updateMember: (teamId: string, memberId: string, data: { role: string }) =>
    api.put(`/teams/${teamId}/members/${memberId}`, data),
  removeMember: (teamId: string, memberId: string) =>
    api.delete(`/teams/${teamId}/members/${memberId}`),
  getProposals: (teamId: string, params?: any) =>
    api.get(`/teams/${teamId}/proposals`, { params }),
};

// Notification API
export const notificationAPI = {
  // Get all notifications for the current user
  getAll: () => api.get('/notifications'),
  
  // Get unread notification count
  getUnreadCount: () => api.get('/notifications/unread-count'),
  
  // Mark notification as read
  markAsRead: (notificationId: string) => api.put(`/notifications/${notificationId}/read`),
  
  // Mark all notifications as read
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  
  // Get proposal-specific notifications
  getByProposal: (proposalId: string) => api.get(`/notifications/proposal/${proposalId}`),
};

// OpenRouter API types
interface OpenRouterMessage {
  role: string;
  content: string;
}

interface OpenRouterChoice {
  message: {
    content: string;
  };
}

interface OpenRouterResponse {
  choices: OpenRouterChoice[];
}

/**
 * Call OpenRouter's DeepSeek model (or any OpenRouter model) using OpenAI-compatible API.
 * Usage:
 *   const result = await getOpenRouterChatCompletion([
 *     { role: 'user', content: 'Hello, who are you?' }
 *   ]);
 */
export async function getOpenRouterChatCompletion(
  messages: OpenRouterMessage[], 
  model = "deepseek/deepseek-chat", 
  retryCount = 0
): Promise<OpenRouterResponse> {
  const API_BASE_URL = "https://openrouter.ai/api/v1";
  // It's best to store your API key in an environment variable for security
  const API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY || "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";

  const requestBody = {
    model,
    messages,
    max_tokens: 2048, // Increased to allow for longer responses and reduce truncation
    temperature: 0.7,
  };

  console.log('🔍 Sending request to OpenRouter:', {
    model,
    messageCount: messages.length,
    firstMessage: messages[0]?.content?.substring(0, 50) + '...',
    maxTokens: requestBody.max_tokens,
    retryCount
  });

  try {
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter
        "X-Title": "ProposalAI", // Optional but recommended
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🚨 OpenRouter API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        retryCount
      });
      
      // Handle specific credit limit error
      if (response.status === 402) {
        throw new Error('OpenRouter credits exhausted. Please visit https://openrouter.ai/settings/credits to add more credits or upgrade your account.');
      }
      
      // Handle rate limiting with exponential backoff
      if (response.status === 429 && retryCount < 3) {
        const backoffTime = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`🔄 Rate limited, retrying in ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return getOpenRouterChatCompletion(messages, model, retryCount + 1);
      }
      
      // Handle other rate limiting errors
      if (response.status === 429) {
        throw new Error('OpenRouter API rate limit exceeded. Please wait a few minutes and try again.');
      }
      
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
  } catch (error: any) {
    // Handle network errors with retry
    if (error.name === 'TypeError' && retryCount < 2) {
      const backoffTime = Math.pow(2, retryCount) * 1000;
      console.log(`🔄 Network error, retrying in ${backoffTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      return getOpenRouterChatCompletion(messages, model, retryCount + 1);
    }
    
    throw error;
  }
}