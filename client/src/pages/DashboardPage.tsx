import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { categoryNames, categoryColors } from '../types';
import { systemAPI } from '../services/api';
import { RandomEvent } from '../types';
import { Tv, Users, DollarSign, Star, Eye, TrendingUp, MessageSquare, Award, Zap } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { tvStation, user } = useApp();
  const [events, setEvents] = useState<RandomEvent[]>([]);

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadEvents = async () => {
    try {
      const data = await systemAPI.getEvents();
      setEvents(data);
    } catch {}
  };

  if (!tvStation || !user) return null;

  const airingPrograms = tvStation.schedule.filter(s => s.status === 'airing');
  const scheduledPrograms = tvStation.schedule.filter(s => s.status === 'scheduled').slice(0, 3);

  return (
    <div>
      <div className="header">
        <div>
          <h1 className="text-2xl font-bold">欢迎回来，{user.username}</h1>
          <p className="text-muted mt-1">
            {tvStation.name} · {categoryNames[tvStation.category]}频道
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="px-4 py-2 rounded-xl font-semibold"
            style={{ backgroundColor: categoryColors[tvStation.category] + '20', color: categoryColors[tvStation.category] }}
          >
            <Star size={16} className="inline mr-1" />
            Lv.{tvStation.level}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted text-sm">总观众数</span>
            <Eye size={20} className="text-blue-400" />
          </div>
          <div className="stat-value">{tvStation.totalViewers.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted text-sm">广告收入</span>
            <DollarSign size={20} className="text-green-400" />
          </div>
          <div className="stat-value">¥ {Math.floor(tvStation.totalAdRevenue).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted text-sm">粉丝数</span>
            <Users size={20} className="text-purple-400" />
          </div>
          <div className="stat-value">{tvStation.fans.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted text-sm">影响力</span>
            <Award size={20} className="text-yellow-400" />
          </div>
          <div className="stat-value">{tvStation.influence.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {airingPrograms.length > 0 && (
            <div className="card">
              <div className="card-header flex items-center gap-2">
                <span className="badge badge-live">LIVE</span>
                <span>正在播出</span>
              </div>
              <div className="space-y-4">
                {airingPrograms.map(schedule => {
                  const program = tvStation.programs.find(p => p.id === schedule.programId);
                  if (!program) return null;
                  const progress = Math.min(100, ((Date.now() - schedule.startTime) / (schedule.endTime - schedule.startTime)) * 100);
                  
                  return (
                    <div key={schedule.id} className="p-4 rounded-xl bg-slate-800/50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{program.name}</h3>
                          <p className="text-sm text-muted">{program.type === 'live' ? '直播' : '录播'}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-red-400">
                            {schedule.currentViewers.toLocaleString()} <span className="text-sm font-normal text-muted">人观看</span>
                          </div>
                          <div className="text-sm text-yellow-400">
                            评分: {schedule.rating.toFixed(1)}
                          </div>
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill bg-gradient-to-r from-red-500 to-orange-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-muted">
                        <span>实时弹幕: {schedule.danmakuCount}</span>
                        <span>实时广告收入: ¥{Math.floor(schedule.adRevenue)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">即将播出</div>
            {scheduledPrograms.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <Tv size={48} className="mx-auto mb-2 opacity-30" />
                <p>暂无排播节目</p>
                <p className="text-sm mt-1">去「节目编排」添加节目单吧</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledPrograms.map(schedule => {
                  const program = tvStation.programs.find(p => p.id === schedule.programId);
                  if (!program) return null;
                  
                  return (
                    <div key={schedule.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/30">
                      <div className="text-center px-3 py-2 rounded-lg bg-slate-800 min-w-[80px]">
                        <div className="text-lg font-bold">
                          {new Date(schedule.startTime).getHours().toString().padStart(2, '0')}:
                          {new Date(schedule.startTime).getMinutes().toString().padStart(2, '0')}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{program.name}</div>
                        <div className="text-sm text-muted">{program.duration}分钟 · {program.type === 'live' ? '直播' : '录播'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-yellow-400">潜力: {program.potential.toFixed(0)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">团队概况</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['host', 'director', 'cameraman', 'reporter'].map(role => {
                const employees = tvStation.employees.filter(e => e.role === role);
                const roleNames: Record<string, string> = { host: '主持人', director: '编导', cameraman: '摄像', reporter: '记者' };
                const avgSkill = employees.length > 0 
                  ? employees.reduce((sum, e) => sum + e.skill, 0) / employees.length 
                  : 0;
                
                return (
                  <div key={role} className="p-4 rounded-xl bg-slate-800/30 text-center">
                    <div className="text-3xl font-bold mb-1">{employees.length}</div>
                    <div className="text-sm text-muted mb-2">{roleNames[role]}</div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill bg-gradient-to-r from-indigo-500 to-purple-500"
                        style={{ width: `${avgSkill}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted mt-1">平均技能 {avgSkill.toFixed(0)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <Zap size={18} className="text-yellow-400" />
              <span>全服动态</span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {events.slice(0, 10).map((event, index) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg bg-slate-800/30 text-sm"
                  style={{ opacity: 1 - index * 0.08 }}
                >
                  <div className="font-semibold text-yellow-400 mb-1">{event.title}</div>
                  <div className="text-muted">{event.description}</div>
                  <div className="text-xs text-muted mt-1">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">运营指标</div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted">平均评分</span>
                  <span className="font-semibold">{tvStation.avgRating.toFixed(1)}/10</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill bg-gradient-to-r from-yellow-500 to-orange-500"
                    style={{ width: `${tvStation.avgRating * 10}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted">节目数量</span>
                  <span className="font-semibold">{tvStation.programs.length}个</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted">员工总数</span>
                  <span className="font-semibold">{tvStation.employees.length}人</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted">本周排播</span>
                  <span className="font-semibold">{tvStation.schedule.length}档</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
