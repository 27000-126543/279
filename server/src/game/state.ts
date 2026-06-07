import { v4 as uuidv4 } from 'uuid';
import {
  TVStation, Employee, Program, ScheduleItem, Battle, Trade,
  Danmaku, RandomEvent, WeeklyReport, LeaderboardEntry,
  ChannelCategory, ProgramType, EmployeeRole
} from '../types';
import {
  userDAO, tvStationDAO, employeeDAO, programDAO, scheduleDAO,
  danmakuDAO, battleDAO, tradeDAO, randomEventDAO, weeklyReportDAO
} from '../db/dao';
import { generateEmployee, calculateProgramPotential, calculateProgramQuality, generateProgramName } from '../utils/generator';

export type IOType = {
  to: (room: string) => { emit: (event: string, data: any) => void };
  emit: (event: string, data: any) => void;
};

class GameState {
  private static instance: GameState;
  private io: IOType | null = null;

  private constructor() {}

  static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  setIO(io: IOType): void {
    this.io = io;
  }

  getUser(id: string) {
    return userDAO.getById(id);
  }

  createUser(username: string) {
    const user = userDAO.create(username);
    return user;
  }

  getTVStation(id: string): TVStation | undefined {
    const station = tvStationDAO.getById(id);
    if (station) {
      return tvStationDAO.loadRelations(station);
    }
    return undefined;
  }

  getTVStationByOwner(ownerId: string): TVStation | undefined {
    const station = tvStationDAO.getByOwner(ownerId);
    if (station) {
      return tvStationDAO.loadRelations(station);
    }
    return undefined;
  }

  getAllTVStations(): TVStation[] {
    const stations = tvStationDAO.getAll();
    return stations.map(s => tvStationDAO.loadRelations(s));
  }

  addTVStation(station: TVStation): void {
    tvStationDAO.create({
      id: station.id,
      name: station.name,
      ownerId: station.ownerId,
      category: station.category,
      description: station.description,
      logo: station.logo,
      createdAt: station.createdAt,
      influence: station.influence,
      totalViewers: station.totalViewers,
      totalAdRevenue: station.totalAdRevenue,
      avgRating: station.avgRating,
      balance: station.balance,
      level: station.level,
      fans: station.fans,
      teamName: station.teamName
    });

    station.employees.forEach(e => employeeDAO.create(e));
    station.programs.forEach(p => programDAO.create(p));
    station.schedule.forEach(s => scheduleDAO.create(s));
  }

  hireEmployee(tvStationId: string, role: EmployeeRole): Employee {
    const station = tvStationDAO.getById(tvStationId);
    if (!station) throw new Error('电视台不存在');

    const employee = generateEmployee(role, tvStationId, station.level);

    if (station.balance < employee.salary * 12) {
      throw new Error('资金不足，无法支付员工年薪');
    }

    station.balance -= employee.salary * 12;
    tvStationDAO.update({ id: tvStationId, balance: station.balance });
    employeeDAO.create(employee);

    this.broadcastStationUpdate(tvStationId);

    return employee;
  }

  fireEmployee(tvStationId: string, employeeId: string): void {
    const station = tvStationDAO.getById(tvStationId);
    const employee = employeeDAO.getById(employeeId);
    
    if (!station || !employee) throw new Error('数据不存在');

    const severance = employee.salary * 3;
    if (station.balance < severance) {
      throw new Error('资金不足，无法支付遣散费');
    }

    station.balance -= severance;
    tvStationDAO.update({ id: tvStationId, balance: station.balance });
    employeeDAO.delete(employeeId);

    this.broadcastStationUpdate(tvStationId);
  }

