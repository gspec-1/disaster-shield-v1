// Local authentication utilities
import { userStorage, sessionStorage, User } from '../storage/local';

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: 'homeowner' | 'business_owner' | 'contractor' | 'admin';
}

export interface SignInData {
  email: string;
  password: string;
}

// Simple password hashing (in production, use proper bcrypt)
function hashPassword(password: string): string {
  // This is a simple hash for demo purposes - use proper hashing in production
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

// Store passwords separately (in production, use proper secure storage)
const PASSWORD_STORAGE_KEY = 'disastershield_passwords';

function getPasswords(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(PASSWORD_STORAGE_KEY);
  return data ? JSON.parse(data) : {};
}

function savePassword(email: string, hashedPassword: string): void {
  if (typeof window === 'undefined') return;
  const passwords = getPasswords();
  passwords[email] = hashedPassword;
  localStorage.setItem(PASSWORD_STORAGE_KEY, JSON.stringify(passwords));
}

function verifyPassword(email: string, password: string): boolean {
  const passwords = getPasswords();
  const hashedPassword = hashPassword(password);
  return passwords[email] === hashedPassword;
}

export const localAuth = {
  signUp: async (data: SignUpData): Promise<{ user: User; error: null } | { user: null; error: string }> => {
    try {
      // Check if user already exists
      const existingUser = userStorage.findByEmail(data.email);
      if (existingUser) {
        return { user: null, error: 'User already exists with this email' };
      }

      // Create user
      const user = userStorage.create({
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        role: data.role
      });

      // Store password
      const hashedPassword = hashPassword(data.password);
      savePassword(data.email, hashedPassword);

      // Set session
      sessionStorage.setCurrentUser(user);

      return { user, error: null };
    } catch (error) {
      return { user: null, error: 'Failed to create account' };
    }
  },

  signIn: async (data: SignInData): Promise<{ user: User; error: null } | { user: null; error: string }> => {
    try {
      // Find user
      const user = userStorage.findByEmail(data.email);
      if (!user) {
        return { user: null, error: 'Invalid email or password' };
      }

      // Verify password
      if (!verifyPassword(data.email, data.password)) {
        return { user: null, error: 'Invalid email or password' };
      }

      // Set session
      sessionStorage.setCurrentUser(user);

      return { user, error: null };
    } catch (error) {
      return { user: null, error: 'Failed to sign in' };
    }
  },

  signOut: async (): Promise<void> => {
    sessionStorage.clearSession();
  },

  getCurrentUser: (): User | null => {
    return sessionStorage.getCurrentUser();
  },

  isAuthenticated: (): boolean => {
    return sessionStorage.isAuthenticated();
  }
};