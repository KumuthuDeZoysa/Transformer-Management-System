// Authentication API calls using JWT

import { tokenManager } from './jwt-token';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupData {
  username: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  message: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export const authApi = {
  // Login with username and password
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    
    // Save token and user data
    if (data.token) {
      tokenManager.setToken(data.token);
      tokenManager.setUser(data.user);
    }

    return data;
  },

  // Signup new user
  async signup(signupData: SignupData): Promise<AuthResponse> {
    const response = await fetch(`${BACKEND_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    const data = await response.json();
    
    // Save token and user data
    if (data.token) {
      tokenManager.setToken(data.token);
      tokenManager.setUser(data.user);
    }

    return data;
  },

  // Get current user
  async getCurrentUser() {
    const response = await fetch(`${BACKEND_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    return response.json();
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...tokenManager.getAuthHeader(),
        },
      });
    } finally {
      // Always remove token locally, even if API call fails
      tokenManager.removeToken();
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return tokenManager.isAuthenticated();
  },

  // Get current user from local storage
  getCurrentUserLocal() {
    return tokenManager.getUser();
  },

  // Role-based access control helpers
  hasRole(role: string): boolean {
    const user = tokenManager.getUser();
    return user?.role === role;
  },

  hasAnyRole(roles: string[]): boolean {
    const user = tokenManager.getUser();
    return user ? roles.includes(user.role) : false;
  },

  canEditMaintenanceRecords(): boolean {
    return this.hasAnyRole(['ENGINEER', 'ADMIN']);
  },

  canDeleteMaintenanceRecords(): boolean {
    return this.hasRole('ADMIN');
  },
};