  createProgram(
    tvStationId: string,
    name: string,
    category: ChannelCategory,
    type: ProgramType,
    duration: number,
    directorId?: string,
    hostIds: string[] = [],
    cameramanIds: string[] = [],
    reporterIds: string[] = []
  ): Program {
    const station = tvStationDAO.getById(tvStationId);
    if (!station) throw new Error('电视台不存在');

    const employees = employeeDAO.getByStation(tvStationId);
    const director = directorId ? employees.find(e => e.id === directorId) : undefined;
    const hosts = hostIds.map(id => employees.find(e => e.id === id)!).filter(Boolean);
    const cameramen = cameramanIds.map(id => employees.find(e => e.id === id)!).filter(Boolean);
    const reporters = reporterIds.map(id => employees.find(e => e.id === id)!).filter(Boolean);

    const productionCost = duration * 100 + hosts.length * 500 + (director ? 1000 : 0);
    if (station.balance < productionCost) {
      throw new Error('资金不足，无法制作节目');
    }

    station.balance -= productionCost;
    tvStationDAO.update({ id: tvStationId, balance: station.balance });

    const potential = calculateProgramPotential(category, type, director, hosts, cameramen, reporters);
    const allEmployees = [...hosts, ...cameramen, ...reporters];
    if (director) allEmployees.push(director);
    const quality = calculateProgramQuality(potential, allEmployees);

    const program: Program = {
      id: uuidv4(),
      name: name || generateProgramName(category),
      description: `${category}节目`,
      category,
      type,
      duration,
      potential,
      quality,
      directorId,
      hostIds,
      cameramanIds,
      reporterIds,
      createdAt: Date.now(),
      tvStationId,
      copyrightOwned: true
    };

    programDAO.create(program);
    this.broadcastStationUpdate(tvStationId);

    return program;
  }

  scheduleProgram(tvStationId: string, programId: string, startTime: number): ScheduleItem {
    const station = tvStationDAO.getById(tvStationId);
    const program = programDAO.getById(programId);
    
    if (!station || !program) throw new Error('数据不存在');

    const endTime = startTime + program.duration * 60 * 1000;
    const existingSchedules = scheduleDAO.getByStation(tvStationId);

    const conflict = existingSchedules.some(s => 
      (startTime >= s.startTime && startTime < s.endTime) ||
      (endTime > s.startTime && endTime <= s.endTime) ||
      (startTime <= s.startTime && endTime >= s.endTime)
    );

    if (conflict) {
      throw new Error('节目时间冲突');
    }

    const scheduleItem: ScheduleItem = {
      id: uuidv4(),
      programId,
      startTime,
      endTime,
      status: 'scheduled',
      currentViewers: 0,
      peakViewers: 0,
      avgViewers: 0,
      danmakuCount: 0,
      adRevenue: 0,
      rating: 0,
      tvStationId
    };

    scheduleDAO.create(scheduleItem);
    this.broadcastStationUpdate(tvStationId);

    return scheduleItem;
  }

  cancelSchedule(tvStationId: string, scheduleItemId: string): void {
    scheduleDAO.delete(scheduleItemId);
    this.broadcastStationUpdate(tvStationId);
  }

  sendDanmaku(tvStationId: string, scheduleItemId: string, userId: string, username: string, content: string): Danmaku {
    const danmaku: Danmaku = {
      id: uuidv4(),
      content,
      userId,
      username,
      timestamp: Date.now(),
      tvStationId,
      scheduleItemId
    };

    danmakuDAO.create(danmaku);

    const schedule = scheduleDAO.getById(scheduleItemId);
    if (schedule) {
      schedule.danmakuCount++;
      scheduleDAO.update({ id: scheduleItemId, danmakuCount: schedule.danmakuCount });
    }

    if (this.io) {
      this.io.to(`station_${tvStationId}`).emit('danmaku', danmaku);
    }

    return danmaku;
  }

  getRecentDanmaku(tvStationId: string, limit: number = 50): Danmaku[] {
    return danmakuDAO.getRecentByStation(tvStationId, limit);
  }

  startBattle(challengerId: string, defenderId: string, category: ChannelCategory): Battle {
    const battle: Battle = {
      id: uuidv4(),
      challengerId,
      defenderId,
      status: 'pending',
      startTime: Date.now() + 5 * 60 * 1000,
      endTime: Date.now() + 20 * 60 * 1000,
      challengerViewers: 0,
      defenderViewers: 0,
      prize: 5000,
      category
    };

    battleDAO.create(battle);
    
    if (this.io) {
      this.io.emit('battle_start', battle);
    }

    this.addHeadlineEvent(`收视率对决即将开始！请双方电视台准备就绪！`);

    return battle;
  }

