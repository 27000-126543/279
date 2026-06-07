import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { tvStationAPI } from '../services/api';
import { WeeklyReport } from '../types';
import { FileBarChart, Download, TrendingUp, Users, DollarSign, Star, Eye } from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const ReportsPage: React.FC = () => {
  const { tvStation } = useApp();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const generateReport = async () => {
    if (!tvStation) return;
    setLoading(true);
    try {
      const data = await tvStationAPI.generateWeeklyReport(tvStation.id);
      setReport(data);
    } catch (error) {
      console.error('生成报告失败', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#0f172a'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${tvStation?.name || '电视台'}_周报.pdf`);
    } catch (error) {
      console.error('导出PDF失败', error);
    }
  };

  const radarData = report ? [
    { subject: '内容质量', value: report.radarData.content, fullMark: 100 },
    { subject: '制作水平', value: report.radarData.production, fullMark: 100 },
    { subject: '影响力', value: report.radarData.influence, fullMark: 100 },
    { subject: '盈利能力', value: report.radarData.profitability, fullMark: 100 },
    { subject: '团队实力', value: report.radarData.team, fullMark: 100 },
  ] : [];

  const trendData = report ? report.revenueTrend.map((rev, i) => ({
    day: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
    revenue: rev,
    viewers: report.viewerTrend[i]
  })) : [];

  const heatmapData = report ? Object.entries(report.programHeatmap).map(([name, viewers]) => ({
    name: name.length > 8 ? name.slice(0, 8) + '...' : name,
    viewers
  })) : [];

  const employeeData = report ? Object.entries(report.employeeGrowth).map(([name, data]) => ({
    name: name.length > 4 ? name.slice(0, 4) : name,
    skill: data.skill,
    loyalty: data.loyalty
  })) : [];

  return (
    <div>
      <div className="header">
        <div>
          <h1 className="text-2xl font-bold">运营报告</h1>
          <p className="text-muted mt-1">分析运营数据，优化节目策略</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={generateReport}
            className="btn-primary flex items-center gap-2"
            disabled={loading || !tvStation}
          >
            <FileBarChart size={18} />
            {loading ? '生成中...' : '生成周报'}
          </button>
          {report && (
            <button
              onClick={exportPDF}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} />
              导出PDF
            </button>
          )}
        </div>
      </div>

      {!report ? (
        <div className="card text-center py-20">
          <FileBarChart size={80} className="mx-auto mb-6 opacity-30 text-muted" />
          <h3 className="text-2xl font-bold mb-2">生成运营周报</h3>
          <p className="text-muted mb-8 max-w-md mx-auto">
            周报包含节目收视率热力图、员工成长曲线、广告收入趋势，以及综合能力雷达图，
            帮助你全面了解电视台运营状况。
          </p>
          <button
            onClick={generateReport}
            className="btn-primary px-8 py-3 text-lg"
            disabled={loading || !tvStation}
          >
            {loading ? '生成中...' : '生成本周运营报告'}
          </button>
        </div>
      ) : (
        <div ref={reportRef} className="space-y-6">
          <div className="card">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">{tvStation?.name} · 周运营报告</h2>
              <p className="text-muted mt-1">
                {new Date(report.weekStart).toLocaleDateString()} - {new Date(report.weekEnd).toLocaleDateString()}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="stat-card">
                <div className="flex items-center gap-2 mb-2">
                  <Eye size={18} className="text-blue-400" />
                  <span className="text-muted text-sm">本周总观众</span>
                </div>
                <div className="stat-value">{report.totalViewers.toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={18} className="text-green-400" />
                  <span className="text-muted text-sm">广告收入</span>
                </div>
                <div className="stat-value">¥{Math.floor(report.totalAdRevenue).toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-2 mb-2">
                  <Star size={18} className="text-yellow-400" />
                  <span className="text-muted text-sm">平均评分</span>
                </div>
                <div className="stat-value">{report.avgRating.toFixed(1)}</div>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={18} className="text-purple-400" />
                  <span className="text-muted text-sm">节目数量</span>
                </div>
                <div className="stat-value">{Object.keys(report.programHeatmap).length}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header flex items-center gap-2">
                <TrendingUp size={18} className="text-green-400" />
                <span>收入与观众趋势</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" name="广告收入" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
                    <Line type="monotone" dataKey="viewers" name="观众数" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header flex items-center gap-2">
                <Star size={18} className="text-purple-400" />
                <span>综合能力雷达图</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#475569" />
                    <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={12} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={10} />
                    <Radar
                      name="能力值"
                      dataKey="value"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.5}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header flex items-center gap-2">
                <Eye size={18} className="text-orange-400" />
                <span>节目收视率热力图</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={heatmapData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="viewers" name="观众数" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header flex items-center gap-2">
                <Users size={18} className="text-cyan-400" />
                <span>员工成长曲线</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employeeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="skill" name="技能值" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="loyalty" name="忠诚度" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
