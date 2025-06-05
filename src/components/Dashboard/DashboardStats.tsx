
import React from 'react';
import { TrendingUp, CheckCircle, Clock, Users } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';

const DashboardStats = () => {
  const { stats, loading } = useDashboardStats();

  const statsConfig = [
    {
      title: 'Ukończone zadania',
      value: loading ? '...' : stats.completedTasks.toString(),
      change: '+12%',
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      title: 'Zadania w toku',
      value: loading ? '...' : stats.activeTasks.toString(),
      change: '+3',
      icon: Clock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      title: 'Aktywne projekty',
      value: loading ? '...' : stats.totalProjects.toString(),
      change: '+2',
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
    {
      title: 'Produktywność',
      value: loading ? '...' : `${stats.productivity}%`,
      change: '+5%',
      icon: TrendingUp,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsConfig.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-card p-6 rounded-xl border border-gray-800 card-hover animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-sm text-green-400 font-medium">
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-gray-400 text-sm">{stat.title}</p>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;