  getBattles(): Battle[] {
    return battleDAO.getAll();
  }

  getActiveBattles(): Battle[] {
    return battleDAO.getActive();
  }

  listTrade(sellerId: string, itemType: 'copyright' | 'contract', itemId: string, itemName: string, price: number): Trade {
    const avg7d = this.calculate7dAvgPrice(itemType);
    const suggestedMin = Math.floor(avg7d * 0.7);
    const suggestedMax = Math.floor(avg7d * 1.3);

    const trade: Trade = {
      id: uuidv4(),
      sellerId,
      itemType,
      itemId,
      itemName,
      price,
      suggestedMin,
      suggestedMax,
      status: 'listed',
      createdAt: Date.now()
    };

    tradeDAO.create(trade);

    if (this.io) {
      this.io.emit('trade_new', trade);
    }

    return trade;
  }

  buyTrade(tradeId: string, buyerId: string): Trade {
    const trade = tradeDAO.getById(tradeId);
    if (!trade || trade.status !== 'listed') {
      throw new Error('交易不存在或已完成');
    }

    const buyerStation = this.getTVStationByOwner(buyerId);
    const sellerStation = this.getTVStationByOwner(trade.sellerId);

    if (!buyerStation || !sellerStation) {
      throw new Error('用户电视台不存在');
    }

    if (buyerStation.balance < trade.price) {
      throw new Error('资金不足');
    }

    buyerStation.balance -= trade.price;
    sellerStation.balance += trade.price;

    tvStationDAO.update({ id: buyerStation.id, balance: buyerStation.balance });
    tvStationDAO.update({ id: sellerStation.id, balance: sellerStation.balance });

    trade.buyerId = buyerId;
    trade.status = 'sold';
    trade.soldAt = Date.now();
    tradeDAO.update({ id: tradeId, buyerId, status: 'sold', soldAt: Date.now() });

    if (trade.itemType === 'copyright') {
      const program = programDAO.getById(trade.itemId);
      if (program) {
        program.copyrightOwned = false;
        programDAO.update({ id: trade.itemId, copyrightOwned: false });

        const newProgram: Program = {
          ...program,
          id: uuidv4(),
          tvStationId: buyerStation.id,
          copyrightOwned: true
        };
        programDAO.create(newProgram);
      }
    }

    if (this.io) {
      this.io.emit('trade_complete', trade);
    }

    this.addHeadlineEvent(`重磅交易！${sellerStation.name}以¥${trade.price.toLocaleString()}将《${trade.itemName}》出售给${buyerStation.name}`);

    this.broadcastStationUpdate(buyerStation.id);
    this.broadcastStationUpdate(sellerStation.id);

    return trade;
  }

  getAllTrades(): Trade[] {
    return tradeDAO.getAllListed();
  }

  private calculate7dAvgPrice(itemType: 'copyright' | 'contract'): number {
    const recentTrades = tradeDAO.getSoldInLast7Days().filter(t => t.itemType === itemType);
    
    if (recentTrades.length === 0) {
      return itemType === 'copyright' ? 10000 : 5000;
    }
    
    const sum = recentTrades.reduce((acc, t) => acc + t.price, 0);
    return sum / recentTrades.length;
  }

  addHeadlineEvent(title: string): void {
    const event: RandomEvent = {
      id: uuidv4(),
      type: 'technical_breakthrough',
      title: '全服头条',
      description: title,
      impact: {},
      timestamp: Date.now()
    };
    randomEventDAO.create(event);
    
    if (this.io) {
      this.io.emit('headline', event);
    }
  }

  getRandomEvents(limit: number = 20): RandomEvent[] {
    return randomEventDAO.getRecent(limit);
  }

