import React from 'react';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { CustomFieldDefinition } from '@/hooks/useCustomFieldDefinitions';

interface CustomFieldRendererProps {
  definition: CustomFieldDefinition;
  control: Control<any>;
  errors?: FieldErrors;
  disabled?: boolean;
  className?: string;
}

export const CustomFieldRenderer: React.FC<CustomFieldRendererProps> = ({
  definition,
  control,
  errors,
  disabled = false,
  className
}) => {
  const fieldError = errors?.[definition.id];
  const isRequired = definition.is_required || false;

  const renderFieldByType = (field: any) => {
    switch (definition.field_type) {
      case 'text':
        return (
          <Input
            {...field}
            placeholder={definition.default_value || `Enter ${definition.name.toLowerCase()}`}
            disabled={disabled}
            className={cn(fieldError && "border-red-500")}
          />
        );

      case 'textarea':
        return (
          <Textarea
            {...field}
            placeholder={definition.default_value || `Enter ${definition.name.toLowerCase()}`}
            disabled={disabled}
            className={cn(fieldError && "border-red-500")}
            rows={4}
          />
        );

      case 'number':
        return (
          <Input
            {...field}
            type="number"
            placeholder={definition.default_value || "0"}
            disabled={disabled}
            className={cn(fieldError && "border-red-500")}
            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : '')}
          />
        );

      case 'email':
        return (
          <Input
            {...field}
            type="email"
            placeholder={definition.default_value || "email@example.com"}
            disabled={disabled}
            className={cn(fieldError && "border-red-500")}
          />
        );

      case 'url':
        return (
          <Input
            {...field}
            type="url"
            placeholder={definition.default_value || "https://example.com"}
            disabled={disabled}
            className={cn(fieldError && "border-red-500")}
          />
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !field.value && "text-muted-foreground",
                  fieldError && "border-red-500"
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'datetime':
        return (
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !field.value && "text-muted-foreground",
                    fieldError && "border-red-500"
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(new Date(field.value), "PPP p") : <span>Pick date & time</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const currentTime = field.value ? new Date(field.value) : new Date();
                      date.setHours(currentTime.getHours());
                      date.setMinutes(currentTime.getMinutes());
                      field.onChange(date.toISOString());
                    }
                  }}
                  initialFocus
                />
                <div className="p-3 border-t">
                  <Input
                    type="time"
                    value={field.value ? format(new Date(field.value), "HH:mm") : ""}
                    onChange={(e) => {
                      if (field.value && e.target.value) {
                        const date = new Date(field.value);
                        const [hours, minutes] = e.target.value.split(':');
                        date.setHours(parseInt(hours));
                        date.setMinutes(parseInt(minutes));
                        field.onChange(date.toISOString());
                      }
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={definition.id}
              checked={!!field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
            <Label htmlFor={definition.id} className="text-sm font-normal">
              {definition.default_value || `Enable ${definition.name.toLowerCase()}`}
            </Label>
          </div>
        );

      case 'select':
        const selectOptions = Array.isArray(definition.options) ? definition.options : [];
        return (
          <Select
            value={field.value || ''}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger className={cn(fieldError && "border-red-500")}>
              <SelectValue placeholder={`Select ${definition.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multi_select':
        const multiSelectOptions = Array.isArray(definition.options) ? definition.options : [];
        const selectedValues = Array.isArray(field.value) ? field.value : [];
        
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1 min-h-[2rem] p-2 border rounded-md">
              {selectedValues.map((value: string) => (
                <span
                  key={value}
                  className="bg-primary/10 text-primary px-2 py-1 rounded-sm text-sm flex items-center gap-1"
                >
                  {value}
                  <button
                    type="button"
                    onClick={() => {
                      const newValues = selectedValues.filter((v: string) => v !== value);
                      field.onChange(newValues);
                    }}
                    disabled={disabled}
                    className="hover:bg-primary/20 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {selectedValues.length === 0 && (
                <span className="text-muted-foreground text-sm">
                  Select {definition.name.toLowerCase()}
                </span>
              )}
            </div>
            <Select
              value=""
              onValueChange={(value) => {
                if (!selectedValues.includes(value)) {
                  field.onChange([...selectedValues, value]);
                }
              }}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add option..." />
              </SelectTrigger>
              <SelectContent>
                {multiSelectOptions
                  .filter((option: string) => !selectedValues.includes(option))
                  .map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return (
          <Input
            {...field}
            placeholder={definition.default_value || `Enter ${definition.name.toLowerCase()}`}
            disabled={disabled}
            className={cn(fieldError && "border-red-500")}
          />
        );
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={definition.id} className="text-sm font-medium">
        {definition.name}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Controller
        name={definition.id}
        control={control}
        defaultValue={definition.default_value || ''}
        rules={{
          required: isRequired ? `${definition.name} is required` : false,
        }}
        render={({ field }) => renderFieldByType(field)}
      />
      
      {fieldError && (
        <p className="text-sm text-red-500">
          {(fieldError as any)?.message || `${definition.name} is invalid`}
        </p>
      )}
    </div>
  );
}; 