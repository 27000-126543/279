import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { tvStationAPI } from '../services/api';
import { ScheduleItem, Program, categoryColors, categoryNames } from '../types';
import { Calendar, Clock, Play, X, Trash2, Tv, BarChart3, TrendingUp } from 'lucide-react';

export const SchedulePage: React.FC = () => {
  const { tvStation, refreshStation } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('20:00');
  const [danmakuInput, setDanmakuInput] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);

  if (!tvStation) return null;

  const getProgramById = (id: string) => tvStation.programs.find(p => p.id === id);

  const sortedSchedule = [...tvStation.schedule.sort((a, b) => a.startTime - b.startTime)];

  const handleAddSchedule = async () => {
    if (!selectedProgram) return;

    const startTime = new Date(`${selectedDate}T${selectedTime}:00`).getTime();
    
    try {
      await tvStationAPI.scheduleProgram(tvStation.id, selectedProgram, startTime);
      await refreshStation();
      setShowAddModal(false);
      setSelectedProgram('');
    } catch (error: any) {
      alert(error.response?.data?.error || '排播失败');
    }
  };

  const handleCancelSchedule = async (scheduleId: string) => {
    if (!confirm('确定要取消这个节目排播吗？')) return;
    try {
      await tvStationAPI.cancelSchedule(tvStation.id, scheduleId);
      await refreshStation();
    } catch (error: any) {
      alert(error.response?.data?.error || '取消失败');
    }
  };

  const handleSendDanmaku = async () => {
    if (!danmakuInput.trim() || !selectedSchedule) return;
    
    try {
      await tvStationAPI.sendDanmaku(tvStation.id, {
        scheduleItemId: selectedSchedule.id,
        userId: 'viewer_' + Math.random().toString(36).substr(2, 9),
        username: '匿名观众',
        content: danmakuInput.trim()
      });
      setDanmakuInput('');
    } catch (error) {
      console.error('发送弹幕失败', error);
    }
  };

  const getStatusLabel = (status: ScheduleItem['status']) => {
    switch (status) {
      case 'scheduled': return { text: '待播出', color: 'bg-blue-500/20 text-blue-400' };
      case 'airing': return { text: '播出中', color: 'bg-red-500/20 text-red-400' };
      case 'completed': return { text: '已完成', color: 'bg-green-500/20 text-green-400' };
      default: return { text: status, color: 'bg-gray-500/20 text-gray-400' };
    }
  };

  const now = Date.now();

  return (
    <div>
      <div className="header">
        <div>
          <h1 className="text-2xl font-bold">节目编排</h1>
          <p className="text-muted mt-1">安排节目单，优化黄金档争夺收视率</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Calendar size={18} />
          添加排播
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">节目单</div>
            
            {sortedSchedule.length === 0 ? (
              <div className="text-center py-12 text-muted">
                <Tv size={64} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">暂无排播节目</p>
                <p className="text-sm">点击右上角按钮添加你的第一个节目吧</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedSchedule.map(schedule => {
                  const program = getProgramById(schedule.programId);
                  if (!program) return null;
                  
                  const status = getStatusLabel(schedule.status);
                  const isAiring = schedule.status === 'airing';
                  
                  return (
                    <div
                      key={schedule.id}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isAiring
                          ? 'border-red-500/50 bg-red-500/5'
                          : schedule.status === 'completed'
                            ? 'border-transparent bg-slate-800/30'
                            : 'border-transparent bg-slate-800/50 hover:bg-slate-800'
                      } ${selectedSchedule?.id === schedule.id ? 'border-indigo-500' : ''}`}
                      onClick={() => setSelectedSchedule(schedule)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[80px]">
                          <div className="text-xl font-bold">
                            {new Date(schedule.startTime).getHours().toString().padStart(2, '0')}:
                            {new Date(schedule.startTime).getMinutes().toString().padStart(2, '0')}
                          </div>
                          <div className="text-xs text-muted">
                            {new Date(schedule.endTime).getHours().toString().padStart(2, '0')}:
                            {new Date(schedule.endTime).getMinutes().toString().padStart(2, '0')}
                          </div>
                        </div>

                        <div className="w-1 h-12 rounded-full" style={{ backgroundColor: categoryColors[program.category] }} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{program.name}</h3>
                            <span className={`badge ${status.color} text-xs`}>{status.text}</span>
                            {isAiring && <span className="badge badge-live text-xs">LIVE</span>}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {program.duration}分钟
                            </span>
                            <span>{program.type === 'live' ? '直播' : '录播'}</span>
                            {isAiring && (
                              <span className="text-red-400 flex items-center gap-1">
                                <TrendingUp size={12} />
                                {schedule.currentViewers.toLocaleString()}人在线
                              </span>
                            )}
                            {schedule.status === 'completed' && (
                              <>
                                <span className="text-yellow-400">评分: {schedule.rating.toFixed(1)}</span>
                                <span className="text-green-400">¥{Math.floor(schedule.adRevenue).toLocaleString()}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          {schedule.status === 'scheduled' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelSchedule(schedule.id);
                              }}
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">节目详情</div>
            {selectedSchedule ? (
              (() => {
                const program = getProgramById(selectedSchedule.programId);
                if (!program) return null;
                const progress = Math.min(100, Math.max(0, ((now - selectedSchedule.startTime) / (selectedSchedule.endTime - selectedSchedule.startTime)) * 100));

                return (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{program.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: categoryColors[program.category] + '20', color: categoryColors[program.category] }}
                        >
                          {categoryNames[program.category]}
                        </span>
                        <span className="text-sm text-muted">{program.type === 'live' ? '直播' : '录播'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                        <div className="text-2xl font-bold text-blue-400">{selectedSchedule.peakViewers.toLocaleString()}</div>
                        <div className="text-xs text-muted">峰值观众</div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                        <div className="text-2xl font-bold text-yellow-400">{selectedSchedule.rating.toFixed(1)}</div>
                        <div className="text-xs text-muted">评分</div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                        <div className="text-2xl font-bold text-green-400">¥{Math.floor(selectedSchedule.adRevenue).toLocaleString()}</div>
                        <div className="text-xs text-muted">广告收入</div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                        <div className="text-2xl font-bold text-purple-400">{selectedSchedule.danmakuCount}</div>
                        <div className="text-xs text-muted">弹幕数</div>
                      </div>
                    </div>

                    {selectedSchedule.status === 'airing' && (
                      <>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted">播出进度</span>
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill bg-gradient-to-r from-red-500 to-orange-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm mb-2 font-semibold">发送弹幕</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={danmakuInput}
                              onChange={e => setDanmakuInput(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSendDanmaku()}
                              placeholder="发个弹幕支持一下..."
                              className="flex-1"
                            />
                            <button onClick={handleSendDanmaku} className="btn-primary px-4">
                              发送
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-8 text-muted">
                <BarChart3 size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">点击左侧节目查看详情</p>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">今日排播统计</div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted">总节目数</span>
                <span className="font-semibold">{tvStation.schedule.length}档</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">正在播出</span>
                <span className="font-semibold text-red-400">
                  {tvStation.schedule.filter(s => s.status === 'airing').length}档
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">待播出</span>
                <span className="font-semibold text-blue-400">
                  {tvStation.schedule.filter(s => s.status === 'scheduled').length}档
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">总时长</span>
                <span className="font-semibold">
                  {tvStation.schedule.reduce((sum, s) => {
                    const program = getProgramById(s.programId);
                    return sum + (program?.duration || 0);
                  }, 0)}分钟
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">添加节目排播</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 font-semibold">选择节目</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {tvStation.programs.map(program => (
                    <button
                      key={program.id}
                      onClick={() => setSelectedProgram(program.id)}
                      className={`p-3 rounded-lg text-left transition ${
                        selectedProgram === program.id
                          ? 'bg-indigo-500/20 border border-indigo-500'
                          : 'bg-slate-800 border border-transparent hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: categoryColors[program.category] + '30' }}
                        >
                          <Play size={14} style={{ color: categoryColors[program.category] }} />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{program.name}</div>
                          <div className="text-xs text-muted">
                            {program.duration}分钟 · 潜力 {program.potential.toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 font-semibold">日期</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 font-semibold">时间</label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={e => setSelectedTime(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleAddSchedule}
                className="btn-primary flex-1"
                disabled={!selectedProgram}
              >
                确认排播
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
