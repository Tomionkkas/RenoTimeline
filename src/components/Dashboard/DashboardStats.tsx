import React from 'react';
import { TrendingUp, CheckCircle, Clock, Users, Info } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import ProductivityBreakdown from './ProductivityBreakdown';

const DashboardStats = () => {
  const { stats, loading } = useDashboardStats();

  const statsConfig = [
    {
      title: 'Ukończone zadania',
      value: loading ? '...' : stats.completedTasks.toString(),
      change: stats.completedTasksChange,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      progressColor: 'from-emerald-500 to-emerald-600',
      showBreakdown: false
    },
    {
      title: 'Zadania w toku',
      value: loading ? '...' : stats.activeTasks.toString(),
      change: stats.activeTasksChange,
      icon: Clock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      progressColor: 'from-emerald-500 to-emerald-600',
      showBreakdown: false
    },
    {
      title: 'Aktywne projekty',
      value: loading ? '...' : stats.totalProjects.toString(),
      change: stats.projectsChange,
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      progressColor: 'from-emerald-500 to-emerald-600',
      showBreakdown: false
    },
    {
      title: 'Produktywność',
      value: loading ? '...' : `${stats.productivity}%`,
      change: stats.productivityChange,
      icon: TrendingUp,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      progressColor: 'from-emerald-500 to-emerald-600',
      showBreakdown: true
    },
  ];

  const getChangeColor = (change: string) => {
    if (change.startsWith('+') && change !== '+0' && change !== '+0%') {
      return 'text-emerald-400';
    } else if (change.startsWith('-')) {
      return 'text-red-400';
    } else {
      return 'text-white/60';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsConfig.map((stat, index) => {
        const Icon = stat.icon;
        const changeColor = getChangeColor(stat.change);
        const progressPercentage = stat.title === 'Produktywność' ? stats.productivity : 
          stat.title === 'Ukończone zadania' ? Math.min((stats.completedTasks / Math.max(stats.completedTasks + stats.activeTasks, 1)) * 100, 100) :
          stat.title === 'Zadania w toku' ? Math.min((stats.activeTasks / Math.max(stats.completedTasks + stats.activeTasks, 1)) * 100, 100) :
          stat.title === 'Aktywne projekty' ? Math.min((stats.totalProjects / Math.max(stats.totalProjects, 1)) * 100, 100) : 0;
        
        return (
          <div
            key={index}
            className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in relative group overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Subtle background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className={`p-3 rounded-lg ${stat.bgColor} backdrop-blur-sm border border-white/10`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${changeColor} bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm`}>
                    {stat.change}
                  </span>
                  {stat.showBreakdown && stats.productivityMetrics && (
                    <ProductivityBreakdown 
                      productivity={stats.productivity}
                      metrics={stats.productivityMetrics}
                      trigger={
                        <button className="p-2 rounded-md hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                          <Info className="w-4 h-4 text-white/70 hover:text-white" />
                        </button>
                      }
                    />
                  )}
                </div>
              </div>
              
              <h3 className="text-3xl font-bold text-white mb-2">{stat.value}</h3>
              <p className="text-white/70 text-sm font-medium mb-4">{stat.title}</p>
              
              {/* Refined progress circle */}
              <div className="relative w-16 h-16 mx-auto">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="2"
                  />
                  {/* Progress circle */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={`url(#progress-${index})`}
                    strokeWidth="2"
                    strokeDasharray={`${progressPercentage}, 100`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id={`progress-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-white/80">{Math.round(progressPercentage)}%</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;
