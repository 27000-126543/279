import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { tvStationAPI } from '../services/api';
import { Program, ChannelCategory, ProgramType, categoryNames, categoryColors } from '../types';
import { Video, Plus, X, Clock, Star, Users, Film, Zap } from 'lucide-react';

export const ProgramsPage: React.FC = () => {
  const { tvStation, refreshStation } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'entertainment' as ChannelCategory,
    type: 'recorded' as ProgramType,
    duration: 60,
    directorId: '',
    hostIds: [] as string[],
    cameramanIds: [] as string[],
    reporterIds: [] as string[]
  });

  if (!tvStation) return null;

  const directors = tvStation.employees.filter(e => e.role === 'director');
  const hosts = tvStation.employees.filter(e => e.role === 'host');
  const cameramen = tvStation.employees.filter(e => e.role === 'cameraman');
  const reporters = tvStation.employees.filter(e => e.role === 'reporter');

  const categories: ChannelCategory[] = ['news', 'music', 'gaming', 'food', 'sports', 'entertainment', 'tech', 'education'];

  const calculatePotential = () => {
    let potential = 50;
    const director = directors.find(d => d.id === formData.directorId);
    if (director) potential += director.skill * 0.3;
    
    formData.hostIds.forEach(id => {
      const h = hosts.find(h => h.id === id);
      if (h) potential += h.skill * 0.25;
    });
    
    formData.cameramanIds.forEach(id => {
      const c = cameramen.find(c => c.id === id);
      if (c) potential += c.skill * 0.1;
    });
    
    formData.reporterIds.forEach(id => {
      const r = reporters.find(r => r.id === id);
      if (r) potential += r.skill * 0.15;
    });
    
    if (formData.type === 'live') potential += 10;
    return Math.min(100, potential);
  };

  const getProductionCost = () => {
    let cost = formData.duration * 100;
    cost += formData.hostIds.length * 500;
    if (formData.directorId) cost += 1000;
    return cost;
  };

  const handleSubmit = async () => {
    try {
      await tvStationAPI.createProgram(tvStation.id, formData);
      await refreshStation();
      setShowCreateModal(false);
      setFormData({
        name: '',
        category: 'entertainment',
        type: 'recorded',
        duration: 60,
        directorId: '',
        hostIds: [],
        cameramanIds: [],
        reporterIds: []
      });
    } catch (error: any) {
      alert(error.response?.data?.error || '创建节目失败');
    }
  };

  const toggleEmployee = (field: 'hostIds' | 'cameramanIds' | 'reporterIds', id: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(id)
        ? prev[field].filter(i => i !== id)
        : [...prev[field], id]
    }));
  };

  return (
    <div>
      <div className="header">
        <div>
          <h1 className="text-2xl font-bold">节目制作</h1>
          <p className="text-muted mt-1">创建高质量节目，提升收视率</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          创建节目
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tvStation.programs.map(program => (
          <div key={program.id} className="card group hover:border-indigo-500/50 transition">
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: categoryColors[program.category] + '30' }}
              >
                <Film size={24} style={{ color: categoryColors[program.category] }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{program.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: categoryColors[program.category] + '20', color: categoryColors[program.category] }}
                  >
                    {categoryNames[program.category]}
                  </span>
                  <span className="text-xs text-muted">
                    {program.type === 'live' ? '直播' : '录播'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star size={14} className="text-yellow-400" />
                <span className="text-sm text-muted">节目质量</span>
                <div className="flex-1 progress-bar">
                  <div
                    className="progress-fill bg-gradient-to-r from-yellow-500 to-orange-500"
                    style={{ width: `${program.quality}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{program.quality.toFixed(0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-purple-400" />
                <span className="text-sm text-muted">收视潜力</span>
                <div className="flex-1 progress-bar">
                  <div
                    className="progress-fill bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${program.potential}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{program.potential.toFixed(0)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700">
              <div className="flex items-center gap-1 text-sm text-muted">
                <Clock size={14} />
                {program.duration}分钟
              </div>
              <div className="flex items-center gap-1 text-sm text-muted">
                <Users size={14} />
                {program.hostIds.length + program.cameramanIds.length + program.reporterIds.length + (program.directorId ? 1 : 0)}人
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">创建新节目</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm mb-2 font-semibold">节目名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入节目名称"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 font-semibold">节目类型</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as ChannelCategory }))}
                    className="w-full"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{categoryNames[cat]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2 font-semibold">播出形式</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as ProgramType }))}
                    className="w-full"
                  >
                    <option value="recorded">录播</option>
                    <option value="live">直播 (+10潜力)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 font-semibold">
                  时长（分钟）· 制作费: ¥{getProductionCost().toLocaleString()}
                </label>
                <input
                  type="range"
                  min="15"
                  max="180"
                  step="15"
                  value={formData.duration}
                  onChange={e => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-center text-sm text-muted mt-1">{formData.duration}分钟</div>
              </div>

              <div>
                <label className="block text-sm mb-2 font-semibold">编导（可选）</label>
                <select
                  value={formData.directorId}
                  onChange={e => setFormData(prev => ({ ...prev, directorId: e.target.value }))}
                  className="w-full"
                >
                  <option value="">不指定编导</option>
                  {directors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} (技能: {d.skill.toFixed(0)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2 font-semibold">主持人（可多选）</label>
                <div className="grid grid-cols-2 gap-2">
                  {hosts.map(h => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => toggleEmployee('hostIds', h.id)}
                      className={`p-3 rounded-lg text-left text-sm transition ${
                        formData.hostIds.includes(h.id)
                          ? 'bg-indigo-500/20 border border-indigo-500'
                          : 'bg-slate-800 border border-transparent hover:bg-slate-700'
                      }`}
                    >
                      <div className="font-semibold">{h.name}</div>
                      <div className="text-xs text-muted">技能: {h.skill.toFixed(0)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 font-semibold">摄像（可多选）</label>
                <div className="grid grid-cols-2 gap-2">
                  {cameramen.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleEmployee('cameramanIds', c.id)}
                      className={`p-3 rounded-lg text-left text-sm transition ${
                        formData.cameramanIds.includes(c.id)
                          ? 'bg-indigo-500/20 border border-indigo-500'
                          : 'bg-slate-800 border border-transparent hover:bg-slate-700'
                      }`}
                    >
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-muted">技能: {c.skill.toFixed(0)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 font-semibold">记者（可多选）</label>
                <div className="grid grid-cols-2 gap-2">
                  {reporters.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleEmployee('reporterIds', r.id)}
                      className={`p-3 rounded-lg text-left text-sm transition ${
                        formData.reporterIds.includes(r.id)
                          ? 'bg-indigo-500/20 border border-indigo-500'
                          : 'bg-slate-800 border border-transparent hover:bg-slate-700'
                      }`}
                    >
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-xs text-muted">技能: {r.skill.toFixed(0)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
                  <Zap size={18} />
                  预估收视潜力: {calculatePotential().toFixed(0)}
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill bg-gradient-to-r from-indigo-500 to-purple-500"
                    style={{ width: `${calculatePotential()}%` }}
                  />
                </div>
                <div className="text-sm text-indigo-300 mt-2">
                  制作费用: ¥{getProductionCost().toLocaleString()}
                  {getProductionCost() > tvStation.balance && (
                    <span className="text-red-400 ml-2">（余额不足）</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="btn-primary flex-1"
                disabled={!formData.name || formData.hostIds.length === 0 || getProductionCost() > tvStation.balance}
              >
                创建节目
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
