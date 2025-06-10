import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useCustomFieldDefinitions } from '@/hooks/useCustomFieldDefinitions';
import { useTaskCustomFields } from '@/hooks/useTaskCustomFields';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TaskCustomFieldManagerProps {
  taskId: string;
  projectId: string;
  className?: string;
}

export const TaskCustomFieldManager: React.FC<TaskCustomFieldManagerProps> = ({
  taskId,
  projectId,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { definitions, loading } = useCustomFieldDefinitions(projectId, 'task');
  const { enabledFields, toggleField, isFieldEnabled } = useTaskCustomFields(taskId);

  if (loading) {
    return (
      <Card className={`${className} bg-card border-gray-700`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4 text-blue-400 animate-pulse" />
            <span className="text-white">Ładowanie pól...</span>
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (definitions.length === 0) {
    return (
      <Card className={`${className} bg-card border-gray-700`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4 text-gray-500" />
            <span className="text-gray-400">Brak dostępnych pól niestandardowych</span>
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const enabledCount = enabledFields.length;
  const totalCount = definitions.length;

  return (
    <Card className={`${className} bg-card border-gray-700 shadow-lg hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 ease-in-out`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 ease-in-out">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-400" />
                <span className="text-white font-medium">Dostępne pola niestandardowe</span>
                <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {enabledCount}/{totalCount}
                </Badge>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="text-xs text-gray-400 mb-3">
                Wybierz które pola chcesz używać w tym zadaniu:
              </div>
              
              {definitions.map(definition => {
                const isEnabled = isFieldEnabled(definition.id);
                return (
                  <div key={definition.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-sidebar-accent/50 hover:border-blue-500/30 border border-gray-700 transition-all duration-300 ease-in-out">
                    <Checkbox
                      id={`field-${definition.id}`}
                      checked={isEnabled}
                      onCheckedChange={(checked) => toggleField(definition.id, !!checked)}
                      className="mt-0.5 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <Label 
                        htmlFor={`field-${definition.id}`} 
                        className="font-medium cursor-pointer text-sm leading-tight text-white hover:text-blue-400 transition-colors duration-200"
                      >
                        {definition.name}
                        {definition.is_required && (
                          <span className="text-red-400 ml-1">*</span>
                        )}
                      </Label>

                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs bg-gray-700/50 text-gray-300 border-gray-600 hover:border-blue-500/50 transition-colors">
                          {definition.field_type}
                        </Badge>
                        {definition.is_required && (
                          <Badge variant="destructive" className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
                            wymagane
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {enabledCount === 0 && (
                <div className="text-center text-sm text-gray-400 py-6 border border-dashed border-gray-600 rounded-lg bg-gray-800/20">
                  <Settings className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                  Nie wybrano żadnych pól niestandardowych
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300"
                  onClick={() => {
                    definitions.forEach(def => toggleField(def.id, true));
                  }}
                >
                  Zaznacz wszystkie
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50 hover:border-gray-500 transition-all duration-300"
                  onClick={() => {
                    definitions.forEach(def => toggleField(def.id, false));
                  }}
                >
                  Odznacz wszystkie
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}; 