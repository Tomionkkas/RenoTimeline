import React from 'react';
import { Plus, Trash2, Settings, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import type { WorkflowAction } from '../../lib/types/workflow';

interface ActionBuilderProps {
  actions: WorkflowAction[];
  onActionsChange: (actions: WorkflowAction[]) => void;
}

export function ActionBuilder({ actions, onActionsChange }: ActionBuilderProps) {
  const addAction = () => {
    const newAction = {
      type: 'update_task' as const,
      config: { status: 'done' }
    } as WorkflowAction;
    onActionsChange([...actions, newAction]);
  };

  const removeAction = (index: number) => {
    onActionsChange(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, updates: Partial<WorkflowAction>) => {
    const updatedActions = actions.map((action, i) => 
      i === index ? { ...action, ...updates } : action
    );
    onActionsChange(updatedActions);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Define what happens when this workflow triggers</CardDescription>
            </div>
            <Button onClick={addAction}>
              <Plus className="h-4 w-4 mr-2" />
              Add Action
            </Button>
          </div>
        </CardHeader>
      </Card>

      {actions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No actions configured</h3>
            <p className="text-gray-600 mb-4">Add actions to define what happens when this workflow triggers.</p>
            <Button onClick={addAction}>Add Your First Action</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {actions.map((action, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Action {index + 1}</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => removeAction(index)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Action Type</Label>
                  <Select
                    value={action.type}
                    onValueChange={(value) => updateAction(index, { type: value as any, config: {} })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="update_task">Update Task</SelectItem>
                      <SelectItem value="create_task">Create Task</SelectItem>
                      <SelectItem value="send_notification">Send Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {action.type === 'update_task' && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={(action.config as any).status || ''}
                      onValueChange={(value) => updateAction(index, {
                        config: { ...action.config, status: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {action.type === 'create_task' && (
                  <div className="space-y-2">
                    <Label>Task Title</Label>
                    <Input
                      value={(action.config as any).title || ''}
                      onChange={(e) => updateAction(index, {
                        config: { ...action.config, title: e.target.value }
                      })}
                      placeholder="Enter task title"
                    />
                  </div>
                )}

                {action.type === 'send_notification' && (
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Input
                      value={(action.config as any).message || ''}
                      onChange={(e) => updateAction(index, {
                        config: { ...action.config, message: e.target.value }
                      })}
                      placeholder="Notification message"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 