  getLeaderboard(): LeaderboardEntry[] {
    const stations = tvStationDAO.getAll();
    
    stations.sort((a, b) => {
      const scoreA = a.totalViewers * 0.4 + a.avgRating * 1000 * 0.3 + a.totalAdRevenue * 0.2 + a.influence * 10 * 0.1;
      const scoreB = b.totalViewers * 0.4 + b.avgRating * 1000 * 0.3 + b.totalAdRevenue * 0.2 + b.influence * 10 * 0.1;
      return scoreB - scoreA;
    });

    return stations.map((station, index) => {
      const user = userDAO.getById(station.ownerId);
      return {
        tvStationId: station.id,
        tvStationName: station.name,
        ownerName: user?.username || '未知',
        totalViewers: station.totalViewers,
        avgRating: station.avgRating,
        totalAdRevenue: station.totalAdRevenue,
        influence: station.influence,
        rank: index + 1
      };
    });
  }

  private broadcastStationUpdate(stationId: string): void {
    if (!this.io) return;
    
    const station = this.getTVStation(stationId);
    if (station) {
      const airingPrograms = station.schedule.filter(s => s.status === 'airing');
      this.io.to(`station_${stationId}`).emit('station_update', {
        stationId: station.id,
        balance: station.balance,
        fans: station.fans,
        level: station.level,
        programs: airingPrograms,
        schedule: station.schedule,
        employees: station.employees,
        stationPrograms: station.programs
      });
    }
  }

  simulateTick(): void {
    const now = Date.now();

    const airingSchedules = scheduleDAO.getByStatus('airing');
    const scheduledSchedules = scheduleDAO.getByStatus('scheduled');

    for (const schedule of scheduledSchedules) {
      if (now >= schedule.startTime) {
        schedule.status = 'airing';
        scheduleDAO.update({ id: schedule.id, status: 'airing' });
        
        const station = tvStationDAO.getById(schedule.tvStationId);
        if (station) {
          const program = programDAO.getById(schedule.programId);
          this.addHeadlineEvent(`${station.name}的《${program?.name || '节目'}》开始播出！`);
        }
        
        this.broadcastStationUpdate(schedule.tvStationId);
      }
    }

    for (const schedule of airingSchedules) {
      const station = tvStationDAO.getById(schedule.tvStationId);
      const program = programDAO.getById(schedule.programId);
      
      if (station && program) {
        const progress = Math.min(1, (now - schedule.startTime) / (schedule.endTime - schedule.startTime));
        
        const baseViewers = station.fans * 0.1;
        const qualityBonus = program.quality * 5;
        const randomFactor = 0.8 + Math.random() * 0.4;
        const newViewers = Math.floor((baseViewers + qualityBonus) * randomFactor * Math.sin(progress * Math.PI));
        
        schedule.currentViewers = newViewers;
        schedule.peakViewers = Math.max(schedule.peakViewers, newViewers);
        schedule.avgViewers = Math.floor((schedule.avgViewers * 0.9) + (newViewers * 0.1));
        
        const adRate = newViewers * 0.05;
        schedule.adRevenue += adRate * (10 / 60);
        
        schedule.rating = Math.min(10, program.quality / 10 + (newViewers / 1000) * 0.5);

        scheduleDAO.update({
          id: schedule.id,
          currentViewers: schedule.currentViewers,
          peakViewers: schedule.peakViewers,
          avgViewers: schedule.avgViewers,
          adRevenue: schedule.adRevenue,
          rating: schedule.rating
        });

        if (Math.random() < 0.002) {
          this.triggerRandomEvent(schedule.tvStationId, schedule.id);
        }

        if (now >= schedule.endTime) {
          schedule.status = 'completed';
          station.totalViewers += schedule.avgViewers;
          station.totalAdRevenue += schedule.adRevenue;
          station.balance += schedule.adRevenue;
          station.fans += Math.floor(schedule.peakViewers * 0.01);
          station.influence += Math.floor(schedule.avgViewers * 0.1);
          station.avgRating = station.avgRating === 0 ? schedule.rating : (station.avgRating + schedule.rating) / 2;

          tvStationDAO.update({
            id: station.id,
            totalViewers: station.totalViewers,
            totalAdRevenue: station.totalAdRevenue,
            balance: station.balance,
            fans: station.fans,
            influence: station.influence,
            avgRating: station.avgRating
          });

          scheduleDAO.update({ id: schedule.id, status: 'completed' });

          this.improveEmployees(station.id, program);

          if (station.totalViewers > station.level * 100000) {
            station.level++;
            tvStationDAO.update({ id: station.id, level: station.level });
            this.addHeadlineEvent(`恭喜！${station.name}升级到${station.level}级！`);
          }

          this.broadcastStationUpdate(schedule.tvStationId);
        }
      }
    }

    const activeBattles = battleDAO.getActive();
    for (const battle of activeBattles) {
      if (battle.status === 'pending' && now >= battle.startTime) {
        battle.status = 'active';
        battleDAO.update({ id: battle.id, status: 'active' });
        this.addHeadlineEvent(`收视率对决开始！挑战双方即将展开激烈角逐！`);
      }

      if (battle.status === 'active') {
        const challenger = tvStationDAO.getById(battle.challengerId);
        const defender = tvStationDAO.getById(battle.defenderId);
        
        if (challenger && defender) {
          const cSchedules = scheduleDAO.getByStation(challenger.id);
          const dSchedules = scheduleDAO.getByStation(defender.id);
          
          const cViewers = cSchedules
            .filter(s => s.status === 'airing')
            .reduce((sum, s) => sum + s.currentViewers, 0);
          const dViewers = dSchedules
            .filter(s => s.status === 'airing')
            .reduce((sum, s) => sum + s.currentViewers, 0);
          
          if (cViewers > battle.challengerViewers) {
            battle.challengerViewers = cViewers;
          }
          if (dViewers > battle.defenderViewers) {
            battle.defenderViewers = dViewers;
          }

          battleDAO.update({
            id: battle.id,
            challengerViewers: battle.challengerViewers,
            defenderViewers: battle.defenderViewers
          });
        }

        if (now >= battle.endTime) {
          battle.status = 'completed';
          const challengerWins = battle.challengerViewers > battle.defenderViewers;
          battle.winnerId = challengerWins ? battle.challengerId : battle.defenderId;
          
          battleDAO.update({
            id: battle.id,
            status: 'completed',
            winnerId: battle.winnerId
          });

          const winner = tvStationDAO.getById(battle.winnerId);
          if (winner) {
            winner.balance += battle.prize;
            winner.influence += 500;
            tvStationDAO.update({
              id: winner.id,
              balance: winner.balance,
              influence: winner.influence
            });
            this.broadcastStationUpdate(winner.id);
          }

          this.addHeadlineEvent(`收视率对决落幕！${winner?.name || '某电视台'}获胜，获得¥${battle.prize.toLocaleString()}和500影响力！`);
        }
      }
    }

    if (this.io) {
      this.io.emit('battle_update', this.getActiveBattles());
    }

    for (const station of tvStationDAO.getAll()) {
      const airing = scheduleDAO.getByStation(station.id).filter(s => s.status === 'airing');
      if (airing.length > 0) {
        this.broadcastStationUpdate(station.id);
      }
    }
  }

