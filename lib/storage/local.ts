// Local storage utilities for data persistence
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'homeowner' | 'business_owner' | 'contractor' | 'admin';
  created_at: string;
}

export interface Contractor {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  service_areas: string[];
  trades: string[];
  capacity: 'active' | 'paused';
  calendly_url?: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id?: string;
  status: 'submitted' | 'matched' | 'scheduled' | 'onsite' | 'packet_sent' | 'paid' | 'completed';
  address: string;
  city: string;
  state: string;
  zip: string;
  peril: 'flood' | 'water' | 'wind' | 'fire' | 'mold' | 'other';
  incident_at: string;
  description: string;
  policy_number?: string;
  carrier_name?: string;
  assigned_contractor_id?: string;
  packet_url?: string;
  payment_status: 'unpaid' | 'pending' | 'paid' | 'refunded';
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  preferred_date: string;
  preferred_window: '8-10' | '10-12' | '12-2' | '2-4' | '4-6';
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  project_id: string;
  type: 'photo' | 'video';
  room_tag?: string;
  storage_path: string;
  caption?: string;
  created_at: string;
}

// Generate UUID
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Local storage keys
const STORAGE_KEYS = {
  USERS: 'disastershield_users',
  CONTRACTORS: 'disastershield_contractors',
  PROJECTS: 'disastershield_projects',
  MEDIA: 'disastershield_media',
  CURRENT_USER: 'disastershield_current_user',
  SESSION: 'disastershield_session'
};

// Generic storage functions
function getFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// User management
export const userStorage = {
  create: (userData: Omit<User, 'id' | 'created_at'>): User => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    const newUser: User = {
      ...userData,
      id: generateId(),
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  findByEmail: (email: string): User | null => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    return users.find(user => user.email === email) || null;
  },

  findById: (id: string): User | null => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    return users.find(user => user.id === id) || null;
  }
};

// Contractor management
export const contractorStorage = {
  create: (contractorData: Omit<Contractor, 'id' | 'created_at'>): Contractor => {
    const contractors = getFromStorage<Contractor>(STORAGE_KEYS.CONTRACTORS);
    const newContractor: Contractor = {
      ...contractorData,
      id: generateId(),
      created_at: new Date().toISOString()
    };
    contractors.push(newContractor);
    saveToStorage(STORAGE_KEYS.CONTRACTORS, contractors);
    return newContractor;
  },

  findByUserId: (userId: string): Contractor | null => {
    const contractors = getFromStorage<Contractor>(STORAGE_KEYS.CONTRACTORS);
    return contractors.find(contractor => contractor.user_id === userId) || null;
  },

  findActive: (): Contractor[] => {
    const contractors = getFromStorage<Contractor>(STORAGE_KEYS.CONTRACTORS);
    return contractors.filter(contractor => contractor.capacity === 'active');
  },

  update: (id: string, updates: Partial<Contractor>): Contractor | null => {
    const contractors = getFromStorage<Contractor>(STORAGE_KEYS.CONTRACTORS);
    const index = contractors.findIndex(contractor => contractor.id === id);
    if (index === -1) return null;
    
    contractors[index] = { ...contractors[index], ...updates };
    saveToStorage(STORAGE_KEYS.CONTRACTORS, contractors);
    return contractors[index];
  }
};

// Project management
export const projectStorage = {
  create: (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Project => {
    const projects = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    const newProject: Project = {
      ...projectData,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    projects.push(newProject);
    saveToStorage(STORAGE_KEYS.PROJECTS, projects);
    return newProject;
  },

  findById: (id: string): Project | null => {
    const projects = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    return projects.find(project => project.id === id) || null;
  },

  findByUserId: (userId: string): Project[] => {
    const projects = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    return projects.filter(project => project.user_id === userId);
  },

  findByContractorId: (contractorId: string): Project[] => {
    const projects = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    return projects.filter(project => project.assigned_contractor_id === contractorId);
  },

  update: (id: string, updates: Partial<Project>): Project | null => {
    const projects = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    const index = projects.findIndex(project => project.id === id);
    if (index === -1) return null;
    
    projects[index] = { ...projects[index], ...updates, updated_at: new Date().toISOString() };
    saveToStorage(STORAGE_KEYS.PROJECTS, projects);
    return projects[index];
  },

  getAll: (): Project[] => {
    return getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
  }
};

// Media management
export const mediaStorage = {
  create: (mediaData: Omit<Media, 'id' | 'created_at'>): Media => {
    const media = getFromStorage<Media>(STORAGE_KEYS.MEDIA);
    const newMedia: Media = {
      ...mediaData,
      id: generateId(),
      created_at: new Date().toISOString()
    };
    media.push(newMedia);
    saveToStorage(STORAGE_KEYS.MEDIA, media);
    return newMedia;
  },

  findByProjectId: (projectId: string): Media[] => {
    const media = getFromStorage<Media>(STORAGE_KEYS.MEDIA);
    return media.filter(item => item.project_id === projectId);
  }
};

// Session management
export const sessionStorage = {
  setCurrentUser: (user: User): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role,
      loginTime: new Date().toISOString()
    }));
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userData ? JSON.parse(userData) : null;
  },

  clearSession: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.SESSION) !== null;
  }
};