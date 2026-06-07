import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { tvStationAPI } from '../services/api';
import { Employee, EmployeeRole, roleNames } from '../types';
import { UserPlus, Trash2, Star, Heart, Briefcase, TrendingUp, X } from 'lucide-react';

export const EmployeesPage: React.FC = () => {
  const { tvStation, refreshStation } = useApp();
  const [showHireModal, setShowHireModal] = useState(false);
  const [hireRole, setHireRole] = useState<EmployeeRole>('host');
  const [firing, setFiring] = useState(false);

  if (!tvStation) return null;

  const roles: EmployeeRole[] = ['host', 'director', 'cameraman', 'reporter'];

  const handleHire = async () => {
    try {
      await tvStationAPI.hireEmployee(tvStation.id, hireRole);
      await refreshStation();
      setShowHireModal(false);
    } catch (error: any) {
      alert(error.response?.data?.error || '招聘失败');
    }
  };

  const handleFire = async (employeeId: string) => {
    if (!confirm('确定要解雇这名员工吗？将支付3个月薪水作为遣散费。')) return;
    
    try {
      setFiring(true);
      await tvStationAPI.fireEmployee(tvStation.id, employeeId);
      await refreshStation();
    } catch (error: any) {
      alert(error.response?.data?.error || '解雇失败');
    } finally {
      setFiring(false);
    }
  };

  const renderEmployeeCard = (employee: Employee) => (
    <div key={employee.id} className="card">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
          {employee.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg truncate">{employee.name}</h3>
            <span className="badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc' }}>
              Lv.{employee.level}
            </span>
          </div>
          <p className="text-sm text-muted mb-3">{roleNames[employee.role]}</p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Star size={14} className="text-yellow-400 flex-shrink-0" />
              <span className="text-sm w-12">技能</span>
              <div className="flex-1 progress-bar">
                <div
                  className="progress-fill bg-yellow-500"
                  style={{ width: `${employee.skill}%` }}
                />
              </div>
              <span className="text-sm font-semibold w-10 text-right">{employee.skill.toFixed(0)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart size={14} className="text-pink-400 flex-shrink-0" />
              <span className="text-sm w-12">忠诚</span>
              <div className="flex-1 progress-bar">
                <div
                  className="progress-fill bg-pink-500"
                  style={{ width: `${employee.loyalty}%` }}
                />
              </div>
              <span className="text-sm font-semibold w-10 text-right">{employee.loyalty.toFixed(0)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700">
            <div>
              <div className="text-xs text-muted">月薪</div>
              <div className="font-semibold text-green-400">¥{employee.salary.toLocaleString()}</div>
            </div>
            <button
              onClick={() => handleFire(employee.id)}
              disabled={firing}
              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="header">
        <div>
          <h1 className="text-2xl font-bold">员工管理</h1>
          <p className="text-muted mt-1">管理你的团队，打造传媒梦之队</p>
        </div>
        <button onClick={() => setShowHireModal(true)} className="btn-primary flex items-center gap-2">
          <UserPlus size={18} />
          招聘员工
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {roles.map(role => {
          const employees = tvStation.employees.filter(e => e.role === role);
          return (
            <div key={role} className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Briefcase size={20} />
                {roleNames[role]} ({employees.length})
              </div>
              {employees.map(renderEmployeeCard)}
            </div>
          );
        })}
      </div>

      {showHireModal && (
        <div className="modal-overlay" onClick={() => setShowHireModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">招聘新员工</h2>
              <button
                onClick={() => setShowHireModal(false)}
                className="p-2 rounded-lg hover:bg-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm mb-3 font-semibold">选择职位</label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map(role => (
                  <button
                    key={role}
                    onClick={() => setHireRole(role)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      hireRole === role
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-slate-700 bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    <div className="font-semibold">{roleNames[role]}</div>
                    <div className="text-xs text-muted mt-1">
                      年薪约 ¥{((1 + Math.random() * 2) * 12000).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-6">
              <div className="flex items-center gap-2 text-yellow-400 font-semibold mb-2">
                <TrendingUp size={18} />
                招聘须知
              </div>
              <ul className="text-sm text-yellow-200/80 space-y-1">
                <li>• 需一次性支付12个月薪水作为签约费</li>
                <li>• 员工技能随节目制作经验自动提升</li>
                <li>• 高技能员工能制作更高质量的节目</li>
                <li>• 忠诚度影响节目制作稳定性</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowHireModal(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button onClick={handleHire} className="btn-primary flex-1">
                确认招聘
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
