import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, TVStation } from '../types';
import { userAPI, tvStationAPI } from '../services/api';
import { socketService } from '../services/socket';

interface AppContextType {
  user: User | null;
  tvStation: TVStation | null;
  loading: boolean;
  login: (username: string) => Promise<void>;
  createStation: (name: string, category: TVStation['category'], description: string) => Promise<void>;
  refreshStation: () => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tvStation, setTvStation] = useState<TVStation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
      loadUser(savedUserId);
    } else {
      setLoading(false);
    }

    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (tvStation) {
      socketService.joinStation(tvStation.id);
      
      const handleStationUpdate = (data: any) => {
        if (data.stationId === tvStation.id) {
          setTvStation(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              balance: data.balance,
              fans: data.fans,
              level: data.level,
              schedule: data.schedule || prev.schedule,
              employees: data.employees || prev.employees,
              programs: data.stationPrograms || prev.programs
            };
          });
        }
      };

      socketService.on('station_update', handleStationUpdate);
      
      return () => {
        socketService.off('station_update', handleStationUpdate);
        socketService.leaveStation(tvStation.id);
      };
    }
  }, [tvStation?.id]);

  const loadUser = async (userId: string) => {
    try {
      const userData = await userAPI.get(userId);
      setUser(userData);
      
      try {
        const station = await tvStationAPI.getByOwner(userId);
        setTvStation(station);
      } catch {
        setTvStation(null);
      }
    } catch {
      localStorage.removeItem('userId');
    }
    setLoading(false);
  };

  const login = async (username: string) => {
    const userData = await userAPI.create(username);
    setUser(userData);
    localStorage.setItem('userId', userData.id);
    
    try {
      const station = await tvStationAPI.getByOwner(userData.id);
      setTvStation(station);
    } catch {
      setTvStation(null);
    }
  };

  const createStation = async (name: string, category: TVStation['category'], description: string) => {
    if (!user) throw new Error('用户未登录');
    
    const station = await tvStationAPI.create({
      ownerId: user.id,
      name,
      category,
      description
    });
    setTvStation(station);
  };

  const refreshStation = async () => {
    if (!user) return;
    try {
      const station = await tvStationAPI.getByOwner(user.id);
      setTvStation(station);
    } catch {
      setTvStation(null);
    }
  };

  const logout = () => {
    setUser(null);
    setTvStation(null);
    localStorage.removeItem('userId');
  };

  return (
    <AppContext.Provider value={{ user, tvStation, loading, login, createStation, refreshStation, logout }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
