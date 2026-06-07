import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, TVStation, Program, Employee, ScheduleItem } from '../types';
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
    console.log('检查本地存储的用户ID:', savedUserId);
    
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
      console.log('加入电视台频道:', tvStation.id);
      socketService.joinStation(tvStation.id);
      
      const handleStationUpdate = (data: any) => {
        console.log('收到电视台更新:', data);
        if (data.stationId === tvStation.id) {
          setTvStation(prev => {
            if (!prev) return prev;
            
            let updatedSchedule: ScheduleItem[] = prev.schedule;
            if (data.schedule && Array.isArray(data.schedule)) {
              updatedSchedule = data.schedule.map((s: any) => ({
                ...s,
                startTime: s.startTime || s.start_time,
                endTime: s.endTime || s.end_time,
                currentViewers: s.currentViewers ?? s.current_viewers ?? 0,
                peakViewers: s.peakViewers ?? s.peak_viewers ?? 0,
                avgViewers: s.avgViewers ?? s.avg_viewers ?? 0,
                danmakuCount: s.danmakuCount ?? s.danmaku_count ?? 0,
                adRevenue: s.adRevenue ?? s.ad_revenue ?? 0
              }));
            }

            let updatedEmployees: Employee[] = prev.employees;
            if (data.employees && Array.isArray(data.employees)) {
              updatedEmployees = data.employees.map((e: any) => ({
                ...e,
                tvStationId: e.tvStationId || e.tv_station_id,
                hiredAt: e.hiredAt || e.hired_at
              }));
            }

            let updatedPrograms: Program[] = prev.programs;
            if (data.stationPrograms && Array.isArray(data.stationPrograms)) {
              updatedPrograms = data.stationPrograms.map((p: any) => ({
                ...p,
                tvStationId: p.tvStationId || p.tv_station_id,
                createdAt: p.createdAt || p.created_at,
                hostIds: p.hostIds || p.host_ids || [],
                cameramanIds: p.cameramanIds || p.cameraman_ids || [],
                reporterIds: p.reporterIds || p.reporter_ids || [],
                directorId: p.directorId || p.director_id,
                copyrightOwned: p.copyrightOwned ?? p.copyright_owned ?? true
              }));
            }

            const updated = {
              ...prev,
              balance: data.balance ?? prev.balance,
              fans: data.fans ?? prev.fans,
              level: data.level ?? prev.level,
              influence: data.influence ?? prev.influence,
              totalViewers: data.totalViewers ?? data.total_viewers ?? prev.totalViewers,
              totalAdRevenue: data.totalAdRevenue ?? data.total_ad_revenue ?? prev.totalAdRevenue,
              avgRating: data.avgRating ?? data.avg_rating ?? prev.avgRating,
              schedule: updatedSchedule,
              employees: updatedEmployees,
              programs: updatedPrograms
            };
            
            console.log('更新后的电视台状态:', updated);
            return updated;
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
      console.log('加载用户:', userId);
      const userData = await userAPI.get(userId);
      console.log('用户数据:', userData);
      setUser(userData);
      
      try {
        const station = await tvStationAPI.getByOwner(userId);
        console.log('电视台数据:', station);
        setTvStation(station);
      } catch (err) {
        console.log('用户还没有电视台');
        setTvStation(null);
      }
    } catch (err) {
      console.error('加载用户失败:', err);
      localStorage.removeItem('userId');
    }
    setLoading(false);
  };

  const login = async (username: string) => {
    console.log('用户登录:', username);
    const userData = await userAPI.create(username);
    console.log('登录成功:', userData);
    setUser(userData);
    localStorage.setItem('userId', userData.id);
    
    try {
      const station = await tvStationAPI.getByOwner(userData.id);
      console.log('用户已有电视台:', station);
      setTvStation(station);
    } catch {
      console.log('用户需要创建电视台');
      setTvStation(null);
    }
  };

  const createStation = async (name: string, category: TVStation['category'], description: string) => {
    if (!user) throw new Error('用户未登录');
    
    console.log('创建电视台:', { name, category, description });
    const station = await tvStationAPI.create({
      ownerId: user.id,
      name,
      category,
      description
    });
    console.log('电视台创建成功:', station);
    setTvStation(station);
  };

  const refreshStation = async () => {
    if (!user) return;
    try {
      const station = await tvStationAPI.getByOwner(user.id);
      console.log('刷新电视台数据:', station);
      setTvStation(station);
    } catch {
      setTvStation(null);
    }
  };

  const logout = () => {
    console.log('用户登出');
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
