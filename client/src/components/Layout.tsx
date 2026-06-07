import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Home, Users, Video, Calendar, Swords, ShoppingCart, Trophy, FileBarChart, LogOut, Tv } from 'lucide-react';
import { categoryNames, categoryColors } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { tvStation, logout } = useApp();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/', icon: Home, label: '控制台' },
    { path: '/employees', icon: Users, label: '员工管理' },
    { path: '/programs', icon: Video, label: '节目制作' },
    { path: '/schedule', icon: Calendar, label: '节目编排' },
    { path: '/battle', icon: Swords, label: '收视率对决' },
    { path: '/market', icon: ShoppingCart, label: '版权交易' },
    { path: '/leaderboard', icon: Trophy, label: '全服排行' },
    { path: '/reports', icon: FileBarChart, label: '运营报告' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      <aside className="sidebar">
        <div className="px-6 pb-6 mb-4 border-b border-slate-700">
          {tvStation && (
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                style={{ backgroundColor: categoryColors[tvStation.category] }}
              >
                <Tv size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{tvStation.name}</div>
                <div className="text-xs text-muted">
                  {categoryNames[tvStation.category]} · Lv.{tvStation.level}
                </div>
              </div>
            </div>
          )}
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          {tvStation && (
            <div className="mb-4 px-3">
              <div className="text-xs text-muted mb-1">账户余额</div>
              <div className="text-xl font-bold text-green-400">
                ¥ {tvStation.balance.toLocaleString()}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="sidebar-item w-full text-left"
          >
            <LogOut size={20} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <main className="main-content flex-1">
        {children}
      </main>
    </div>
  );
};
