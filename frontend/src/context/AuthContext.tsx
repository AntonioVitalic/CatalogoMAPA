
import { createContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  role: UserRole | null;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  role: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('mapa_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setRole(parsedUser.role);
    } else {
      // For demo purposes, auto-login as visitor
      const visitorUser = mockUsers.find(u => u.role === 'visitor');
      if (visitorUser) {
        setUser(visitorUser);
        setRole('visitor');
        localStorage.setItem('mapa_user', JSON.stringify(visitorUser));
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // In a real app, this would validate credentials with an API
    const foundUser = mockUsers.find(u => u.email === email);
    
    if (foundUser) {
      setUser(foundUser);
      setRole(foundUser.role);
      localStorage.setItem('mapa_user', JSON.stringify(foundUser));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('mapa_user');
    
    // For demo purposes, auto-login as visitor after logout
    const visitorUser = mockUsers.find(u => u.role === 'visitor');
    if (visitorUser) {
      setUser(visitorUser);
      setRole('visitor');
      localStorage.setItem('mapa_user', JSON.stringify(visitorUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, role }}>
      {children}
    </AuthContext.Provider>
  );
};
