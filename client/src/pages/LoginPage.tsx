import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Tv, Users, Trophy, TrendingUp } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const { login, loading } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      await login(username.trim());
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 mb-4">
              <Tv size={40} />
            </div>
            <h1 className="text-3xl font-bold mb-2">虚拟电视台</h1>
            <p className="text-muted">打造你的传媒帝国，角逐收视率之巅</p>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">开始你的征途</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm mb-2 text-muted">输入你的昵称</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入昵称"
                  className="w-full"
                  autoFocus
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={!username.trim()}>
                进入游戏
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-12 items-center">
        <div className="max-w-lg">
          <h2 className="text-4xl font-bold mb-8">成为传媒大亨</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Tv size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">创建专属电视台</h3>
                <p className="text-white/70">选择频道定位，打造独特的节目内容，吸引亿万观众</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">组建精英团队</h3>
                <p className="text-white/70">招聘知名主持人、金牌编导、资深记者，打造梦之队</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Trophy size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">收视率对决</h3>
                <p className="text-white/70">与其他电视台一决高下，争夺收视王座</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">版权交易市场</h3>
                <p className="text-white/70">买卖独家节目版权和明星合同，商业帝国由此崛起</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
