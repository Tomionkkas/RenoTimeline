import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle, Clock, XCircle, RotateCcw, Trash2, Filter, TrendingUp, Activity, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useWorkflowExecution } from '../../hooks/useWorkflowExecution';
import type { WorkflowExecution, WorkflowExecutionStatus } from '../../lib/types/workflow';

interface WorkflowExecutionLogProps {
  workflowId?: string;
  onClose: () => void;
}

const statusIcons = {
  success: CheckCircle,
  failed: AlertCircle,
  partial: Clock
};

const statusColors = {
  success: 'bg-gradient-to-r from-green-600 to-green-500 text-white border-0',
  failed: 'bg-gradient-to-r from-red-600 to-red-500 text-white border-0',
  partial: 'bg-gradient-to-r from-yellow-600 to-orange-500 text-white border-0'
};

const statusLabels = {
  success: 'Sukces',
  failed: 'Błąd', 
  partial: 'Częściowe'
};

export function WorkflowExecutionLog({ workflowId, onClose }: WorkflowExecutionLogProps) {
  const { 
    executions, 
    loading, 
    error, 
    retryFailedExecution, 
    cancelExecution, 
    deleteExecution,
    fetchExecutionHistory,
    getExecutionStats
  } = useWorkflowExecution(workflowId);

  const [statusFilter, setStatusFilter] = useState<'success' | 'failed' | 'partial' | 'all'>('all');
  const [stats, setStats] = useState({ total: 0, successful: 0, failed: 0, running: 0, successRate: 0 });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // Show only 10 executions per page

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch stats for all executions
        const executionStats = await getExecutionStats(undefined);
        setStats(executionStats);
        
        // Fetch limited executions (recent only) - explicitly pass undefined to get ALL executions
        await fetchExecutionHistory(undefined);
      } catch (error) {
        console.error('Błąd podczas pobierania danych wykonań:', error);
        setStats({ total: 0, successful: 0, failed: 0, running: 0, successRate: 0 });
      }
    };
    loadData();
  }, [workflowId]);

  const filteredExecutions = executions.filter(execution => 
    statusFilter === 'all' || execution.status === statusFilter
  );

  // Filter and paginate executions for display
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedExecutions = filteredExecutions.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredExecutions.length / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const handleRetry = async (executionId: string) => {
    try {
      await retryFailedExecution(executionId);
    } catch (error) {
      console.error('Nie udało się ponownie uruchomić wykonania:', error);
    }
  };

  const handleCancel = async (executionId: string) => {
    try {
      await cancelExecution(executionId);
    } catch (error) {
      console.error('Nie udało się anulować wykonania:', error);
    }
  };

  const handleDelete = async (executionId: string) => {
    if (confirm('Czy na pewno chcesz usunąć ten rekord wykonania?')) {
      try {
        await deleteExecution(executionId);
      } catch (error) {
        console.error('Nie udało się usunąć wykonania:', error);
      }
    }
  };

  const formatDuration = (startedAt: string, finishedAt?: string) => {
    const start = new Date(startedAt);
    const end = finishedAt ? new Date(finishedAt) : new Date();
    const duration = end.getTime() - start.getTime();
    
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${Math.round(duration / 1000)}s`;
    return `${Math.round(duration / 60000)}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="p-4 bg-purple-800/30 rounded-full mb-4 mx-auto w-fit">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          </div>
          <p className="text-purple-100 font-medium">Ładowanie historii wykonań...</p>
          <p className="text-purple-300/70 text-sm mt-1">Analizujemy wykonania przepływów pracy</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Enhanced Header */}
      <div className="flex items-center gap-6 animate-slideUp">
        <Button 
          variant="outline" 
          onClick={onClose}
          className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Powrót
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Historia wykonań workflow
          </h2>
          <p className="text-gray-300 text-lg">
            Monitoruj i zarządzaj historią wykonań workflow
          </p>
        </div>
      </div>

      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-slideUp" style={{ animationDelay: '100ms' }}>
        <Card className="bg-gradient-to-br from-blue-900 via-blue-900 to-blue-800 border-blue-600 shadow-xl hover:border-blue-500 transition-all duration-300 transform hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-800/50 rounded-lg border border-blue-600/30">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-100">{stats.total}</div>
                <p className="text-blue-300/80 text-sm font-medium">Łączne wykonania</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-900 via-green-900 to-green-800 border-green-600 shadow-xl hover:border-green-500 transition-all duration-300 transform hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-800/50 rounded-lg border border-green-600/30">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-100">{stats.successful}</div>
                <p className="text-green-300/80 text-sm font-medium">Pomyślne</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-900 via-red-900 to-red-800 border-red-600 shadow-xl hover:border-red-500 transition-all duration-300 transform hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-800/50 rounded-lg border border-red-600/30">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-100">{stats.failed}</div>
                <p className="text-red-300/80 text-sm font-medium">Błędne</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-900 via-purple-900 to-purple-800 border-purple-600 shadow-xl hover:border-purple-500 transition-all duration-300 transform hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-800/50 rounded-lg border border-purple-600/30">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-100">{stats.successRate.toFixed(1)}%</div>
                <p className="text-purple-300/80 text-sm font-medium">Wskaźnik sukcesu</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Controls */}
      <div className="flex items-center justify-between animate-slideUp" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-600/30">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all" className="text-white hover:bg-gray-700">Wszystkie</SelectItem>
                <SelectItem value="success" className="text-white hover:bg-gray-700">Pomyślne</SelectItem>
                <SelectItem value="failed" className="text-white hover:bg-gray-700">Błędne</SelectItem>
                <SelectItem value="partial" className="text-white hover:bg-gray-700">Częściowe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => fetchExecutionHistory(undefined)}
          className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Odśwież
        </Button>
      </div>

      {/* Enhanced Error Display */}
      {error && (
        <Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30 shadow-xl animate-slideUp">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-800/30 rounded-lg border border-red-600/30">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="font-medium text-red-100">Błąd ładowania wykonań</p>
                <p className="text-red-300/70 text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Executions List */}
      {paginatedExecutions.length === 0 ? (
        <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-600 shadow-xl animate-slideUp">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="p-6 bg-gray-800/30 rounded-full mb-6 mx-auto w-fit">
                <Clock className="h-16 w-16 text-gray-400" />
              </div>
                              <h3 className="text-2xl font-bold text-white mb-4">Nie znaleziono wykonań</h3>
              <p className="text-gray-300 text-lg max-w-md mx-auto">
                {statusFilter === 'all' 
                  ? 'Ten workflow nie został jeszcze wykonany'
                  : `Nie znaleziono wykonań o statusie "${statusLabels[statusFilter as keyof typeof statusLabels] || statusFilter}"`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pagination Info */}
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>
              Wyświetlanie {startIndex + 1}-{Math.min(endIndex, filteredExecutions.length)} z {filteredExecutions.length} wykonań
            </span>
            <span>Strona {currentPage} z {totalPages}</span>
          </div>

          {paginatedExecutions.map((execution, index) => {
            const StatusIcon = statusIcons[execution.status];
            
            return (
              <Card 
                key={execution.id} 
                className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-600 shadow-xl hover:border-gray-500 transition-all duration-300 transform hover:scale-105 animate-slideUp" 
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-800/30 rounded-lg border border-blue-600/30">
                        <StatusIcon className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-white">
                          Wykonanie #{execution.id.slice(-8)}
                        </CardTitle>
                        <CardDescription className="text-gray-300 mt-1">
                          {new Date(execution.execution_time).toLocaleString('pl-PL')}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={statusColors[execution.status]}>
                        {statusLabels[execution.status]}
                      </Badge>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {execution.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetry(execution.id)}
                            title="Ponów wykonanie"
                            className="border-gray-600 text-yellow-400 hover:bg-yellow-900/20 hover:border-yellow-500/30 transition-all duration-200"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(execution.id)}
                          title="Usuń rekord"
                          className="border-gray-600 text-red-400 hover:bg-red-900/20 hover:border-red-500/30 transition-all duration-200"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-500/30">
                      <div className="flex items-center space-x-2 mb-1">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-300 text-sm font-semibold">Czas trwania</span>
                      </div>
                      <p className="text-white font-medium">{formatDuration(execution.execution_time)}</p>
                    </div>
                    
                    <div className="p-3 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg border border-green-500/30">
                      <div className="flex items-center space-x-2 mb-1">
                        <Zap className="w-4 h-4 text-green-400" />
                        <span className="text-green-300 text-sm font-semibold">Wykonane akcje</span>
                      </div>
                      <p className="text-white font-medium">{execution.executed_actions?.length || 0}</p>
                    </div>
                    
                    <div className="p-3 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30">
                      <div className="flex items-center space-x-2 mb-1">
                        <Activity className="w-4 h-4 text-purple-400" />
                        <span className="text-purple-300 text-sm font-semibold">Wyzwalacz</span>
                      </div>
                      <p className="text-white font-medium capitalize">
                        {execution.trigger_data ? 
                          Object.keys(execution.trigger_data)[0]?.replace(/_/g, ' ') || 'Nieznany' : 
                          'Nieznany'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* Error message for failed executions */}
                  {execution.status === 'failed' && execution.error_message && (
                    <div className="p-4 bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-lg border border-red-500/30">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <span className="text-red-200 font-semibold">Szczegóły błędu:</span>
                      </div>
                      <p className="text-red-300/90 text-sm">{execution.error_message}</p>
                    </div>
                  )}
                  
                  {/* Execution details */}
                  {execution.executed_actions && execution.executed_actions.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-gray-900/20 to-gray-800/20 rounded-lg border border-gray-600/30">
                      <div className="flex items-center space-x-2 mb-3">
                        <Zap className="w-5 h-5 text-blue-400" />
                        <span className="text-blue-200 font-semibold">Wykonane akcje:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {execution.executed_actions.map((action, index) => (
                          <Badge key={index} variant="outline" className="border-gray-600 text-gray-300 text-xs">
                            {action.type?.replace(/_/g, ' ') || 'Nieznana akcja'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Poprzednia
              </Button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === totalPages || 
                    Math.abs(page - currentPage) <= 1
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="text-gray-500">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={
                          currentPage === page
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "border-gray-600 text-gray-300 hover:bg-gray-800"
                        }
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Następna
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 