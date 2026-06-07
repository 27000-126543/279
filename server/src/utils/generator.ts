import { v4 as uuidv4 } from 'uuid';
import { ChannelCategory, EmployeeRole, Program, TVStation, Employee, ProgramType } from '../types';

const firstNames = ['张伟', '王芳', '李明', '刘洋', '陈静', '杨帆', '赵磊', '周敏', '吴强', '郑丽', '孙浩', '马超', '朱婷', '胡军', '林峰'];
const lastNames = ['', '主持人', '导播', '摄像', '记者'];

const namePool: Record<EmployeeRole, string[]> = {
  host: ['张涛', '李思思', '何炅', '汪涵', '董卿', '撒贝宁', '华少', '孟非', '鲁豫', '杨澜'],
  director: ['陈凯歌', '张艺谋', '冯小刚', '李安', '王家卫', '徐克', '吴宇森', '杜琪峰', '管虎', '宁浩'],
  cameraman: ['赵小丁', '鲍德熹', '杜可风', '顾长卫', '张艺谋', '侯咏', '吕乐', '张黎', '王昱', '曹郁'],
  reporter: ['柴静', '白岩松', '崔永元', '水均益', '敬一丹', '康辉', '海霞', '欧阳夏丹', '李梓萌', '郭志坚']
};

const programNames: Record<ChannelCategory, string[]> = {
  news: ['早间新闻', '午间报道', '晚间新闻联播', '焦点访谈', '新闻调查', '今日关注', '环球视线', '东方时空'],
  music: ['音乐排行榜', '经典老歌', '原创音乐秀', '音乐节现场', '华语金曲', '欧美流行', '说唱新世代', '乐队的夏天'],
  gaming: ['电竞世界', '游戏风云', '主机游戏秀', '手游推荐', '英雄联盟职业联赛', '王者荣耀赛', '速通挑战', '游戏评测'],
  food: ['舌尖上的中国', '美食探店', '厨艺大比拼', '街头美食', '烘焙工坊', '世界美食', '健康饮食', '网红餐厅'],
  sports: ['体育新闻', '足球之夜', '篮球公园', '奥运特别节目', '赛车时代', '健身动起来', '武林风', '极限运动'],
  entertainment: ['娱乐星天地', '八卦来了', '明星专访', '综艺大热门', '电影节报道', '颁奖典礼', '真人秀', '脱口秀'],
  tech: ['科技前沿', '数码评测', '互联网周刊', '黑客马拉松', 'AI前沿', '创业邦', '手机测评', '电脑世界'],
  education: ['百家讲坛', '知识就是力量', '科学探索', '历史那些事', '地理中国', '艺术课堂', '外语角', '高考帮']
};

export function generateName(role: EmployeeRole): string {
  const pool = namePool[role];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function generateEmployee(role: EmployeeRole, tvStationId: string, baseLevel: number = 1): Employee {
  const levelVariance = Math.floor(Math.random() * 3) - 1;
  const level = Math.max(1, Math.min(10, baseLevel + levelVariance));
  
  return {
    id: uuidv4(),
    name: generateName(role),
    role,
    level,
    skill: 30 + Math.floor(Math.random() * 40) + level * 3,
    loyalty: 40 + Math.floor(Math.random() * 40),
    salary: (level * 1000) + Math.floor(Math.random() * 500),
    hiredAt: Date.now(),
    tvStationId,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uuidv4()}`
  };
}

export function generateProgramName(category: ChannelCategory): string {
  const pool = programNames[category];
  const baseName = pool[Math.floor(Math.random() * pool.length)];
  const suffixes = ['特别版', '精选', '第二季', '升级版', '全新', '周末版', '黄金档', '深夜档'];
  if (Math.random() > 0.6) {
    return `${baseName}·${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
  }
  return baseName;
}

export function calculateProgramPotential(
  category: ChannelCategory,
  type: ProgramType,
  director?: Employee,
  hosts: Employee[] = [],
  cameramen: Employee[] = [],
  reporters: Employee[] = []
): number {
  let potential = 50;

  if (director) {
    potential += director.skill * 0.3;
  }

  hosts.forEach(h => {
    potential += h.skill * 0.25;
  });

  cameramen.forEach(c => {
    potential += c.skill * 0.1;
  });

  reporters.forEach(r => {
    potential += r.skill * 0.15;
  });

  if (type === 'live') {
    potential += 10;
  }

  potential += Math.random() * 20 - 10;

  return Math.max(0, Math.min(100, potential));
}

export function calculateProgramQuality(potential: number, employees: Employee[]): number {
  let loyaltyBonus = 0;
  employees.forEach(e => {
    loyaltyBonus += e.loyalty * 0.05;
  });

  const quality = potential + loyaltyBonus + (Math.random() * 10 - 5);
  return Math.max(0, Math.min(100, quality));
}

export function createInitialTVStation(ownerId: string, name: string, category: ChannelCategory, description: string): TVStation {
  const tvStationId = uuidv4();
  
  const initialEmployees: Employee[] = [
    generateEmployee('host', tvStationId, 2),
    generateEmployee('director', tvStationId, 2),
    generateEmployee('cameraman', tvStationId, 1),
    generateEmployee('reporter', tvStationId, 1)
  ];

  const host = initialEmployees.find(e => e.role === 'host')!;
  const director = initialEmployees.find(e => e.role === 'director')!;
  const cameraman = initialEmployees.find(e => e.role === 'cameraman')!;

  const initialProgram: Program = {
    id: uuidv4(),
    name: generateProgramName(category),
    description: `欢迎收看${name}的主打节目`,
    category,
    type: 'recorded',
    duration: 60,
    potential: calculateProgramPotential(category, 'recorded', director, [host], [cameraman]),
    quality: 0,
    hostIds: [host.id],
    directorId: director.id,
    cameramanIds: [cameraman.id],
    reporterIds: [],
    createdAt: Date.now(),
    tvStationId,
    copyrightOwned: true
  };

  initialProgram.quality = calculateProgramQuality(initialProgram.potential, initialEmployees);

  return {
    id: tvStationId,
    name,
    ownerId,
    category,
    description,
    createdAt: Date.now(),
    influence: 100,
    totalViewers: 0,
    totalAdRevenue: 0,
    avgRating: 0,
    employees: initialEmployees,
    programs: [initialProgram],
    schedule: [],
    balance: 50000,
    level: 1,
    fans: 100
  };
}

export const categoryNames: Record<ChannelCategory, string> = {
  news: '新闻',
  music: '音乐',
  gaming: '游戏',
  food: '美食',
  sports: '体育',
  entertainment: '娱乐',
  tech: '科技',
  education: '教育'
};

export const roleNames: Record<EmployeeRole, string> = {
  host: '主持人',
  director: '编导',
  cameraman: '摄像',
  reporter: '记者'
};
