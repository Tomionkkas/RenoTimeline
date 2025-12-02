import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Star, 
  Clock, 
  Tag, 
  Download,
  Eye,
  ChevronRight,
  Filter,
  TrendingUp,
  CheckCircle,
  Settings,
  X,
  Zap,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { 
  WORKFLOW_TEMPLATES, 
  getTemplatesByCategory, 
  getPopularTemplates, 
  searchTemplates, 
  getCategories, 
  getTemplateById,
  CATEGORY_INFO,
  validateTemplate
} from '@/lib/workflow/WorkflowTemplates';
import { useWorkflows } from '@/hooks/useWorkflows';
import { useToast } from '@/hooks/use-toast';
import type { WorkflowTemplate } from '@/lib/types/workflow';

interface WorkflowTemplatesProps {
  projectId: string;
  onTemplateInstall?: (template: WorkflowTemplate, customization?: any) => void;
  onClose?: () => void;
}

const WorkflowTemplates: React.FC<WorkflowTemplatesProps> = ({
  projectId,
  onTemplateInstall,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [showCustomization, setShowCustomization] = useState(false);
  const [customizationValues, setCustomizationValues] = useState<Record<string, any>>({});
  const [installing, setInstalling] = useState<string | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState<{
    show: boolean;
    template: WorkflowTemplate | null;
  }>({ show: false, template: null });

  const { createWorkflow, loading } = useWorkflows(projectId);
  const { toast } = useToast();

  // Filter and search templates
  const filteredTemplates = useMemo(() => {
    let templates = WORKFLOW_TEMPLATES;

    // Apply category filter
    if (selectedCategory !== 'all') {
      templates = getTemplatesByCategory(selectedCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery);
    }

    return templates;
  }, [searchQuery, selectedCategory]);

  const popularTemplates = useMemo(() => getPopularTemplates(3), []);
  const categories = useMemo(() => getCategories(), []);

  const handleTemplatePreview = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setCustomizationValues(getDefaultValues(template));
  };

  const handleTemplateInstall = async (template: WorkflowTemplate, skipCustomization = false) => {
    try {
      console.log('Starting template install for:', template.id, { skipCustomization });
      setInstalling(template.id);

      // If called from preview dialog and template has variables, show customization dialog
      if (!skipCustomization && template.variables && template.variables.length > 0 && selectedTemplate && !showCustomization) {
        console.log('Template has variables, showing customization dialog');
        setShowCustomization(true);
        setInstalling(null); // Reset installing state when showing customization
        return;
      }

      // Get the values to use (either from customization or defaults)
      const valuesToUse = Object.keys(customizationValues).length > 0 
        ? customizationValues 
        : getDefaultValues(template);
      
      console.log('Using values:', valuesToUse);

      const workflowData = applyTemplateCustomization(template, valuesToUse);
      console.log('Generated workflow data:', workflowData);
      
      // Validate the workflow data before sending
      if (!workflowData.name || !workflowData.trigger_type) {
        throw new Error('Niekompletne dane workflow - brak nazwy lub typu wyzwalacza');
      }
      
      if (!workflowData.project_id) {
        throw new Error('Brak ID projektu - wymagane do utworzenia workflow');
      }
      
      if (!Array.isArray(workflowData.actions) || workflowData.actions.length === 0) {
        throw new Error('Brak akcji w workflow - wymagana co najmniej jedna akcja');
      }
      
      console.log('Validation passed, creating workflow...');
      const result = await createWorkflow(workflowData);
      console.log('Workflow created successfully:', result);

      toast({
        title: 'Szablon zainstalowany!',
        description: `Przepływ "${template.name}" został pomyślnie utworzony.`
      });

      // Reset state
      setShowCustomization(false);
      setSelectedTemplate(null);
      setInstalling(null);
      setCustomizationValues({});

      // Call the callback if provided
      if (onTemplateInstall) {
        onTemplateInstall(template, valuesToUse);
      }

    } catch (error) {
      console.error('Template installation failed:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Nieznany błąd podczas instalacji szablonu';

      toast({
        title: 'Błąd instalacji',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setInstalling(null);
    }
  };

  const handleInstallWithCustomization = async () => {
    if (!selectedTemplate) return;
    await handleTemplateInstall(selectedTemplate, true);
  };

  const handleVariableChange = (key: string, value: any) => {
    setCustomizationValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getDefaultValues = (template: WorkflowTemplate): Record<string, any> => {
    const defaults: Record<string, any> = {};
    template.variables?.forEach(variable => {
      if (variable.default) {
        defaults[variable.key] = variable.default;
      }
    });
    return defaults;
  };

  const applyTemplateCustomization = (template: WorkflowTemplate, values: Record<string, any>) => {
    console.log('applyTemplateCustomization called with:', { template: template.id, values });
    
    // Convert user-friendly values to boolean values for the system
    const processedValues = { ...values };
    Object.entries(values).forEach(([key, value]) => {
      if (typeof value === 'string') {
        // Convert user-friendly options to system values
        if (value.startsWith('Tak')) {
          processedValues[key] = 'true';
        } else if (value.startsWith('Nie')) {
          processedValues[key] = 'false';
        }
      }
    });
    
          console.log('Processed customization values:', processedValues);
    
    // Validate required template fields
    if (!template.trigger_type) {
      throw new Error('Template nie ma zdefiniowanego typu wyzwalacza');
    }
    
    if (!template.actions || !Array.isArray(template.actions) || template.actions.length === 0) {
      throw new Error('Template nie ma zdefiniowanych akcji');
    }
    
    // Validate projectId
    if (!projectId) {
      throw new Error('Brak ID projektu - nie można utworzyć workflow');
    }
    
    // Build the workflow data with proper validation
    const workflowData = {
      project_id: projectId,
      name: template.name || `Workflow ${Date.now()}`,
      description: template.description || 'Automatycznie utworzony z szablonu',
      trigger_type: template.trigger_type,
      trigger_config: {
        ...template.trigger_config,
        // Apply any customized trigger config here if needed
      },
      conditions: {
        ...template.conditions,
        // Apply any customized conditions here if needed
      },
      actions: template.actions.map(action => ({
        ...action,
        // Apply any customizations to actions if needed
        // This is where we could apply the processedValues
      })),
      is_active: true,
      created_by: 'template-user' // This will be overridden by the hook with real user ID
    };

    console.log('Generated workflow data:', workflowData);
    
    // Final validation
    if (!workflowData.project_id || !workflowData.name || !workflowData.trigger_type) {
      throw new Error('Wygenerowane dane workflow są niekompletne');
    }
    
    return workflowData;
  };

  const getTimeSavingColor = (timeSaved: string) => {
    if (timeSaved.includes('hour') || timeSaved.includes('day')) return 'text-green-400';
    if (timeSaved.includes('45') || timeSaved.includes('30')) return 'text-blue-400';
    return 'text-gray-400';
  };

  const TemplateCard: React.FC<{ template: WorkflowTemplate; showStats?: boolean }> = ({ 
    template, 
    showStats = true 
  }) => (
    <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-600 shadow-xl hover:border-gray-500 transition-all duration-300 transform hover:scale-105 cursor-pointer">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-3 bg-blue-800/30 rounded-lg border border-blue-600/30">
                              <span className="text-2xl">{template.icon || ''}</span>
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl text-white">{template.name}</CardTitle>
              <CardDescription className="mt-2 text-gray-300">
                {template.description}
              </CardDescription>
            </div>
          </div>
          {showStats && template.popularity && (
            <Badge className="ml-3 bg-gradient-to-r from-yellow-600 to-orange-500 text-white border-0">
              <Star className="w-3 h-3 mr-1" />
              {template.popularity}%
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Template Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30">
            <div className="flex items-center space-x-2 mb-1">
              <Tag className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-semibold">Kategoria</span>
            </div>
            <p className="text-white text-sm">
              {CATEGORY_INFO[template.category as keyof typeof CATEGORY_INFO]?.name || template.category}
            </p>
          </div>
          
          <div className="p-3 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg border border-green-500/30">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm font-semibold">Oszczędność</span>
            </div>
            <p className={`text-sm font-medium ${getTimeSavingColor(template.estimated_time_saved || '')}`}>
              {template.estimated_time_saved || 'Nieznana'}
            </p>
          </div>
        </div>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {template.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="border-gray-600 text-gray-300 text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              handleTemplatePreview(template);
            }}
            variant="outline"
            className="border-gray-600 text-blue-400 hover:bg-blue-900/20 hover:border-blue-500/30 transition-all duration-200"
          >
            <Eye className="w-4 h-4 mr-2" />
            Podgląd
          </Button>
          <Button 
            size="sm" 
            onClick={async (e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log('Direct install button clicked for template:', template.id);
              
              // If template has variables, show custom dialog
              if (template.variables && template.variables.length > 0) {
                setShowInstallDialog({ show: true, template });
              } else {
                // No variables, install directly
                await handleTemplateInstall(template, true);
              }
            }}
            disabled={installing === template.id || loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 transition-all duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            {installing === template.id ? 'Instalowanie...' : 'Zainstaluj'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const CustomizationDialog: React.FC = () => {
    if (!selectedTemplate || !showCustomization) return null;

    return (
      <Dialog open={showCustomization} onOpenChange={setShowCustomization}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-white">Dostosuj szablon: {selectedTemplate.name}</DialogTitle>
            <DialogDescription className="text-gray-300">
              Skonfiguruj parametry przepływu przed instalacją
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedTemplate.variables?.map(variable => (
              <div key={variable.key} className="space-y-2">
                <Label htmlFor={variable.key} className="text-gray-200">
                  {variable.label}
                  {variable.required && <span className="text-red-400 ml-1">*</span>}
                </Label>

                {variable.type === 'select' ? (
                  <Select
                    value={customizationValues[variable.key] || variable.default || ''}
                    onValueChange={(value) => handleVariableChange(variable.key, value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Wybierz opcję..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {variable.options?.map(option => (
                        <SelectItem key={option} value={option} className="text-white hover:bg-gray-700">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={variable.key}
                    value={customizationValues[variable.key] || variable.default || ''}
                    onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                    placeholder={variable.default}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowCustomization(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Anuluj
            </Button>
            <Button 
              onClick={handleInstallWithCustomization}
              disabled={installing === selectedTemplate.id}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
            >
              {installing === selectedTemplate.id ? 'Instalowanie...' : 'Zainstaluj z customizacją'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const TemplatePreviewDialog: React.FC = () => {
    if (!selectedTemplate) return null;

    return (
      <Dialog open={!!selectedTemplate && !showCustomization} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-600">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="p-2 bg-blue-800/30 rounded-lg border border-blue-600/30">
                <span className="text-2xl">{selectedTemplate.icon || ''}</span>
              </div>
              {selectedTemplate.name}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {selectedTemplate.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Template Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30">
                <h4 className="font-medium text-purple-200 mb-2">Kategoria</h4>
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
                  {CATEGORY_INFO[selectedTemplate.category as keyof typeof CATEGORY_INFO]?.icon} {CATEGORY_INFO[selectedTemplate.category as keyof typeof CATEGORY_INFO]?.name}
                </Badge>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-lg border border-green-500/30">
                <h4 className="font-medium text-green-200 mb-2">Oszczędność czasu</h4>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className={`font-medium ${getTimeSavingColor(selectedTemplate.estimated_time_saved || '')}`}>
                    {selectedTemplate.estimated_time_saved}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-gray-900/20 to-gray-800/20 rounded-lg border border-gray-600/30">
                <h4 className="font-medium text-gray-200 mb-3">Tagi</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="border-gray-600 text-gray-300">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Preview */}
            <div className="p-4 bg-gradient-to-r from-blue-900/20 to-green-900/20 rounded-lg border border-blue-500/30">
              <h4 className="font-medium text-blue-200 mb-3">Akcje w przepływie</h4>
              <div className="space-y-2">
                {selectedTemplate.actions.map((action, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-gray-300 font-medium">
                      {action.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setSelectedTemplate(null)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Zamknij
            </Button>
            <Button 
              onClick={() => handleTemplateInstall(selectedTemplate)}
              disabled={installing === selectedTemplate.id}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
            >
              {installing === selectedTemplate.id ? 'Instalowanie...' : 'Zainstaluj szablon'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const InstallConfirmationDialog: React.FC = () => {
    if (!showInstallDialog.show || !showInstallDialog.template) return null;

    const template = showInstallDialog.template;

    const handleInstallWithDefaults = async () => {
      console.log('User chose to install with defaults');
      setShowInstallDialog({ show: false, template: null });
      await handleTemplateInstall(template, true);
    };

    const handleCustomize = () => {
      console.log('User chose to customize, showing preview first');
      setShowInstallDialog({ show: false, template: null });
      handleTemplatePreview(template);
    };

    const handleCancel = () => {
      setShowInstallDialog({ show: false, template: null });
    };

    return (
      <Dialog open={showInstallDialog.show} onOpenChange={handleCancel}>
        <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-600">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-800/30 rounded-full flex items-center justify-center border border-blue-600/30">
              <Settings className="w-6 h-6 text-blue-400" />
            </div>
            <DialogTitle className="text-xl font-semibold text-white">
              Opcje instalacji szablonu
            </DialogTitle>
            <DialogDescription className="text-base text-gray-300 mt-2">
              Ten szablon ma <strong>{template.variables?.length || 0} parametrów</strong> do dostosowania
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Template info */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{template.icon || ''}</div>
                <div>
                  <h4 className="font-medium text-white">{template.name}</h4>
                  <p className="text-sm text-gray-300">{template.description}</p>
                </div>
              </div>
            </div>

            {/* Available customizations */}
            {template.variables && template.variables.length > 0 && (
              <div className="bg-blue-900/10 rounded-lg p-4 border border-blue-500/30">
                <h4 className="font-medium text-blue-200 mb-2">Dostępne opcje konfiguracji:</h4>
                <ul className="space-y-1">
                  {template.variables.map(variable => (
                    <li key={variable.key} className="text-sm text-gray-300 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      {variable.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Anuluj
            </Button>
            <Button 
              onClick={handleInstallWithDefaults}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-0"
            >
              Użyj domyślnych
            </Button>
            <Button 
              onClick={handleCustomize}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
            >
              Dostosuj
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Enhanced Header */}
      <div className="text-center animate-slideUp">
        <div className="p-6 bg-blue-800/30 rounded-full mb-6 mx-auto w-fit">
          <BookOpen className="h-16 w-16 text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          📚 Szablony Przepływów
        </h2>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          Zainstaluj gotowe automatyzacje jednym kliknięciem
        </p>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Szukaj szablonów..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px] bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Kategoria" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="all" className="text-white hover:bg-gray-700">Wszystkie kategorie</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category} className="text-white hover:bg-gray-700">
                  {CATEGORY_INFO[category as keyof typeof CATEGORY_INFO]?.name || category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Enhanced Templates Grid */}
      <div className="space-y-8">
        <h3 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-400" />
          Wszystkie szablony ({filteredTemplates.length})
        </h3>
        
        {filteredTemplates.length === 0 ? (
          <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-600 shadow-xl animate-slideUp">
            <CardContent className="py-16 text-center">
              <div className="p-6 bg-orange-800/30 rounded-full mb-6 mx-auto w-fit">
                <Search className="w-16 h-16 text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">🔍 Brak wyników</h3>
              <p className="text-gray-300 text-lg">
                Nie znaleziono szablonów spełniających kryteria wyszukiwania
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template, index) => (
              <div key={template.id} className="animate-slideUp" style={{ animationDelay: `${index * 100}ms` }}>
                <TemplateCard template={template} showStats={false} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <TemplatePreviewDialog />
      <CustomizationDialog />
      <InstallConfirmationDialog />
    </div>
  );
};

export default WorkflowTemplates; 