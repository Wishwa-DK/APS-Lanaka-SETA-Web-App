// API utility for making requests to the backend
const API_BASE_URL = 'https://aps-lanaka-seta-web-app-production.up.railway.app/api'; // Use Next.js API routes as proxy

// Registration response from backend
interface RegisterResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department: string;
    role: string;
  };
}

// Login response from backend
interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    employeeId: string;
    department: string;
    role: string;
    lastLogin: string;
  };
}

// Generic API request function
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    console.log('Making API request to:', url);
    console.log('Config:', config);

    const response = await fetch(url, config);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      endpoint,
      options
    });
    
    // Re-throw the error instead of returning a success object
    throw error;
  }
}

// Auth API functions
export const authApi = {
  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    employeeId: string;
    department: string;
    role?: string;
  }): Promise<RegisterResponse> {
    return apiRequest<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async login(credentials: { email: string; password: string }): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async logout() {
    return apiRequest('/api/auth/logout', {
      method: 'POST',
    });
  },

  async getProfile() {
    return apiRequest('/api/auth/profile');
  },
};

// Training API functions
export const trainingApi = {
  async getModules(params?: { page?: number; limit?: number; search?: string; category?: string }) {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest(`/api/training${queryString}`);
  },

  async getModule(id: string) {
    return apiRequest(`/api/training/${id}`);
  },

  async createModule(moduleData: any) {
    return apiRequest('/api/training', {
      method: 'POST',
      body: JSON.stringify(moduleData),
    });
  },

  async updateModule(id: string, moduleData: any) {
    return apiRequest(`/api/training/${id}`, {
      method: 'PUT',
      body: JSON.stringify(moduleData),
    });
  },

  async deleteModule(id: string) {
    return apiRequest(`/api/training/${id}`, {
      method: 'DELETE',
    });
  },

  async enrollInModule(id: string) {
    return apiRequest(`/api/training/${id}/enroll`, {
      method: 'POST',
    });
  },

  async updateProgress(id: string, progress: number, completed?: boolean) {
    return apiRequest(`/api/training/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify({ progress, completed }),
    });
  },

  async getUserProgress() {
    return apiRequest('/api/training/user/progress');
  },
};

// Policy API functions
export const policyApi = {
  async getPolicies(params?: { page?: number; limit?: number; search?: string }) {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest(`/api/policies${queryString}`);
  },

  async getPolicy(id: string) {
    return apiRequest(`/api/policies/${id}`);
  },

  async createPolicy(policyData: any) {
    return apiRequest('/api/policies', {
      method: 'POST',
      body: JSON.stringify(policyData),
    });
  },

  async updatePolicy(id: string, policyData: any) {
    return apiRequest(`/api/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(policyData),
    });
  },

  async deletePolicy(id: string) {
    return apiRequest(`/api/policies/${id}`, {
      method: 'DELETE',
    });
  },

  async acknowledgePolicy(id: string) {
    return apiRequest(`/api/policies/${id}/acknowledge`, {
      method: 'POST',
    });
  },
};

// Generic utility functions
export const api = {
  request: apiRequest,
  setAuthToken: (token: string) => {
    localStorage.setItem('authToken', token);
  },
  removeAuthToken: () => {
    localStorage.removeItem('authToken');
  },
  getAuthToken: () => {
    return localStorage.getItem('authToken');
  },
};

export default api;