import axios from 'axios';
import { TVStation, User, Employee, Program, ScheduleItem, Battle, Trade, Danmaku, RandomEvent, LeaderboardEntry, WeeklyReport, ChannelCategory, EmployeeRole, ProgramType } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const userAPI = {
  create: (username: string) => api.post<User>('/users', { username }).then(res => res.data),
  get: (id: string) => api.get<User>(`/users/${id}`).then(res => res.data),
};

export const tvStationAPI = {
  create: (data: { ownerId: string; name: string; category: ChannelCategory; description: string }) =>
    api.post<TVStation>('/tv-stations', data).then(res => res.data),
  get: (id: string) => api.get<TVStation>(`/tv-stations/${id}`).then(res => res.data),
  getByOwner: (ownerId: string) => api.get<TVStation>(`/tv-stations/owner/${ownerId}`).then(res => res.data),
  getAll: () => api.get<TVStation[]>('/tv-stations').then(res => res.data),
  hireEmployee: (stationId: string, role: EmployeeRole) =>
    api.post<Employee>(`/tv-stations/${stationId}/employees`, { role }).then(res => res.data),
  fireEmployee: (stationId: string, employeeId: string) =>
    api.delete(`/tv-stations/${stationId}/employees/${employeeId}`).then(res => res.data),
  createProgram: (stationId: string, data: {
    name: string;
    category: ChannelCategory;
    type: ProgramType;
    duration: number;
    directorId?: string;
    hostIds: string[];
    cameramanIds: string[];
    reporterIds: string[];
  }) => api.post<Program>(`/tv-stations/${stationId}/programs`, data).then(res => res.data),
  scheduleProgram: (stationId: string, programId: string, startTime: number) =>
    api.post<ScheduleItem>(`/tv-stations/${stationId}/schedule`, { programId, startTime }).then(res => res.data),
  cancelSchedule: (stationId: string, scheduleId: string) =>
    api.delete(`/tv-stations/${stationId}/schedule/${scheduleId}`).then(res => res.data),
  sendDanmaku: (stationId: string, data: { scheduleItemId: string; userId: string; username: string; content: string }) =>
    api.post<Danmaku>(`/tv-stations/${stationId}/danmaku`, data).then(res => res.data),
  getDanmaku: (stationId: string) =>
    api.get<Danmaku[]>(`/tv-stations/${stationId}/danmaku`).then(res => res.data),
  generateWeeklyReport: (stationId: string) =>
    api.post<WeeklyReport>(`/tv-stations/${stationId}/reports/weekly`).then(res => res.data),
};

export const battleAPI = {
  create: (data: { challengerId: string; defenderId: string; category: ChannelCategory }) =>
    api.post<Battle>('/battles', data).then(res => res.data),
  getAll: () => api.get<Battle[]>('/battles').then(res => res.data),
  getActive: () => api.get<Battle[]>('/battles/active').then(res => res.data),
};

export const tradeAPI = {
  list: (data: { sellerId: string; itemType: 'copyright' | 'contract'; itemId: string; itemName: string; price: number }) =>
    api.post<Trade>('/trades', data).then(res => res.data),
  buy: (tradeId: string, buyerId: string) =>
    api.post<Trade>(`/trades/${tradeId}/buy`, { buyerId }).then(res => res.data),
  getAll: () => api.get<Trade[]>('/trades').then(res => res.data),
};

export const systemAPI = {
  getCategories: () => api.get<Record<ChannelCategory, string>>('/categories').then(res => res.data),
  getRoles: () => api.get<Record<EmployeeRole, string>>('/roles').then(res => res.data),
  getEvents: () => api.get<RandomEvent[]>('/events').then(res => res.data),
  getLeaderboard: () => api.get<LeaderboardEntry[]>('/leaderboard').then(res => res.data),
  health: () => api.get('/health').then(res => res.data),
};
