import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ExternalLink, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface CalcRenoNotification {
  id: string;
  type: 'budget_updated' | 'cost_alert' | 'project_milestone' | 'material_price_change';
  title: string;
  message: string;
  project_name: string;
  project_id: string;
  calcreno_project_id: string;
  calcreno_reference_url?: string;
  priority: 'low' | 'medium' | 'high';
  data?: {
    budget_change?: number;
    cost_impact?: number;
    percentage_change?: number;
  };
  created_at: string;
  read: boolean;
}

interface CalcRenoNotificationCardProps {
  notification: CalcRenoNotification;
  onMarkAsRead?: (id: string) => void;
  onOpenProject?: (projectId: string) => void;
}

const CalcRenoNotificationCard: React.FC<CalcRenoNotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onOpenProject,
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'budget_updated':
        return <DollarSign className="w-5 h-5 text-blue-600" />;
      case 'cost_alert':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'project_milestone':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'material_price_change':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <DollarSign className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleOpenCalcReno = () => {
    if (notification.calcreno_reference_url) {
      window.open(notification.calcreno_reference_url, '_blank');
    }
  };

  const handleOpenProject = () => {
    onOpenProject?.(notification.project_id);
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      notification.read ? 'bg-gray-50' : 'bg-white border-l-4 border-l-blue-500'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                  📊 CalcReno
                </Badge>
                <Badge variant="outline" className={`text-xs ${getPriorityColor()}`}>
                  {notification.priority}
                </Badge>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {new Date(notification.created_at).toLocaleDateString('pl-PL')}
              </span>
            </div>

            <h4 className="font-semibold text-gray-900 mb-1">
              {notification.title}
            </h4>
            
            <p className="text-sm text-gray-600 mb-2">
              {notification.message}
            </p>

            <p className="text-xs text-gray-500 mb-3">
              Projekt: <span className="font-medium">{notification.project_name}</span>
            </p>

            {/* Data insights */}
            {notification.data && (
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                {notification.data.budget_change && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span>Zmiana budżetu: </span>
                    <span className={`font-medium ${
                      notification.data.budget_change > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {notification.data.budget_change > 0 ? '+' : ''}
                      {notification.data.budget_change.toLocaleString()} zł
                    </span>
                  </div>
                )}
                {notification.data.percentage_change && (
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span>Zmiana procentowa: </span>
                    <span className={`font-medium ${
                      notification.data.percentage_change > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {notification.data.percentage_change > 0 ? '+' : ''}
                      {notification.data.percentage_change}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenProject}
                className="text-xs"
              >
                Otwórz harmonogram
              </Button>
              {notification.calcreno_reference_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenCalcReno}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Zobacz w CalcReno
                </Button>
              )}
              {!notification.read && onMarkAsRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="text-xs text-gray-500"
                >
                  Oznacz jako przeczytane
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalcRenoNotificationCard; 