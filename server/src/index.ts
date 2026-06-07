import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { gameState } from './game/state';
import { createInitialTVStation } from './utils/generator';
import { initDatabase } from './db';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

initDatabase();
gameState.setIO(io);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.post('/api/users', (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: '用户名不能为空' });
    }
    const user = gameState.createUser(username);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/users/:id', (req, res) => {
  const user = gameState.getUser(req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json(user);
});

app.post('/api/tv-stations', (req, res) => {
  try {
    const { ownerId, name, category, description } = req.body;
    
    if (!ownerId || !name || !category) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const existingStation = gameState.getTVStationByOwner(ownerId);
    if (existingStation) {
      return res.status(400).json({ error: '您已经拥有一个电视台' });
    }

    const station = createInitialTVStation(ownerId, name, category, description);
    gameState.addTVStation(station);
    res.json(station);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/tv-stations/:id', (req, res) => {
  const station = gameState.getTVStation(req.params.id);
  if (!station) {
    return res.status(404).json({ error: '电视台不存在' });
  }
  res.json(station);
});

app.get('/api/tv-stations/owner/:ownerId', (req, res) => {
  const station = gameState.getTVStationByOwner(req.params.ownerId);
  if (!station) {
    return res.status(404).json({ error: '电视台不存在' });
  }
  res.json(station);
});

app.get('/api/tv-stations', (req, res) => {
  const stations = gameState.getAllTVStations();
  res.json(stations);
});

app.post('/api/tv-stations/:id/employees', (req, res) => {
  try {
    const { role } = req.body;
    const employee = gameState.hireEmployee(req.params.id, role);
    res.json(employee);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/tv-stations/:id/employees/:employeeId', (req, res) => {
  try {
    gameState.fireEmployee(req.params.id, req.params.employeeId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/categories', (req, res) => {
  res.json({
    news: '新闻',
    music: '音乐',
    gaming: '游戏',
    food: '美食',
    sports: '体育',
    entertainment: '娱乐',
    tech: '科技',
    education: '教育'
  });
});

app.get('/api/roles', (req, res) => {
  res.json({
    host: '主持人',
    director: '编导',
    cameraman: '摄像',
    reporter: '记者'
  });
});

app.post('/api/tv-stations/:id/programs', (req, res) => {
  try {
    const { name, category, type, duration, directorId, hostIds, cameramanIds, reporterIds } = req.body;
    const program = gameState.createProgram(
      req.params.id,
      name,
      category,
      type,
      duration,
      directorId,
      hostIds,
      cameramanIds,
      reporterIds
    );
    res.json(program);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/tv-stations/:id/schedule', (req, res) => {
  try {
    const { programId, startTime } = req.body;
    const schedule = gameState.scheduleProgram(req.params.id, programId, startTime);
    res.json(schedule);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/tv-stations/:id/schedule/:scheduleId', (req, res) => {
  try {
    gameState.cancelSchedule(req.params.id, req.params.scheduleId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/tv-stations/:id/danmaku', (req, res) => {
  try {
    const { scheduleItemId, userId, username, content } = req.body;
    const danmaku = gameState.sendDanmaku(req.params.id, scheduleItemId, userId, username, content);
    res.json(danmaku);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/tv-stations/:id/danmaku', (req, res) => {
  const danmaku = gameState.getRecentDanmaku(req.params.id);
  res.json(danmaku);
});

app.post('/api/battles', (req, res) => {
  try {
    const { challengerId, defenderId, category } = req.body;
    const battle = gameState.startBattle(challengerId, defenderId, category);
    res.json(battle);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/battles', (req, res) => {
  res.json(gameState.getBattles());
});

app.get('/api/battles/active', (req, res) => {
  res.json(gameState.getActiveBattles());
});

app.post('/api/trades', (req, res) => {
  try {
    const { sellerId, itemType, itemId, itemName, price } = req.body;
    const trade = gameState.listTrade(sellerId, itemType, itemId, itemName, price);
    res.json(trade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/trades/:id/buy', (req, res) => {
  try {
    const { buyerId } = req.body;
    const trade = gameState.buyTrade(req.params.id, buyerId);
    res.json(trade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/trades', (req, res) => {
  res.json(gameState.getAllTrades());
});

app.get('/api/events', (req, res) => {
  res.json(gameState.getRandomEvents());
});

app.get('/api/leaderboard', (req, res) => {
  res.json(gameState.getLeaderboard());
});

app.post('/api/tv-stations/:id/reports/weekly', (req, res) => {
  try {
    const report = gameState.generateWeeklyReport(req.params.id);
    res.json(report);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

io.on('connection', (socket) => {
  console.log('客户端连接:', socket.id);

  socket.on('join_station', (stationId: string) => {
    socket.join(`station_${stationId}`);
    console.log(`客户端 ${socket.id} 加入电视台 ${stationId}`);
    
    const station = gameState.getTVStation(stationId);
    if (station) {
      socket.emit('station_update', {
        stationId: station.id,
        balance: station.balance,
        fans: station.fans,
        level: station.level,
        programs: station.schedule.filter(s => s.status === 'airing'),
        schedule: station.schedule,
        employees: station.employees,
        stationPrograms: station.programs
      });
    }
  });

  socket.on('leave_station', (stationId: string) => {
    socket.leave(`station_${stationId}`);
  });

  socket.on('disconnect', () => {
    console.log('客户端断开:', socket.id);
  });
});

setInterval(() => {
  gameState.simulateTick();
}, 10000);

console.log('游戏引擎已启动，每10秒执行一次模拟');

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`API地址: http://localhost:${PORT}`);
  console.log(`数据库文件: server/data/tvstation.db`);
});

export { app, server, io };
