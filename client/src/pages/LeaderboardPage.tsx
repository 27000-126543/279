import React, { useState, useEffect } from 'react';
import { systemAPI, tvStationAPI } from '../services/api';
import { LeaderboardEntry, TVStation, categoryColors, categoryNames } from '../types';
import { Trophy, Eye, Star, DollarSign, Zap, Medal, Crown, Award } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedStation, setSelectedStation] = useState<TVStation | null>(null);
  const [activeTab, setActiveTab] = useState<'viewers' | 'rating' | 'revenue' | 'influence'>('viewers');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const data = await systemAPI.getLeaderboard();
      setLeaderboard(data);
    } catch {}
  };

  const viewStation = async (stationId: string) => {
    try {
      const station = await tvStationAPI.get(stationId);
      setSelectedStation(station);
    } catch {}
  };

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    switch (activeTab) {
      case 'viewers': return b.totalViewers - a.totalViewers;
      case 'rating': return b.avgRating - a.avgRating;
      case 'revenue': return b.totalAdRevenue - a.totalAdRevenue;
      case 'influence': return b.influence - a.influence;
      default: return 0;
    }
  });

  const getValue = (entry: LeaderboardEntry) => {
    switch (activeTab) {
      case 'viewers': return entry.totalViewers.toLocaleString();
      case 'rating': return entry.avgRating.toFixed(1);
      case 'revenue': return '¥' + Math.floor(entry.totalAdRevenue).toLocaleString();
      case 'influence': return entry.influence.toLocaleString();
      default: return '';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown size={24} className="text-yellow-400" />;
      case 2: return <Medal size={24} className="text-gray-300" />;
      case 3: return <Award size={24} className="text-amber-600" />;
      default: return <span className="text-xl font-bold text-muted">{rank}</span>;
    }
  };

  const tabs = [
    { key: 'viewers', label: '总观众数', icon: Eye },
    { key: 'rating', label: '节目评分', icon: Star },
    { key: 'revenue', label: '广告收入', icon: DollarSign },
    { key: 'influence', label: '影响力', icon: Zap },
  ] as const;

  return (
    <div>
      <div className="header">
        <div>
          <h1 className="text-2xl font-bold">全服排行榜</h1>
          <p className="text-muted mt-1">看看谁是传媒界的王者</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="tab-buttons">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`tab-button flex items-center justify-center gap-2 ${
                    activeTab === tab.key ? 'active' : ''
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {sortedLeaderboard.map((entry, index) => {
                const rank = index + 1;
                return (
                  <div
                    key={entry.tvStationId}
                    onClick={() => viewStation(entry.tvStationId)}
                    className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                      rank <= 3
                        ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/30'
                        : 'bg-slate-800/30 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="w-12 text-center flex-shrink-0">
                      {getRankIcon(rank)}
                    </div>

                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0">
                      {entry.tvStationName[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{entry.tvStationName}</div>
                      <div className="text-sm text-muted">台主: {entry.ownerName}</div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-bold">
                        {getValue(entry)}
                      </div>
                      <div className="text-xs text-muted">
                        {tabs.find(t => t.key === activeTab)?.label}
                      </div>
                    </div>
                  </div>
                );
              })}

              {sortedLeaderboard.length === 0 && (
                <div className="text-center py-12 text-muted">
                  <Trophy size={64} className="mx-auto mb-4 opacity-30" />
                  <p>暂无排行数据</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">电视台详情</div>
            
            {selectedStation ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div
                    className="w-20 h-20 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl font-bold"
                    style={{ backgroundColor: categoryColors[selectedStation.category] }}
                  >
                    {selectedStation.name[0]}
                  </div>
                  <h3 className="text-xl font-bold">{selectedStation.name}</h3>
                  <p className="text-sm text-muted">
                    {categoryNames[selectedStation.category]} · Lv.{selectedStation.level}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                    <div className="text-lg font-bold text-blue-400">
                      {selectedStation.totalViewers.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted">总观众</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                    <div className="text-lg font-bold text-yellow-400">
                      {selectedStation.avgRating.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted">平均评分</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                    <div className="text-lg font-bold text-green-400">
                      ¥{Math.floor(selectedStation.totalAdRevenue).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted">广告收入</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                    <div className="text-lg font-bold text-purple-400">
                      {selectedStation.influence.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted">影响力</div>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <div className="text-sm font-semibold mb-2">团队规模</div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold">{selectedStation.employees.filter(e => e.role === 'host').length}</div>
                      <div className="text-xs text-muted">主持</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{selectedStation.employees.filter(e => e.role === 'director').length}</div>
                      <div className="text-xs text-muted">编导</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{selectedStation.employees.filter(e => e.role === 'cameraman').length}</div>
                      <div className="text-xs text-muted">摄像</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{selectedStation.employees.filter(e => e.role === 'reporter').length}</div>
                      <div className="text-xs text-muted">记者</div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <div className="text-sm font-semibold mb-2">节目库 ({selectedStation.programs.length})</div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedStation.programs.slice(0, 5).map(program => (
                      <div key={program.id} className="flex items-center gap-2 text-sm">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center text-xs"
                          style={{ backgroundColor: categoryColors[program.category] + '30', color: categoryColors[program.category] }}
                        >
                          {categoryNames[program.category][0]}
                        </div>
                        <span className="truncate">{program.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted">
                <Eye size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">点击排行榜查看电视台详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
