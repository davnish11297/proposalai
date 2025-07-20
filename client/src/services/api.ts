import axios from 'axios';

// In development, use relative URLs to work with the proxy
// In production, use the full URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? (process.env.REACT_APP_API_URL || 'http://localhost:3000/api')
  : 'http://localhost:3001/api';

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
  sendEmail: (id: string, data: { recipientEmail: string; customMessage?: string }) => 
    api.post(`/proposals/${id}/send-email`, data),
  sendProposal: (id: string, data: { email: string }) => 
    api.post(`/proposals/${id}/send-email`, data),
  downloadPDF: (id: string) => api.get(`/proposals/${id}/download-pdf`, { responseType: 'blob' }),
  getByClient: (clientName: string) => api.get('/proposals', { params: { clientName } }),
  getEmailTrackingStats: (id: string) => api.get(`/email-tracking/stats/${id}`),
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
}; 

export const clientsAPI = {
  getAll: (params?: any) => api.get('/clients', { params }),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
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

/**
 * Call OpenRouter's DeepSeek model (or any OpenRouter model) using OpenAI-compatible API.
 * Usage:
 *   const result = await getOpenRouterChatCompletion([
 *     { role: 'user', content: 'Hello, who are you?' }
 *   ]);
 */
export async function getOpenRouterChatCompletion(messages: Array<{ role: string; content: string }>, model = "deepseek/deepseek-chat") {
  const API_BASE_URL = "https://openrouter.ai/api/v1";
  // It's best to store your API key in an environment variable for security
  const API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY || "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";

  const requestBody = {
    model,
    messages,
    max_tokens: 400, // Reduced from 800 to work within current credit limits (475 available)
    temperature: 0.7,
  };

  console.log('🔍 Sending request to OpenRouter:', {
    model,
    messageCount: messages.length,
    firstMessage: messages[0]?.content?.substring(0, 50) + '...',
    maxTokens: requestBody.max_tokens
  });

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
      errorText
    });
    
    // Handle specific credit limit error
    if (response.status === 402) {
      throw new Error('OpenRouter credits exhausted. Please visit https://openrouter.ai/settings/credits to add more credits or upgrade your account.');
    }
    
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}