import React, { useState, useMemo, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useCustomFieldDefinitions, type CustomFieldDefinition, type FieldType, type CreateFieldDefinitionData } from '@/hooks/useCustomFieldDefinitions';
import { useCustomFieldValidation } from '@/hooks/useCustomFieldValidation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash, GripVertical, Search, Copy } from 'lucide-react';
import { toast } from 'sonner';

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Tekst', description: 'Krótkie pole tekstowe' },
  { value: 'textarea', label: 'Tekst wieloliniowy', description: 'Długie pole tekstowe' },
  { value: 'number', label: 'Liczba', description: 'Wartości numeryczne' },
  { value: 'email', label: 'Email', description: 'Adresy email z walidacją' },
  { value: 'url', label: 'URL', description: 'Linki internetowe' },
  { value: 'date', label: 'Data', description: 'Wybór daty' },
  { value: 'datetime', label: 'Data i czas', description: 'Wybór daty i czasu' },
  { value: 'boolean', label: 'Tak/Nie', description: 'Wartość logiczna' },
  { value: 'select', label: 'Lista wyboru', description: 'Jedna opcja z listy' },
  { value: 'multi_select', label: 'Wielokrotny wybór', description: 'Wiele opcji z listy' }
];

interface DraggableFieldItemProps {
  field: CustomFieldDefinition;
  index: number;
  onEdit: (field: CustomFieldDefinition) => void;
  onDelete: (field: CustomFieldDefinition) => void;
  onDuplicate: (field: CustomFieldDefinition) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

const DraggableFieldItem: React.FC<DraggableFieldItemProps> = ({ 
  field, 
  index, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onMove 
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'field',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'field',
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        onMove(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  const fieldType = FIELD_TYPE_OPTIONS.find(opt => opt.value === field.field_type);

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`bg-white border rounded-lg p-4 mb-3 cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <GripVertical className="h-4 w-4 text-gray-400" />
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-medium">{field.name}</h4>
              {field.is_required && (
                <Badge variant="destructive" className="text-xs">
                  Wymagane
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {fieldType?.label}
              </Badge>
            </div>
            {(field.field_type === 'select' || field.field_type === 'multi_select') && 
             Array.isArray(field.options) && field.options.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(field.options as string[]).slice(0, 3).map((option, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {option}
                  </Badge>
                ))}
                {(field.options as string[]).length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{(field.options as string[]).length - 3} więcej
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(field)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDuplicate(field)}>
            <Copy className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Trash className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Usuń pole</AlertDialogTitle>
                <AlertDialogDescription>
                  Czy na pewno chcesz usunąć pole "{field.name}"? Wszystkie dane w tym polu zostaną utracone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(field)}>Usuń</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

interface FieldFormProps {
  field?: CustomFieldDefinition;
  entityType: 'task' | 'project';
  projectId: string;
  onSave: (field: CreateFieldDefinitionData) => void;
  onCancel: () => void;
}

const FieldForm: React.FC<FieldFormProps> = ({ field, entityType, projectId, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: field?.name || '',
    field_type: (field?.field_type || 'text') as FieldType,
    is_required: field?.is_required || false,
    options: field?.options ? (Array.isArray(field.options) ? (field.options as string[]).join('\n') : '') : '',
    default_value: field?.default_value || ''
  });

  const [errors, setErrors] = useState<string[]>([]);

  const handleSave = useCallback(() => {
    const validationErrors: string[] = [];

    if (!formData.name.trim()) {
      validationErrors.push('Nazwa pola jest wymagana');
    }

    if (formData.name.length > 100) {
      validationErrors.push('Nazwa pola może mieć maksymalnie 100 znaków');
    }

    if ((formData.field_type === 'select' || formData.field_type === 'multi_select') && !formData.options.trim()) {
      validationErrors.push('Opcje są wymagane dla pól wyboru');
    }

    if (formData.options) {
      const optionLines = formData.options.split('\n').filter(line => line.trim());
      if (optionLines.length > 50) {
        validationErrors.push('Maksymalnie 50 opcji jest dozwolonych');
      }
    }

    setErrors(validationErrors);

    if (validationErrors.length === 0) {
      const processedOptions = formData.options 
        ? formData.options.split('\n').filter(line => line.trim()).map(line => line.trim())
        : [];

      onSave({
        name: formData.name.trim(),
        field_type: formData.field_type,
        is_required: formData.is_required,
        options: (formData.field_type === 'select' || formData.field_type === 'multi_select') 
          ? processedOptions 
          : null,
        default_value: formData.default_value || null,
        entity_type: entityType,
        project_id: projectId
      });
    }
  }, [formData, entityType, projectId, onSave]);

  const needsOptions = formData.field_type === 'select' || formData.field_type === 'multi_select';
  const selectedFieldType = FIELD_TYPE_OPTIONS.find(opt => opt.value === formData.field_type);

  return (
    <div className="space-y-4">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <ul className="text-sm text-red-600 space-y-1">
            {errors.map((error, idx) => (
              <li key={idx}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="field-name">Nazwa pola *</Label>
        <Input
          id="field-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Np. Kontakt z klientem"
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="field-type">Typ pola *</Label>
        <Select value={formData.field_type} onValueChange={(value) => setFormData(prev => ({ ...prev, field_type: value as FieldType }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedFieldType && (
          <p className="text-sm text-gray-600">{selectedFieldType.description}</p>
        )}
      </div>

      {needsOptions && (
        <div className="space-y-2">
          <Label htmlFor="field-options">Opcje *</Label>
          <Textarea
            id="field-options"
            value={formData.options}
            onChange={(e) => setFormData(prev => ({ ...prev, options: e.target.value }))}
            placeholder="Jedna opcja na linię&#10;Opcja 1&#10;Opcja 2&#10;Opcja 3"
            rows={6}
          />
          <p className="text-xs text-gray-500">
            Każda opcja w nowej linii. Maksymalnie 50 opcji.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="default-value">Wartość domyślna</Label>
        <Input
          id="default-value"
          value={formData.default_value}
          onChange={(e) => setFormData(prev => ({ ...prev, default_value: e.target.value }))}
          placeholder="Opcjonalna wartość domyślna"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-required"
          checked={formData.is_required}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: !!checked }))}
        />
        <Label htmlFor="is-required">To pole jest wymagane</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Anuluj
        </Button>
        <Button onClick={handleSave}>
          {field ? 'Zapisz zmiany' : 'Utwórz pole'}
        </Button>
      </div>
    </div>
  );
};

interface Props {
  entityType: 'task' | 'project';
  projectId: string;
}

export const CustomFieldDefinitionManager: React.FC<Props> = ({ entityType, projectId }) => {
  const { 
    definitions, 
    loading, 
    createDefinition, 
    updateDefinition, 
    deleteDefinition
  } = useCustomFieldDefinitions(projectId, entityType);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showOnlyRequired, setShowOnlyRequired] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [bulkSelectedFields, setBulkSelectedFields] = useState<Set<string>>(new Set());

  // Performance optimized filtering
  const filteredDefinitions = useMemo(() => {
    return definitions.filter(field => {
      const matchesSearch = field.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || field.field_type === filterType;
      const matchesRequired = !showOnlyRequired || field.is_required;

      return matchesSearch && matchesType && matchesRequired;
    });
  }, [definitions, searchTerm, filterType, showOnlyRequired]);

  const handleMoveField = useCallback(async (dragIndex: number, hoverIndex: number) => {
    // Simple reordering - in a full implementation, you'd call reorderDefinitions
    const draggedField = filteredDefinitions[dragIndex];
    const hoveredField = filteredDefinitions[hoverIndex];
    
    if (!draggedField || !hoveredField) return;

    // For now, just show a toast
    toast.success('Drag and drop reordering coming soon!');
  }, [filteredDefinitions]);

  const handleCreateField = useCallback(async (fieldData: CreateFieldDefinitionData) => {
    try {
      await createDefinition(fieldData);
      setIsCreateDialogOpen(false);
      toast.success('Pole zostało utworzone');
    } catch (error) {
      console.error('Error creating field:', error);
      toast.error('Błąd podczas tworzenia pola');
    }
  }, [createDefinition]);

  const handleUpdateField = useCallback(async (fieldData: CreateFieldDefinitionData) => {
    if (!editingField) return;
    
    try {
      await updateDefinition(editingField.id, fieldData);
      setEditingField(null);
      toast.success('Pole zostało zaktualizowane');
    } catch (error) {
      console.error('Error updating field:', error);
      toast.error('Błąd podczas aktualizacji pola');
    }
  }, [editingField, updateDefinition]);

  const handleDeleteField = useCallback(async (field: CustomFieldDefinition) => {
    try {
      await deleteDefinition(field.id);
      toast.success('Pole zostało usunięte');
    } catch (error) {
      console.error('Error deleting field:', error);
      toast.error('Błąd podczas usuwania pola');
    }
  }, [deleteDefinition]);

  const handleDuplicateField = useCallback(async (field: CustomFieldDefinition) => {
    try {
      const duplicatedField: CreateFieldDefinitionData = {
        name: `${field.name} (kopia)`,
        field_type: field.field_type,
        is_required: field.is_required,
        options: field.options,
        default_value: field.default_value,
        entity_type: field.entity_type,
        project_id: field.project_id
      };
      
      await createDefinition(duplicatedField);
      toast.success('Pole zostało zduplikowane');
    } catch (error) {
      console.error('Error duplicating field:', error);
      toast.error('Błąd podczas duplikowania pola');
    }
  }, [createDefinition]);

  const handleBulkDelete = useCallback(async () => {
    if (bulkSelectedFields.size === 0) return;

    try {
      await Promise.all(
        Array.from(bulkSelectedFields).map(fieldId => deleteDefinition(fieldId))
      );
      setBulkSelectedFields(new Set());
      toast.success(`Usunięto ${bulkSelectedFields.size} pól`);
    } catch (error) {
      console.error('Error bulk deleting fields:', error);
      toast.error('Błąd podczas usuwania pól');
    }
  }, [bulkSelectedFields, deleteDefinition]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ładowanie...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Pola niestandardowe - {entityType === 'task' ? 'Zadania' : 'Projekty'}
              </CardTitle>
              <CardDescription>
                Zarządzaj polami niestandardowymi dla {entityType === 'task' ? 'zadań' : 'projektów'}
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Dodaj pole
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nowe pole niestandardowe</DialogTitle>
                  <DialogDescription>
                    Utwórz nowe pole niestandardowe dla {entityType === 'task' ? 'zadań' : 'projektów'}
                  </DialogDescription>
                </DialogHeader>
                <FieldForm
                  entityType={entityType}
                  projectId={projectId}
                  onSave={handleCreateField}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Szukaj pól..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtruj typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie typy</SelectItem>
                {FIELD_TYPE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={showOnlyRequired} 
                onCheckedChange={setShowOnlyRequired}
                id="show-required"
              />
              <Label htmlFor="show-required" className="text-sm">
                Tylko wymagane
              </Label>
            </div>
          </div>

          {/* Bulk Actions */}
          {bulkSelectedFields.size > 0 && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
              <span className="text-sm text-blue-800">
                Zaznaczono {bulkSelectedFields.size} pól
              </span>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setBulkSelectedFields(new Set())}
                >
                  Odznacz wszystkie
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Usuń zaznaczone
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Usuń zaznaczone pola</AlertDialogTitle>
                      <AlertDialogDescription>
                        Czy na pewno chcesz usunąć {bulkSelectedFields.size} zaznaczonych pól? 
                        Wszystkie dane w tych polach zostaną utracone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Anuluj</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete}>
                        Usuń wszystkie
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {filteredDefinitions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                {definitions.length === 0 
                  ? `Nie ma jeszcze żadnych pól dla ${entityType === 'task' ? 'zadań' : 'projektów'}`
                  : 'Nie znaleziono pól pasujących do filtrów'
                }
              </div>
              {definitions.length === 0 && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Utwórz pierwsze pole
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDefinitions.map((field, index) => (
                <div key={field.id} className="relative">
                  <div className="absolute left-2 top-4 z-10">
                    <Checkbox
                      checked={bulkSelectedFields.has(field.id)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(bulkSelectedFields);
                        if (checked) {
                          newSelected.add(field.id);
                        } else {
                          newSelected.delete(field.id);
                        }
                        setBulkSelectedFields(newSelected);
                      }}
                    />
                  </div>
                  <div className="ml-8">
                    <DraggableFieldItem
                      field={field}
                      index={index}
                      onEdit={setEditingField}
                      onDelete={handleDeleteField}
                      onDuplicate={handleDuplicateField}
                      onMove={handleMoveField}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit Dialog */}
          <Dialog open={!!editingField} onOpenChange={(open) => !open && setEditingField(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edytuj pole</DialogTitle>
                <DialogDescription>
                  Modyfikuj właściwości pola niestandardowego
                </DialogDescription>
              </DialogHeader>
              {editingField && (
                <FieldForm
                  field={editingField}
                  entityType={entityType}
                  projectId={projectId}
                  onSave={handleUpdateField}
                  onCancel={() => setEditingField(null)}
                />
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </DndProvider>
  );
}; 