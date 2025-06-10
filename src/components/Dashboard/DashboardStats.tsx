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
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      showBreakdown: false
    },
    {
      title: 'Zadania w toku',
      value: loading ? '...' : stats.activeTasks.toString(),
      change: stats.activeTasksChange,
      icon: Clock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      showBreakdown: false
    },
    {
      title: 'Aktywne projekty',
      value: loading ? '...' : stats.totalProjects.toString(),
      change: stats.projectsChange,
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      showBreakdown: false
    },
    {
      title: 'Produktywność',
      value: loading ? '...' : `${stats.productivity}%`,
      change: stats.productivityChange,
      icon: TrendingUp,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      showBreakdown: true
    },
  ];

  const getChangeColor = (change: string) => {
    if (change.startsWith('+') && change !== '+0' && change !== '+0%') {
      return 'text-green-400';
    } else if (change.startsWith('-')) {
      return 'text-red-400';
    } else {
      return 'text-gray-400';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsConfig.map((stat, index) => {
        const Icon = stat.icon;
        const changeColor = getChangeColor(stat.change);
        
        return (
          <div
            key={index}
            className="bg-card p-6 rounded-xl border border-gray-800 card-hover animate-fade-in relative group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${changeColor}`}>
                  {stat.change}
                </span>
                {stat.showBreakdown && stats.productivityMetrics && (
                  <ProductivityBreakdown 
                    productivity={stats.productivity}
                    metrics={stats.productivityMetrics}
                    trigger={
                      <button className="p-1 rounded-full hover:bg-gray-700/50 transition-colors opacity-0 group-hover:opacity-100">
                        <Info className="w-4 h-4 text-gray-400 hover:text-white" />
                      </button>
                    }
                  />
                )}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-gray-400 text-sm">{stat.title}</p>
            {stat.showBreakdown && (
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;
