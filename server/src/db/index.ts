import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'tvstation.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      avatar TEXT,
      created_at INTEGER NOT NULL,
      last_login INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tv_stations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      logo TEXT,
      created_at INTEGER NOT NULL,
      influence INTEGER NOT NULL DEFAULT 100,
      total_viewers INTEGER NOT NULL DEFAULT 0,
      total_ad_revenue REAL NOT NULL DEFAULT 0,
      avg_rating REAL NOT NULL DEFAULT 0,
      balance REAL NOT NULL DEFAULT 50000,
      level INTEGER NOT NULL DEFAULT 1,
      fans INTEGER NOT NULL DEFAULT 100,
      team_name TEXT,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      level INTEGER NOT NULL,
      skill REAL NOT NULL,
      loyalty REAL NOT NULL,
      salary INTEGER NOT NULL,
      hired_at INTEGER NOT NULL,
      tv_station_id TEXT NOT NULL,
      avatar TEXT,
      FOREIGN KEY (tv_station_id) REFERENCES tv_stations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      duration INTEGER NOT NULL,
      potential REAL NOT NULL,
      quality REAL NOT NULL,
      director_id TEXT,
      host_ids TEXT NOT NULL DEFAULT '[]',
      cameraman_ids TEXT NOT NULL DEFAULT '[]',
      reporter_ids TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      tv_station_id TEXT NOT NULL,
      rating REAL,
      total_viewers INTEGER,
      ad_revenue REAL,
      copyright_owned INTEGER NOT NULL DEFAULT 1,
      copyright_price REAL,
      FOREIGN KEY (tv_station_id) REFERENCES tv_stations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS schedule_items (
      id TEXT PRIMARY KEY,
      program_id TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled',
      current_viewers INTEGER NOT NULL DEFAULT 0,
      peak_viewers INTEGER NOT NULL DEFAULT 0,
      avg_viewers INTEGER NOT NULL DEFAULT 0,
      danmaku_count INTEGER NOT NULL DEFAULT 0,
      ad_revenue REAL NOT NULL DEFAULT 0,
      rating REAL NOT NULL DEFAULT 0,
      tv_station_id TEXT NOT NULL,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
      FOREIGN KEY (tv_station_id) REFERENCES tv_stations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS danmaku (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      tv_station_id TEXT NOT NULL,
      schedule_item_id TEXT NOT NULL,
      FOREIGN KEY (tv_station_id) REFERENCES tv_stations(id) ON DELETE CASCADE,
      FOREIGN KEY (schedule_item_id) REFERENCES schedule_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS battles (
      id TEXT PRIMARY KEY,
      challenger_id TEXT NOT NULL,
      defender_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      challenger_viewers INTEGER NOT NULL DEFAULT 0,
      defender_viewers INTEGER NOT NULL DEFAULT 0,
      winner_id TEXT,
      prize INTEGER NOT NULL DEFAULT 5000,
      category TEXT NOT NULL,
      FOREIGN KEY (challenger_id) REFERENCES tv_stations(id) ON DELETE CASCADE,
      FOREIGN KEY (defender_id) REFERENCES tv_stations(id) ON DELETE CASCADE,
      FOREIGN KEY (winner_id) REFERENCES tv_stations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      seller_id TEXT NOT NULL,
      buyer_id TEXT,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      price REAL NOT NULL,
      suggested_min REAL NOT NULL,
      suggested_max REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'listed',
      created_at INTEGER NOT NULL,
      sold_at INTEGER,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS random_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      impact TEXT NOT NULL DEFAULT '{}',
      tv_station_id TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (tv_station_id) REFERENCES tv_stations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS weekly_reports (
      id TEXT PRIMARY KEY,
      tv_station_id TEXT NOT NULL,
      week_start INTEGER NOT NULL,
      week_end INTEGER NOT NULL,
      total_viewers INTEGER NOT NULL DEFAULT 0,
      total_ad_revenue REAL NOT NULL DEFAULT 0,
      avg_rating REAL NOT NULL DEFAULT 0,
      program_heatmap TEXT NOT NULL DEFAULT '{}',
      employee_growth TEXT NOT NULL DEFAULT '{}',
      revenue_trend TEXT NOT NULL DEFAULT '[]',
      viewer_trend TEXT NOT NULL DEFAULT '[]',
      radar_data TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (tv_station_id) REFERENCES tv_stations(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tv_stations_owner ON tv_stations(owner_id);
    CREATE INDEX IF NOT EXISTS idx_employees_station ON employees(tv_station_id);
    CREATE INDEX IF NOT EXISTS idx_programs_station ON programs(tv_station_id);
    CREATE INDEX IF NOT EXISTS idx_schedule_station ON schedule_items(tv_station_id);
    CREATE INDEX IF NOT EXISTS idx_schedule_status ON schedule_items(status);
    CREATE INDEX IF NOT EXISTS idx_danmaku_station ON danmaku(tv_station_id);
    CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);
    CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON random_events(timestamp DESC);
  `);

  console.log('数据库初始化完成');
}