  private triggerRandomEvent(tvStationId: string, scheduleId: string): void {
    const station = tvStationDAO.getById(tvStationId);
    const schedule = scheduleDAO.getById(scheduleId);
    if (!station || !schedule) return;

    const events = [
      { type: 'equipment_failure', title: '设备故障', description: '播出设备出现故障，影响观看体验', impact: { viewers: -0.2, rating: -0.5 } },
      { type: 'breaking_news', title: '突发新闻', description: '突发重大新闻事件，观众关注度飙升！', impact: { viewers: 0.3, rating: 0.5 } },
      { type: 'celebrity_guest', title: '明星嘉宾', description: '神秘明星嘉宾空降直播间！', impact: { viewers: 0.4, adRevenue: 0.2 } },
      { type: 'technical_breakthrough', title: '技术突破', description: '4K超清技术效果惊艳，观众好评如潮！', impact: { rating: 1, adRevenue: 0.1 } }
    ];

    const eventTemplate = events[Math.floor(Math.random() * events.length)];
    const randomEvent: RandomEvent = {
      id: uuidv4(),
      type: eventTemplate.type as RandomEvent['type'],
      title: eventTemplate.title,
      description: eventTemplate.description,
      impact: eventTemplate.impact,
      tvStationId,
      timestamp: Date.now()
    };

    randomEventDAO.create(randomEvent);

    if (eventTemplate.impact.viewers) {
      schedule.currentViewers = Math.floor(schedule.currentViewers * (1 + eventTemplate.impact.viewers));
    }
    if (eventTemplate.impact.rating) {
      schedule.rating = Math.max(0, Math.min(10, schedule.rating + eventTemplate.impact.rating));
    }
    if (eventTemplate.impact.adRevenue) {
      schedule.adRevenue *= (1 + eventTemplate.impact.adRevenue);
    }

    scheduleDAO.update({
      id: scheduleId,
      currentViewers: schedule.currentViewers,
      rating: schedule.rating,
      adRevenue: schedule.adRevenue
    });

    if (this.io) {
      this.io.to(`station_${tvStationId}`).emit('random_event', randomEvent);
    }
  }

