export type ChannelCategory = 'news' | 'music' | 'gaming' | 'food' | 'sports' | 'entertainment' | 'tech' | 'education';

export type EmployeeRole = 'host' | 'director' | 'cameraman' | 'reporter';

export type ProgramType = 'live' | 'recorded';

export type ProgramStatus = 'scheduled' | 'airing' | 'completed' | 'cancelled';

export type BattleStatus = 'pending' | 'active' | 'completed';

export type TradeStatus = 'listed' | 'sold' | 'cancelled';

export interface User {
  id: string;
  username: string;
  avatar?: string;
  createdAt: number;
  lastLogin: number;
}

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  level: number;
  skill: number;
  loyalty: number;
  salary: number;
  hiredAt: number;
  tvStationId: string;
  avatar?: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  category: ChannelCategory;
  type: ProgramType;
  duration: number;
  potential: number;
  quality: number;
  directorId?: string;
  hostIds: string[];
  cameramanIds: string[];
  reporterIds: string[];
  createdAt: number;
  tvStationId: string;
  rating?: number;
  totalViewers?: number;
  adRevenue?: number;
  copyrightOwned: boolean;
  copyrightPrice?: number;
}

export interface ScheduleItem {
  id: string;
  programId: string;
  startTime: number;
  endTime: number;
  status: ProgramStatus;
  currentViewers: number;
  peakViewers: number;
  avgViewers: number;
  danmakuCount: number;
  adRevenue: number;
  rating: number;
  tvStationId: string;
}

export interface TVStation {
  id: string;
  name: string;
  ownerId: string;
  category: ChannelCategory;
  description: string;
  logo?: string;
  createdAt: number;
  influence: number;
  totalViewers: number;
  totalAdRevenue: number;
  avgRating: number;
  employees: Employee[];
  programs: Program[];
  schedule: ScheduleItem[];
  balance: number;
  level: number;
  fans: number;
  teamName?: string;
}

export interface Danmaku {
  id: string;
  content: string;
  userId: string;
  username: string;
  timestamp: number;
  tvStationId: string;
  scheduleItemId: string;
}

export interface Battle {
  id: string;
  challengerId: string;
  defenderId: string;
  status: BattleStatus;
  startTime: number;
  endTime: number;
  challengerViewers: number;
  defenderViewers: number;
  winnerId?: string;
  prize: number;
  category: ChannelCategory;
}

export interface Trade {
  id: string;
  sellerId: string;
  buyerId?: string;
  itemType: 'copyright' | 'contract';
  itemId: string;
  itemName: string;
  price: number;
  suggestedMin: number;
  suggestedMax: number;
  status: TradeStatus;
  createdAt: number;
  soldAt?: number;
}

export interface RandomEvent {
  id: string;
  type: 'equipment_failure' | 'breaking_news' | 'celebrity_guest' | 'technical_breakthrough';
  title: string;
  description: string;
  impact: {
    viewers?: number;
    rating?: number;
    adRevenue?: number;
  };
  tvStationId?: string;
  timestamp: number;
}

export interface WeeklyReport {
  id: string;
  tvStationId: string;
  weekStart: number;
  weekEnd: number;
  totalViewers: number;
  totalAdRevenue: number;
  avgRating: number;
  programHeatmap: Record<string, number>;
  employeeGrowth: Record<string, { skill: number; loyalty: number }>;
  revenueTrend: number[];
  viewerTrend: number[];
  radarData: {
    content: number;
    production: number;
    influence: number;
    profitability: number;
    team: number;
  };
}

export interface LeaderboardEntry {
  tvStationId: string;
  tvStationName: string;
  ownerName: string;
  totalViewers: number;
  avgRating: number;
  totalAdRevenue: number;
  influence: number;
  rank: number;
}
