import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { tradeAPI, tvStationAPI } from '../services/api';
import { socketService } from '../services/socket';
import { Trade, Program, categoryColors, categoryNames } from '../types';
import { ShoppingCart, Tag, DollarSign, Zap, TrendingUp, Clock, X, Copyright } from 'lucide-react';

export const MarketPage: React.FC = () => {
  const { tvStation, user, refreshStation } = useApp();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showListModal, setShowListModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [price, setPrice] = useState<number>(10000);

  useEffect(() => {
    loadTrades();
    const interval = setInterval(loadTrades, 5000);

    socketService.on('trade_new', () => loadTrades());
    socketService.on('trade_complete', () => loadTrades());

    return () => {
      clearInterval(interval);
      socketService.off('trade_new', () => {});
      socketService.off('trade_complete', () => {});
    };
  }, []);

  const loadTrades = async () => {
    try {
      const data = await tradeAPI.getAll();
      setTrades(data);
    } catch {}
  };

  const handleList = async () => {
    if (!tvStation || !selectedProgram || !user) return;

    const program = tvStation.programs.find(p => p.id === selectedProgram);
    if (!program) return;

    try {
      await tradeAPI.list({
        sellerId: user.id,
        itemType: 'copyright',
        itemId: selectedProgram,
        itemName: program.name,
        price
      });
      setShowListModal(false);
      setSelectedProgram('');
      setPrice(10000);
      await loadTrades();
    } catch (error: any) {
      alert(error.response?.data?.error || '上架失败');
    }
  };

  const handleBuy = async (tradeId: string) => {
    if (!user) return;
    if (!confirm('确定要购买这个版权吗？')) return;

    try {
      await tradeAPI.buy(tradeId, user.id);
      await refreshStation();
      await loadTrades();
    } catch (error: any) {
      alert(error.response?.data?.error || '购买失败');
    }
  };

  const getSuggestedPriceRange = () => {
    const avg7d = trades.filter(t => t.status === 'sold' && (t.soldAt || 0) > Date.now() - 7 * 24 * 60 * 60 * 1000)
      .reduce((sum, t) => sum + t.price, 0) / (trades.filter(t => t.status === 'sold').length || 1);
    
    const base = avg7d > 0 ? avg7d : 10000;
    return { min: Math.floor(base * 0.7), max: Math.floor(base * 1.3), avg: Math.floor(base) };
  };

  const myTrades = trades.filter(t => t.sellerId === user?.id);
  const otherTrades = trades.filter(t => t.sellerId !== user?.id);

  return (
    <div>
      <div className="header">
        <div>
          <h1 className="text-2xl font-bold">版权交易市场</h1>
          <p className="text-muted mt-1">买卖独家节目版权，打造你的商业帝国</p>
        </div>
        <button
          onClick={() => setShowListModal(true)}
          className="btn-primary flex items-center gap-2"
          disabled={!tvStation || tvStation.programs.filter(p => p.copyrightOwned).length === 0}
        >
          <Tag size={18} />
          上架版权
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart size={18} className="text-blue-400" />
            <span className="text-muted text-sm">在售商品</span>
          </div>
          <div className="stat-value">{trades.length}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-green-400" />
            <span className="text-muted text-sm">7日均价</span>
          </div>
          <div className="stat-value">¥{getSuggestedPriceRange().avg.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Copyright size={18} className="text-purple-400" />
            <span className="text-muted text-sm">我的版权</span>
          </div>
          <div className="stat-value">
            {tvStation?.programs.filter(p => p.copyrightOwned).length || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-yellow-400" />
            <span className="text-muted text-sm">我的在售</span>
          </div>
          <div className="stat-value">{myTrades.length}</div>
        </div>
      </div>

      {otherTrades.length === 0 ? (
        <div className="card text-center py-16">
          <ShoppingCart size={64} className="mx-auto mb-4 opacity-30 text-muted" />
          <h3 className="text-xl font-semibold mb-2">市场暂无商品</h3>
          <p className="text-muted">成为第一个上架节目版权的玩家吧！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherTrades.map(trade => {
            const sellerStation = trade.sellerId ? tvStation : null;

            return (
              <div key={trade.id} className="card hover:border-indigo-500/50 transition">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Copyright size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="badge bg-purple-500/20 text-purple-400 mb-2">
                      {trade.itemType === 'copyright' ? '节目版权' : '员工合同'}
                    </div>
                    <h3 className="font-semibold truncate">{trade.itemName}</h3>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted text-sm">建议价格区间</span>
                    <span className="text-sm">
                      ¥{trade.suggestedMin.toLocaleString()} ~ ¥{trade.suggestedMax.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                    <div className="text-sm text-green-400 mb-1">售价</div>
                    <div className="text-2xl font-bold text-green-400">
                      ¥{trade.price.toLocaleString()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleBuy(trade.id)}
                  className="btn-primary w-full"
                  disabled={!tvStation || tvStation.balance < trade.price}
                >
                  <DollarSign size={16} className="inline mr-1" />
                  立即购买
                  {tvStation && tvStation.balance < trade.price && (
                    <span className="text-xs ml-1">(余额不足)</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showListModal && (
        <div className="modal-overlay" onClick={() => setShowListModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">上架节目版权</h2>
              <button
                onClick={() => setShowListModal(false)}
                className="p-2 rounded-lg hover:bg-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 font-semibold">选择节目</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {tvStation?.programs
                    .filter(p => p.copyrightOwned)
                    .map(program => (
                      <button
                        key={program.id}
                        onClick={() => setSelectedProgram(program.id)}
                        className={`w-full p-3 rounded-lg text-left transition flex items-center gap-3 ${
                          selectedProgram === program.id
                            ? 'bg-indigo-500/20 border border-indigo-500'
                            : 'bg-slate-800 border border-transparent hover:bg-slate-700'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: categoryColors[program.category] + '30' }}
                        >
                          <span style={{ color: categoryColors[program.category] }}>
                            {categoryNames[program.category][0]}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{program.name}</div>
                          <div className="text-xs text-muted">
                            质量 {program.quality.toFixed(0)} · 潜力 {program.potential.toFixed(0)}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 font-semibold">
                  定价 · 7天市场均价: ¥{getSuggestedPriceRange().avg.toLocaleString()}
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(Math.max(1000, parseInt(e.target.value) || 0))}
                  className="w-full text-lg"
                  min={1000}
                  step={1000}
                />
                <div className="flex justify-between mt-2 text-xs text-muted">
                  <span>建议最低价: ¥{getSuggestedPriceRange().min.toLocaleString()}</span>
                  <span>建议最高价: ¥{getSuggestedPriceRange().max.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-center gap-2 text-yellow-400 font-semibold mb-2">
                  <Zap size={18} />
                  上架须知
                </div>
                <ul className="text-sm text-yellow-200/80 space-y-1">
                  <li>• 出售后您将不再拥有该节目版权</li>
                  <li>• 系统会根据近7天市场价给出建议区间</li>
                  <li>• 成交后将触发全服头条事件</li>
                  <li>• 交易成功后资金即时到账</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowListModal(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleList}
                className="btn-primary flex-1"
                disabled={!selectedProgram}
              >
                确认上架
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