  private improveEmployees(stationId: string, program: Program): void {
    const employees = employeeDAO.getByStation(stationId);
    const allEmployeeIds = [
      program.directorId,
      ...program.hostIds,
      ...program.cameramanIds,
      ...program.reporterIds
    ].filter(Boolean);

    for (const empId of allEmployeeIds) {
      const employee = employees.find(e => e.id === empId);
      if (employee) {
        const skillGain = 0.5 + Math.random() * 1;
        const loyaltyGain = 0.2 + Math.random() * 0.5;
        employee.skill = Math.min(100, employee.skill + skillGain);
        employee.loyalty = Math.min(100, employee.loyalty + loyaltyGain);

        if (employee.skill >= employee.level * 10 && employee.level < 10) {
          employee.level++;
          employee.salary = Math.floor(employee.salary * 1.2);
        }

        employeeDAO.update({
          id: employee.id,
          skill: employee.skill,
          loyalty: employee.loyalty,
          level: employee.level,
          salary: employee.salary
        });
      }
    }
  }

  generateWeeklyReport(tvStationId: string): WeeklyReport {
    const station = tvStationDAO.getById(tvStationId);
    if (!station) throw new Error('电视台不存在');

    const schedules = scheduleDAO.getByStation(tvStationId);
    const weekEnd = Date.now();
    const weekStart = weekEnd - 7 * 24 * 60 * 60 * 1000;

    const weekPrograms = schedules.filter(
      s => s.endTime > weekStart && s.endTime <= weekEnd && s.status === 'completed'
    );
    
    const programHeatmap: Record<string, number> = {};
    for (const s of weekPrograms) {
      const program = programDAO.getById(s.programId);
      if (program) {
        programHeatmap[program.name] = (programHeatmap[program.name] || 0) + s.avgViewers;
      }
    }

    const employees = employeeDAO.getByStation(tvStationId);
    const employeeGrowth: Record<string, { skill: number; loyalty: number }> = {};
    for (const e of employees) {
      employeeGrowth[e.name] = { skill: e.skill, loyalty: e.loyalty };
    }

    const revenueTrend = Array(7).fill(0).map(() => Math.random() * 1000 + 500);
    const viewerTrend = Array(7).fill(0).map(() => Math.random() * 5000 + 1000);

    const report: WeeklyReport = {
      id: uuidv4(),
      tvStationId,
      weekStart,
      weekEnd,
      totalViewers: weekPrograms.reduce((sum, s) => sum + s.avgViewers, 0),
      totalAdRevenue: weekPrograms.reduce((sum, s) => sum + s.adRevenue, 0),
      avgRating: weekPrograms.length > 0 ? weekPrograms.reduce((sum, s) => sum + s.rating, 0) / weekPrograms.length : 0,
      programHeatmap,
      employeeGrowth,
      revenueTrend,
      viewerTrend,
      radarData: {
        content: Math.min(100, station.avgRating * 10),
        production: Math.min(100, employees.reduce((sum, e) => sum + e.skill, 0) / Math.max(1, employees.length)),
        influence: Math.min(100, station.influence / 100),
        profitability: Math.min(100, station.totalAdRevenue / 1000),
        team: Math.min(100, employees.reduce((sum, e) => sum + e.loyalty, 0) / Math.max(1, employees.length))
      }
    };

    weeklyReportDAO.create(report);
    return report;
  }
}

export const gameState = GameState.getInstance();
