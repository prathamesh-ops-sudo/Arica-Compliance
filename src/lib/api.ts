import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://d1z2tovkx40jvd.cloudfront.net';

// Flag to prevent multiple redirects
let isRedirecting = false;

// Error message mapping for user-friendly messages
const getErrorMessage = (error: AxiosError): string => {
  const status = error.response?.status;
  const data = error.response?.data as { message?: string } | undefined;
  
  if (data?.message) {
    return data.message;
  }
  
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Session expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again.';
    default:
      if (!error.response) {
        return 'Network error. Please check your connection.';
      }
      return 'An unexpected error occurred.';
  }
};

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // Handle 401 - try to refresh token
    if (error.response?.status === 401 && !isRedirecting) {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken && originalRequest) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });
          const { token, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api.request(originalRequest);
          }
        } catch {
          // Refresh failed - redirect to login
          isRedirecting = true;
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          toast.error('Session expired. Please log in again.');
          setTimeout(() => {
            window.location.href = '/login';
            isRedirecting = false;
          }, 1000);
        }
      } else if (!refreshToken) {
        // No refresh token - redirect to login
        isRedirecting = true;
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        toast.error('Please log in to continue.');
        setTimeout(() => {
          window.location.href = '/login';
          isRedirecting = false;
        }, 1000);
      }
    } else if (error.response?.status !== 401) {
      // Show toast for non-401 errors (401 handled above)
      const message = getErrorMessage(error);
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    keywords: string[];
    preferences: {
      alertFrequency: string;
      emailNotifications: boolean;
      darkMode: boolean;
    };
  };
}

export interface AnalyticsData {
  summary: {
    totalMentions: number;
    totalReach: number;
    avgEngagement: number;
    positivePercentage: number;
    negativePercentage: number;
    neutralPercentage: number;
  };
  charts: {
    sentimentDistribution: ChartData;
    mentionTrend: ChartData;
    topTopics: ChartData;
    shareOfVoice: ChartData;
  };
  dateRange: {
    from: string;
    to: string;
  };
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label?: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
  }>;
}

export interface ReportData {
  metadata: {
    generatedAt: string;
    dateRange: { from: string; to: string };
    keywords: string[];
  };
  summary: {
    totalMentions: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    positivePercentage: number;
    negativePercentage: number;
    neutralPercentage: number;
  };
  charts: {
    sentimentDistribution: ChartData;
    dailyTrend: ChartData;
    topTopics: ChartData;
    sourceBreakdown: ChartData;
  };
  topMentions: Array<{
    keyword: string;
    source: string;
    text: string;
    url: string;
    timestamp: string;
    sentiment: string;
    topics: string[];
    reach?: number;
  }>;
  recommendations: string[];
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/signup', credentials);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  refresh: async (refreshToken: string) => {
    const response = await api.post('/api/auth/refresh', { refreshToken });
    return response.data;
  },
};

export const keywordsApi = {
  getAll: async () => {
    const response = await api.get('/api/keywords');
    return response.data;
  },

  add: async (keyword: string) => {
    const response = await api.post('/api/keywords', { keyword });
    return response.data;
  },

  remove: async (keyword: string) => {
    const response = await api.delete(`/api/keywords/${encodeURIComponent(keyword)}`);
    return response.data;
  },
};

export const mentionsApi = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    sentiment?: string;
    source?: string;
    from?: string;
    to?: string;
  }) => {
    const response = await api.get('/api/mentions', { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/api/mentions/stats');
    return response.data;
  },
};

export const analyticsApi = {
  getOverview: async (params?: {
    keyword?: string;
    from?: string;
    to?: string;
    range?: '7d' | '30d' | '90d';
  }): Promise<AnalyticsData> => {
    const response = await api.get('/api/analytics/overview', { params });
    return response.data;
  },

  getTopMentions: async (params?: {
    limit?: number;
    sentiment?: string;
    from?: string;
    to?: string;
  }) => {
    const response = await api.get('/api/analytics/top-mentions', { params });
    return response.data;
  },
};

export const reportsApi = {
  generate: async (params: {
    range: '7d' | '30d' | 'custom';
    keywords?: string[];
    from?: string;
    to?: string;
  }): Promise<ReportData> => {
    const response = await api.post('/api/reports/generate', params);
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/api/reports/history');
    return response.data;
  },
};

export const healthApi = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export { API_BASE_URL };

export default api;
