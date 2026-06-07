import { db } from './index';
import { v4 as uuidv4 } from 'uuid';
import {
  User, TVStation, Employee, Program, ScheduleItem, Danmaku,
  Battle, Trade, RandomEvent, WeeklyReport
} from '../types';

export const userDAO = {
  create(username: string): User {
    const now = Date.now();
    const user: User = {
      id: uuidv4(),
      username,
      createdAt: now,
      lastLogin: now
    };
    db.prepare(`
      INSERT INTO users (id, username, avatar, created_at, last_login)
      VALUES (?, ?, ?, ?, ?)
    `).run(user.id, user.username, user.avatar || null, user.createdAt, user.lastLogin);
    return user;
  },

  getById(id: string): User | undefined {
    const row: any = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!row) return undefined;
    return {
      id: row.id,
      username: row.username,
      avatar: row.avatar || undefined,
      createdAt: row.created_at,
      lastLogin: row.last_login
    };
  },

  updateLastLogin(id: string): void {
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(Date.now(), id);
  }
};

export const tvStationDAO = {
  create(station: Omit<TVStation, 'employees' | 'programs' | 'schedule'>): TVStation {
    db.prepare(`
      INSERT INTO tv_stations (
        id, name, owner_id, category, description, logo, created_at,
        influence, total_viewers, total_ad_revenue, avg_rating,
        balance, level, fans, team_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      station.id, station.name, station.ownerId, station.category,
      station.description, station.logo || null, station.createdAt,
      station.influence, station.totalViewers, station.totalAdRevenue,
      station.avgRating, station.balance, station.level, station.fans,
      station.teamName || null
    );
    return { ...station, employees: [], programs: [], schedule: [] };
  },

  getById(id: string): TVStation | undefined {
    const row: any = db.prepare('SELECT * FROM tv_stations WHERE id = ?').get(id);
    if (!row) return undefined;
    return this.mapRow(row);
  },

  getByOwner(ownerId: string): TVStation | undefined {
    const row: any = db.prepare('SELECT * FROM tv_stations WHERE owner_id = ?').get(ownerId);
    if (!row) return undefined;
    return this.mapRow(row);
  },

  getAll(): TVStation[] {
    const rows: any[] = db.prepare('SELECT * FROM tv_stations ORDER BY created_at DESC').all();
    return rows.map(row => this.mapRow(row));
  },

  update(station: Partial<TVStation> & { id: string }): void {
    const fields = [];
    const values: any[] = [];
    
    const fieldMap: Record<string, string> = {
      name: 'name', ownerId: 'owner_id', category: 'category',
      description: 'description', logo: 'logo', influence: 'influence',
      totalViewers: 'total_viewers', totalAdRevenue: 'total_ad_revenue',
      avgRating: 'avg_rating', balance: 'balance', level: 'level',
      fans: 'fans', teamName: 'team_name'
    };

    for (const [key, value] of Object.entries(station)) {
      if (key === 'id') continue;
      const dbField = fieldMap[key];
      if (dbField) {
        fields.push(`${dbField} = ?`);
        values.push(value === undefined ? null : value);
      }
    }

    if (fields.length > 0) {
      values.push(station.id);
      db.prepare(`UPDATE tv_stations SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
  },

  mapRow(row: any): TVStation {
    return {
      id: row.id,
      name: row.name,
      ownerId: row.owner_id,
      category: row.category,
      description: row.description || '',
      logo: row.logo || undefined,
      createdAt: row.created_at,
      influence: row.influence,
      totalViewers: row.total_viewers,
      totalAdRevenue: row.total_ad_revenue,
      avgRating: row.avg_rating,
      balance: row.balance,
      level: row.level,
      fans: row.fans,
      teamName: row.team_name || undefined,
      employees: [],
      programs: [],
      schedule: []
    };
  },

  loadRelations(station: TVStation): TVStation {
    return {
      ...station,
      employees: employeeDAO.getByStation(station.id),
      programs: programDAO.getByStation(station.id),
      schedule: scheduleDAO.getByStation(station.id)
    };
  }
};

export const employeeDAO = {
  create(employee: Employee): Employee {
    db.prepare(`
      INSERT INTO employees (
        id, name, role, level, skill, loyalty, salary,
        hired_at, tv_station_id, avatar
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      employee.id, employee.name, employee.role, employee.level,
      employee.skill, employee.loyalty, employee.salary,
      employee.hiredAt, employee.tvStationId, employee.avatar || null
    );
    return employee;
  },

  getByStation(stationId: string): Employee[] {
    const rows: any[] = db.prepare('SELECT * FROM employees WHERE tv_station_id = ?').all(stationId);
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      role: row.role,
      level: row.level,
      skill: row.skill,
      loyalty: row.loyalty,
      salary: row.salary,
      hiredAt: row.hired_at,
      tvStationId: row.tv_station_id,
      avatar: row.avatar || undefined
    }));
  },

  getById(id: string): Employee | undefined {
    const row: any = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      role: row.role,
      level: row.level,
      skill: row.skill,
      loyalty: row.loyalty,
      salary: row.salary,
      hiredAt: row.hired_at,
      tvStationId: row.tv_station_id,
      avatar: row.avatar || undefined
    };
  },

  update(employee: Partial<Employee> & { id: string }): void {
    const fields = [];
    const values: any[] = [];
    
    const fieldMap: Record<string, string> = {
      name: 'name', role: 'role', level: 'level', skill: 'skill',
      loyalty: 'loyalty', salary: 'salary'
    };

    for (const [key, value] of Object.entries(employee)) {
      if (key === 'id') continue;
      const dbField = fieldMap[key];
      if (dbField) {
        fields.push(`${dbField} = ?`);
        values.push(value);
      }
    }

    if (fields.length > 0) {
      values.push(employee.id);
      db.prepare(`UPDATE employees SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
  },

  delete(id: string): void {
    db.prepare('DELETE FROM employees WHERE id = ?').run(id);
  }
};

export const programDAO = {
  create(program: Program): Program {
    db.prepare(`
      INSERT INTO programs (
        id, name, description, category, type, duration, potential, quality,
        director_id, host_ids, cameraman_ids, reporter_ids, created_at,
        tv_station_id, rating, total_viewers, ad_revenue, copyright_owned, copyright_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      program.id, program.name, program.description, program.category,
      program.type, program.duration, program.potential, program.quality,
      program.directorId || null, JSON.stringify(program.hostIds),
      JSON.stringify(program.cameramanIds), JSON.stringify(program.reporterIds),
      program.createdAt, program.tvStationId, program.rating || null,
      program.totalViewers || null, program.adRevenue || null,
      program.copyrightOwned ? 1 : 0, program.copyrightPrice || null
    );
    return program;
  },

  getByStation(stationId: string): Program[] {
    const rows: any[] = db.prepare('SELECT * FROM programs WHERE tv_station_id = ?').all(stationId);
    return rows.map(row => this.mapRow(row));
  },

  getById(id: string): Program | undefined {
    const row: any = db.prepare('SELECT * FROM programs WHERE id = ?').get(id);
    if (!row) return undefined;
    return this.mapRow(row);
  },

  update(program: Partial<Program> & { id: string }): void {
    const fields = [];
    const values: any[] = [];
    
    const fieldMap: Record<string, any> = {
      name: 'name', description: 'description', category: 'category',
      type: 'type', duration: 'duration', potential: 'potential',
      quality: 'quality', directorId: 'director_id',
      hostIds: (v: string[]) => ['host_ids = ?', JSON.stringify(v)],
      cameramanIds: (v: string[]) => ['cameraman_ids = ?', JSON.stringify(v)],
      reporterIds: (v: string[]) => ['reporter_ids = ?', JSON.stringify(v)],
      rating: 'rating', totalViewers: 'total_viewers',
      adRevenue: 'ad_revenue', copyrightOwned: (v: boolean) => ['copyright_owned = ?', v ? 1 : 0],
      copyrightPrice: 'copyright_price'
    };

    for (const [key, value] of Object.entries(program)) {
      if (key === 'id') continue;
      const mapper = fieldMap[key];
      if (mapper) {
        if (typeof mapper === 'function') {
          const [field, val] = mapper(value);
          fields.push(field);
          values.push(val);
        } else {
          fields.push(`${mapper} = ?`);
          values.push(value === undefined ? null : value);
        }
      }
    }

    if (fields.length > 0) {
      values.push(program.id);
      db.prepare(`UPDATE programs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
  },

  mapRow(row: any): Program {
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      category: row.category,
      type: row.type,
      duration: row.duration,
      potential: row.potential,
      quality: row.quality,
      directorId: row.director_id || undefined,
      hostIds: JSON.parse(row.host_ids || '[]'),
      cameramanIds: JSON.parse(row.cameraman_ids || '[]'),
      reporterIds: JSON.parse(row.reporter_ids || '[]'),
      createdAt: row.created_at,
      tvStationId: row.tv_station_id,
      rating: row.rating || undefined,
      totalViewers: row.total_viewers || undefined,
      adRevenue: row.ad_revenue || undefined,
      copyrightOwned: row.copyright_owned === 1,
      copyrightPrice: row.copyright_price || undefined
    };
  }
};

export const scheduleDAO = {
  create(item: ScheduleItem): ScheduleItem {
    db.prepare(`
      INSERT INTO schedule_items (
        id, program_id, start_time, end_time, status,
        current_viewers, peak_viewers, avg_viewers,
        danmaku_count, ad_revenue, rating, tv_station_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.id, item.programId, item.startTime, item.endTime, item.status,
      item.currentViewers, item.peakViewers, item.avgViewers,
      item.danmakuCount, item.adRevenue, item.rating, item.tvStationId
    );
    return item;
  },

  getByStation(stationId: string): ScheduleItem[] {
    const rows: any[] = db.prepare(
      'SELECT * FROM schedule_items WHERE tv_station_id = ? ORDER BY start_time DESC'
    ).all(stationId);
    return rows.map(row => this.mapRow(row));
  },

  getByStatus(status: ScheduleItem['status']): ScheduleItem[] {
    const rows: any[] = db.prepare(
      'SELECT * FROM schedule_items WHERE status = ? ORDER BY start_time'
    ).all(status);
    return rows.map(row => this.mapRow(row));
  },

  getById(id: string): ScheduleItem | undefined {
    const row: any = db.prepare('SELECT * FROM schedule_items WHERE id = ?').get(id);
    if (!row) return undefined;
    return this.mapRow(row);
  },

  update(item: Partial<ScheduleItem> & { id: string }): void {
    const fields = [];
    const values: any[] = [];
    
    const fieldMap: Record<string, string> = {
      programId: 'program_id', startTime: 'start_time', endTime: 'end_time',
      status: 'status', currentViewers: 'current_viewers',
      peakViewers: 'peak_viewers', avgViewers: 'avg_viewers',
      danmakuCount: 'danmaku_count', adRevenue: 'ad_revenue', rating: 'rating'
    };

    for (const [key, value] of Object.entries(item)) {
      if (key === 'id') continue;
      const dbField = fieldMap[key];
      if (dbField) {
        fields.push(`${dbField} = ?`);
        values.push(value);
      }
    }

    if (fields.length > 0) {
      values.push(item.id);
      db.prepare(`UPDATE schedule_items SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
  },

  delete(id: string): void {
    db.prepare('DELETE FROM schedule_items WHERE id = ?').run(id);
  },

  mapRow(row: any): ScheduleItem {
    return {
      id: row.id,
      programId: row.program_id,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
      currentViewers: row.current_viewers,
      peakViewers: row.peak_viewers,
      avgViewers: row.avg_viewers,
      danmakuCount: row.danmaku_count,
      adRevenue: row.ad_revenue,
      rating: row.rating,
      tvStationId: row.tv_station_id
    };
  }
};

export const danmakuDAO = {
  create(d: Danmaku): Danmaku {
    db.prepare(`
      INSERT INTO danmaku (id, content, user_id, username, timestamp, tv_station_id, schedule_item_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(d.id, d.content, d.userId, d.username, d.timestamp, d.tvStationId, d.scheduleItemId);
    return d;
  },

  getRecentByStation(stationId: string, limit: number = 50): Danmaku[] {
    const rows: any[] = db.prepare(
      'SELECT * FROM danmaku WHERE tv_station_id = ? ORDER BY timestamp DESC LIMIT ?'
    ).all(stationId, limit);
    return rows.map(row => ({
      id: row.id,
      content: row.content,
      userId: row.user_id,
      username: row.username,
      timestamp: row.timestamp,
      tvStationId: row.tv_station_id,
      scheduleItemId: row.schedule_item_id
    }));
  },

  deleteOld(before: number): void {
    db.prepare('DELETE FROM danmaku WHERE timestamp < ?').run(before);
  }
};

export const battleDAO = {
  create(battle: Battle): Battle {
    db.prepare(`
      INSERT INTO battles (
        id, challenger_id, defender_id, status, start_time, end_time,
        challenger_viewers, defender_viewers, winner_id, prize, category
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      battle.id, battle.challengerId, battle.defenderId, battle.status,
      battle.startTime, battle.endTime, battle.challengerViewers,
      battle.defenderViewers, battle.winnerId || null, battle.prize, battle.category
    );
    return battle;
  },

  getAll(): Battle[] {
    const rows: any[] = db.prepare('SELECT * FROM battles ORDER BY start_time DESC').all();
    return rows.map(row => this.mapRow(row));
  },

  getActive(): Battle[] {
    const rows: any[] = db.prepare(
      "SELECT * FROM battles WHERE status IN ('pending', 'active') ORDER BY start_time"
    ).all();
    return rows.map(row => this.mapRow(row));
  },

  update(battle: Partial<Battle> & { id: string }): void {
    const fields = [];
    const values: any[] = [];
    
    const fieldMap: Record<string, string> = {
      status: 'status', challengerViewers: 'challenger_viewers',
      defenderViewers: 'defender_viewers', winnerId: 'winner_id'
    };

    for (const [key, value] of Object.entries(battle)) {
      if (key === 'id') continue;
      const dbField = fieldMap[key];
      if (dbField) {
        fields.push(`${dbField} = ?`);
        values.push(value === undefined ? null : value);
      }
    }

    if (fields.length > 0) {
      values.push(battle.id);
      db.prepare(`UPDATE battles SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
  },

  mapRow(row: any): Battle {
    return {
      id: row.id,
      challengerId: row.challenger_id,
      defenderId: row.defender_id,
      status: row.status,
      startTime: row.start_time,
      endTime: row.end_time,
      challengerViewers: row.challenger_viewers,
      defenderViewers: row.defender_viewers,
      winnerId: row.winner_id || undefined,
      prize: row.prize,
      category: row.category
    };
  }
};

export const tradeDAO = {
  create(trade: Trade): Trade {
    db.prepare(`
      INSERT INTO trades (
        id, seller_id, buyer_id, item_type, item_id, item_name,
        price, suggested_min, suggested_max, status, created_at, sold_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      trade.id, trade.sellerId, trade.buyerId || null, trade.itemType,
      trade.itemId, trade.itemName, trade.price, trade.suggestedMin,
      trade.suggestedMax, trade.status, trade.createdAt, trade.soldAt || null
    );
    return trade;
  },

  getAllListed(): Trade[] {
    const rows: any[] = db.prepare(
      "SELECT * FROM trades WHERE status = 'listed' ORDER BY created_at DESC"
    ).all();
    return rows.map(row => this.mapRow(row));
  },

  getById(id: string): Trade | undefined {
    const row: any = db.prepare('SELECT * FROM trades WHERE id = ?').get(id);
    if (!row) return undefined;
    return this.mapRow(row);
  },

  getSoldInLast7Days(): Trade[] {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const rows: any[] = db.prepare(
      "SELECT * FROM trades WHERE status = 'sold' AND sold_at > ? ORDER BY sold_at DESC"
    ).all(weekAgo);
    return rows.map(row => this.mapRow(row));
  },

  update(trade: Partial<Trade> & { id: string }): void {
    const fields = [];
    const values: any[] = [];
    
    const fieldMap: Record<string, string> = {
      buyerId: 'buyer_id', status: 'status', soldAt: 'sold_at'
    };

    for (const [key, value] of Object.entries(trade)) {
      if (key === 'id') continue;
      const dbField = fieldMap[key];
      if (dbField) {
        fields.push(`${dbField} = ?`);
        values.push(value === undefined ? null : value);
      }
    }

    if (fields.length > 0) {
      values.push(trade.id);
      db.prepare(`UPDATE trades SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
  },

  mapRow(row: any): Trade {
    return {
      id: row.id,
      sellerId: row.seller_id,
      buyerId: row.buyer_id || undefined,
      itemType: row.item_type,
      itemId: row.item_id,
      itemName: row.item_name,
      price: row.price,
      suggestedMin: row.suggested_min,
      suggestedMax: row.suggested_max,
      status: row.status,
      createdAt: row.created_at,
      soldAt: row.sold_at || undefined
    };
  }
};

export const randomEventDAO = {
  create(event: RandomEvent): RandomEvent {
    db.prepare(`
      INSERT INTO random_events (id, type, title, description, impact, tv_station_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      event.id, event.type, event.title, event.description,
      JSON.stringify(event.impact), event.tvStationId || null, event.timestamp
    );
    return event;
  },

  getRecent(limit: number = 20): RandomEvent[] {
    const rows: any[] = db.prepare(
      'SELECT * FROM random_events ORDER BY timestamp DESC LIMIT ?'
    ).all(limit);
    return rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description,
      impact: JSON.parse(row.impact || '{}'),
      tvStationId: row.tv_station_id || undefined,
      timestamp: row.timestamp
    }));
  }
};

export const weeklyReportDAO = {
  create(report: WeeklyReport): WeeklyReport {
    db.prepare(`
      INSERT INTO weekly_reports (
        id, tv_station_id, week_start, week_end, total_viewers,
        total_ad_revenue, avg_rating, program_heatmap, employee_growth,
        revenue_trend, viewer_trend, radar_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      report.id, report.tvStationId, report.weekStart, report.weekEnd,
      report.totalViewers, report.totalAdRevenue, report.avgRating,
      JSON.stringify(report.programHeatmap), JSON.stringify(report.employeeGrowth),
      JSON.stringify(report.revenueTrend), JSON.stringify(report.viewerTrend),
      JSON.stringify(report.radarData)
    );
    return report;
  },

  getByStation(stationId: string): WeeklyReport[] {
    const rows: any[] = db.prepare(
      'SELECT * FROM weekly_reports WHERE tv_station_id = ? ORDER BY week_start DESC'
    ).all(stationId);
    return rows.map(row => ({
      id: row.id,
      tvStationId: row.tv_station_id,
      weekStart: row.week_start,
      weekEnd: row.week_end,
      totalViewers: row.total_viewers,
      totalAdRevenue: row.total_ad_revenue,
      avgRating: row.avg_rating,
      programHeatmap: JSON.parse(row.program_heatmap || '{}'),
      employeeGrowth: JSON.parse(row.employee_growth || '{}'),
      revenueTrend: JSON.parse(row.revenue_trend || '[]'),
      viewerTrend: JSON.parse(row.viewer_trend || '[]'),
      radarData: JSON.parse(row.radar_data || '{}')
    }));
  }
};
