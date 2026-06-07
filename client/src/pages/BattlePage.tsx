import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { battleAPI, tvStationAPI } from '../services/api';
import { socketService } from '../services/socket';
import { Battle, TVStation, ChannelCategory, categoryNames, categoryColors } from '../types';
import { Swords, Trophy, Zap, Clock, Users, TrendingUp, Target, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export const BattlePage: React.FC = () => {
  const { tvStation, user, refreshStation } = useApp();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [allStations, setAllStations] = useState<TVStation[]>([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ChannelCategory>('entertainment');
  const [viewerHistory, setViewerHistory] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);

    socketService.on('battle_update', (data: Battle[]) => {
      setBattles(data);
    });

    return () => {
      clearInterval(interval);
      socketService.off('battle_update', () => {});
    };
  }, []);

  useEffect(() => {
    const activeBattle = battles.find(b => b.status === 'active');
    if (activeBattle) {
      const now = Date.now();
      setViewerHistory(prev => {
        const newPoint = {
          time: new Date(now).toLocaleTimeString(),
          challenger: activeBattle.challengerViewers,
          defender: activeBattle.defenderViewers
        };
        return [...prev.slice(-20), newPoint];
      });
    }
  }, [battles]);

  const loadData = async () => {
    try {
      const [battleData, stationData] = await Promise.all([
        battleAPI.getActive(),
        tvStationAPI.getAll()
      ]);
      setBattles(battleData);
      setAllStations(stationData);
    } catch {}
  };

  const getStationById = (id: string) => allStations.find(s => s.id === id);

  const handleChallenge = async () => {
    if (!tvStation || !selectedStation) return;

    try {
      await battleAPI.create({
        challengerId: tvStation.id,
        defenderId: selectedStation,
        category: selectedCategory
      });
      setShowChallengeModal(false);
      setSelectedStation('');
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || '发起对决失败');
    }
  };

  const activeBattle = battles.find(b => b.status === 'active');
  const pendingBattles = battles.filter(b => b.status === 'pending');
  const completedBattles = battles.filter(b => b.status === 'completed').slice(0, 5);

  const categories: ChannelCategory[] = ['news', 'music', 'gaming', 'food', 'sports', 'entertainment', 'tech', 'education'];

  return (
    <div>
      <div className="header">
      <div>
        <h1 className="text-2xl font-bold">收视率对决</h1>
        <p className="text-muted mt-1">与其他电视台一决高下，争夺收视王座</p>
      </div>
      <button
        onClick={() => setShowChallengeModal(true)}
        className="btn-primary flex items-center gap-2"
        disabled={!tvStation || !!activeBattle}
      >
        <Swords size={18} />
        发起挑战
      </button>
    </div>

      <div className="space-y-6">
      {activeBattle && (() => {
        const challenger = getStationById(activeBattle.challengerId);
        const defender = getStationById(activeBattle.defenderId);
        const isChallenger = tvStation?.id === activeBattle.challengerId;
        const isDefender = tvStation?.id === activeBattle.defenderId;
        const isWinning = activeBattle.challengerViewers > activeBattle.defenderViewers;

        return (
          <div className="battle-screen">
            <div className="text-center mb-8 relative z-10">
              <div className="inline-flex items-center gap-2 mb-2">
                <Zap className="text-yellow-400" size={24} />
                <span className="badge badge-live text-base">收视率对决进行中</span>
                <Zap className="text-yellow-400" size={24} />
              </div>
              <h2 className="text-3xl font-bold">
                {categoryNames[activeBattle.category]}频道大战
              </h2>
              <p className="text-muted mt-2">
                奖金: <span className="text-yellow-400 font-bold">¥{activeBattle.prize.toLocaleString()}</span>
                <span className="mx-2">·</span>
                影响力: <span className="text-purple-400 font-bold">+500</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-8 items-center relative z-10">
              <div className={`text-center p-6 rounded-2xl bg-slate-800/50 ${
                isWinning ? 'ring-2 ring-green-500' : ''
              }`}>
                <div
                  className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl font-bold"
                  style={{ backgroundColor: challenger ? categoryColors[challenger.category] : '#666' }}
                >
                  {challenger?.name[0] || '?'}
                </div>
                <h3 className="text-xl font-bold mb-1">
                  {challenger?.name || '未知'}
                  {isChallenger && <span className="text-xs ml-2 text-indigo-400">(你)</span>}
                </h3>
                <p className="text-sm text-muted mb-4">
                  {challenger ? categoryNames[challenger.category] : ''}
                </p>
                <div className="text-4xl font-bold text-blue-400">
                  {activeBattle.challengerViewers.toLocaleString()}
                </div>
                <div className="text-sm text-muted">实时观众</div>
              </div>

              <div className="text-center">
                <div className="text-6xl font-black text-pink-500 opacity-50">VS</div>
                <div className="mt-4">
                  <Clock size={24} className="mx-auto text-yellow-400 animate-pulse" />
                  <div className="text-sm text-muted mt-2">
                    剩余 {Math.max(0, Math.ceil((activeBattle.endTime - Date.now()) / 60000))}分钟
                  </div>
                </div>
              </div>

              <div className={`text-center p-6 rounded-2xl bg-slate-800/50 ${
                !isWinning ? 'ring-2 ring-green-500' : ''
              }`}>
                <div
                  className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl font-bold"
                  style={{ backgroundColor: defender ? categoryColors[defender.category] : '#666' }}
                >
                  {defender?.name[0] || '?'}
                </div>
                <h3 className="text-xl font-bold mb-1">
                  {defender?.name || '未知'}
                  {isDefender && <span className="text-xs ml-2 text-indigo-400">(你)</span>}
                </h3>
                <p className="text-sm text-muted mb-4">
                  {defender ? categoryNames[defender.category] : ''}
                </p>
                <div className="text-4xl font-bold text-red-400">
                  {activeBattle.defenderViewers.toLocaleString()}
                </div>
                <div className="text-sm text-muted">实时观众</div>
              </div>
            </div>

            {viewerHistory.length > 1 && (
              <div className="mt-8 h-48 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={viewerHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="challenger"
                      name={challenger?.name || '挑战方'}
                      stroke="#3b82f6"
                      fill="rgba(59, 130, 246, 0.3)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="defender"
                      name={defender?.name || '防守方'}
                      stroke="#ef4444"
                      fill="rgba(239, 68, 68, 0.3)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      })()}

      {pendingBattles.length > 0 && (
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Clock size={18} className="text-blue-400" />
            <span>即将开始的对决</span>
          </div>
          <div className="space-y-3">
            {pendingBattles.map(battle => {
              const challenger = getStationById(battle.challengerId);
              const defender = getStationById(battle.defenderId);

              return (
                <div key={battle.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold"
                      style={{ backgroundColor: challenger ? categoryColors[challenger.category] : '#666' }}
                    >
                      {challenger?.name[0]}
                    </div>
                    <span className="font-semibold">{challenger?.name || '未知'}</span>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-2xl font-bold text-pink-500">VS</div>
                    <div className="text-xs text-muted">
                      {new Date(battle.startTime).toLocaleTimeString()} 开始
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <span className="font-semibold">{defender?.name || '未知'}</span>
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold"
                      style={{ backgroundColor: defender ? categoryColors[defender.category] : '#666' }}
                    >
                      {defender?.name[0]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Trophy size={18} className="text-yellow-400" />
          <span>历史对决记录</span>
        </div>
        {completedBattles.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <Trophy size={48} className="mx-auto mb-2 opacity-30" />
            <p>暂无对决记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedBattles.map(battle => {
              const challenger = getStationById(battle.challengerId);
              const defender = getStationById(battle.defenderId);
              const winner = getStationById(battle.winnerId || '');

              return (
                <div key={battle.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                        battle.winnerId === battle.challengerId ? 'ring-2 ring-yellow-400' : ''
                      }`}
                      style={{ backgroundColor: challenger ? categoryColors[challenger.category] : '#666' }}
                    >
                      {challenger?.name[0]}
                    </div>
                    <span className={`font-semibold ${
                      battle.winnerId === battle.challengerId ? 'text-yellow-400' : ''
                    }`}>
                      {challenger?.name || '未知'}
                    </span>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-sm">
                      <span className={battle.winnerId === battle.challengerId ? 'text-green-400 font-bold' : 'text-muted'}>
                        {battle.challengerViewers.toLocaleString()}
                      </span>
                      <span className="mx-2 text-muted">:</span>
                      <span className={battle.winnerId === battle.defenderId ? 'text-green-400 font-bold' : 'text-muted'}>
                        {battle.defenderViewers.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-yellow-400 mt-1">
                      {winner?.name || '未知' } 获胜
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <span className={`font-semibold ${
                      battle.winnerId === battle.defenderId ? 'text-yellow-400' : ''
                    }`}>
                      {defender?.name || '未知'}
                    </span>
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                        battle.winnerId === battle.defenderId ? 'ring-2 ring-yellow-400' : ''
                      }`}
                      style={{ backgroundColor: defender ? categoryColors[defender.category] : '#666' }}
                    >
                      {defender?.name[0]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

    {showChallengeModal && (
      <div className="modal-overlay" onClick={() => setShowChallengeModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">发起收视率对决</h2>
          <button
            onClick={() => setShowChallengeModal(false)}
            className="p-2 rounded-lg hover:bg-slate-700"
          >
            <X size={20} />
          </button>
        </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2 font-semibold">选择对决频道</label>
              <div className="grid grid-cols-4 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-3 rounded-lg text-center transition ${
                      selectedCategory === cat
                        ? 'ring-2 ring-white/50'
                        : 'hover:bg-slate-700'
                    }`}
                    style={selectedCategory === cat ? { backgroundColor: categoryColors[cat] + '40' } : {}}
                  >
                    <div
                    className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: categoryColors[cat] }}
                  >
                    {categoryNames[cat][0]}
                  </div>
                    <div className="text-xs">{categoryNames[cat]}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 font-semibold">选择对手</label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allStations
                  .filter(s => s.id !== tvStation?.id)
                  .map(station => (
                    <button
                      key={station.id}
                      onClick={() => setSelectedStation(station.id)}
                      className={`w-full p-3 rounded-lg text-left transition flex items-center gap-3 ${
                        selectedStation === station.id
                          ? 'bg-indigo-500/20 border border-indigo-500'
                          : 'bg-slate-800 border border-transparent hover:bg-slate-700'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center font-bold"
                        style={{ backgroundColor: categoryColors[station.category] }}
                      >
                        {station.name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{station.name}</div>
                        <div className="text-xs text-muted">
                          {categoryNames[station.category]} · Lv.{station.level} · {station.fans}粉丝
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-blue-400">
                          {station.totalViewers.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted">总观众</div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-center gap-2 text-yellow-400 font-semibold mb-2">
                <Target size={18} />
                对决规则
              </div>
              <ul className="text-sm text-yellow-200/80 space-y-1">
                <li>• 对决持续15分钟，比较双方同时段节目观众数</li>
                <li>• 获胜方获得奖金和影响力奖励</li>
                <li>• 比赛结果全服公告，扬名立万</li>
                <li>• 需在对决期间请确保有节目正在播出</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowChallengeModal(false)}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              onClick={handleChallenge}
              className="btn-primary flex-1"
              disabled={!selectedStation}
            >
              发起挑战
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};
