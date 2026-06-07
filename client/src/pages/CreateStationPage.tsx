import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChannelCategory, categoryNames, categoryColors } from '../types';

const categories: ChannelCategory[] = ['news', 'music', 'gaming', 'food', 'sports', 'entertainment', 'tech', 'education'];

const categoryDescriptions: Record<ChannelCategory, string> = {
  news: '报道天下大事，传递权威资讯。打造最具公信力的新闻平台。',
  music: '引领音乐潮流，分享动听旋律。打造年轻人最爱的音乐频道。',
  gaming: '电竞风云，游戏世界。打造专业游戏直播与赛事频道。',
  food: '舌尖盛宴，美食探索。打造最具食欲的美食节目频道。',
  sports: '激情赛场，运动精神。打造全方位体育赛事报道平台。',
  entertainment: '娱乐八卦，明星动态。打造最潮娱乐圈话题频道。',
  tech: '科技前沿，数码评测。打造最专业的科技资讯平台。',
  education: '知识传播，智慧启迪。打造寓教于乐的教育频道。'
};

export const CreateStationPage: React.FC = () => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ChannelCategory>('entertainment');
  const [description, setDescription] = useState('');
  const { createStation } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      await createStation(name.trim(), category, description.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">创建你的电视台</h1>
          <p className="text-muted">选择频道定位，开启你的传媒帝国之旅</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card mb-6">
            <div className="mb-6">
              <label className="block text-sm mb-2 font-semibold">电视台名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入电视台名称"
                className="w-full text-lg"
                maxLength={20}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm mb-3 font-semibold">选择频道定位</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      category === cat
                        ? 'border-white/50 bg-white/10'
                        : 'border-transparent bg-slate-800 hover:bg-slate-700'
                    }`}
                    style={category === cat ? { borderColor: categoryColors[cat] } : {}}
                  >
                    <div
                      className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-bold"
                      style={{ backgroundColor: categoryColors[cat] }}
                    >
                      {categoryNames[cat][0]}
                    </div>
                    <div className="font-semibold">{categoryNames[cat]}</div>
                  </button>
                ))}
              </div>
              <div className="mt-4 p-4 rounded-xl bg-slate-800/50">
                <p className="text-sm text-muted">{categoryDescriptions[category]}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 font-semibold">简介（选填）</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="介绍一下你的电视台..."
                className="w-full h-24 resize-none"
                maxLength={200}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-4 text-lg" disabled={!name.trim()}>
            创建电视台，开始运营
          </button>
        </form>
      </div>
    </div>
  );
};
