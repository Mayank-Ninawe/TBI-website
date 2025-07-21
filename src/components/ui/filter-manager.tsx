import { useState } from 'react';
import { Filter, FilterCriterion, FilterOption, FilterOperator } from '@/types/FilterSettings';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Input } from './input';
import { Badge } from './badge';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface FilterManagerProps {
  filterOptions: FilterOption[];
  onAddFilter: (criterion: FilterCriterion) => void;
  onRemoveFilter: (id: string) => void;
  onApplyFilters: () => void;
  filters: Filter[];
  className?: string;
}

export function FilterManager({
  filterOptions,
  onAddFilter,
  onRemoveFilter,
  onApplyFilters,
  filters,
  className = ''
}: FilterManagerProps) {
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator>('equals');
  const [filterValue, setFilterValue] = useState<string>('');

  const selectedOption = filterOptions.find(opt => opt.value === selectedField);

  const handleAddFilter = () => {
    if (!selectedField || !filterValue) return;

    let processedValue = filterValue;
    
    // Convert value based on the field type
    if (selectedOption?.type === 'number') {
      processedValue = Number(filterValue);
    } else if (selectedOption?.type === 'date') {
      processedValue = new Date(filterValue).toISOString();
    }

    onAddFilter({
      field: selectedField,
      operator: selectedOperator,
      value: processedValue
    });

    // Reset form
    setSelectedField('');
    setSelectedOperator('equals');
    setFilterValue('');
  };

  const getOperatorOptions = () => {
    if (!selectedOption) return [];

    switch (selectedOption.type) {
      case 'number':
      case 'date':
        return [
          { label: 'Equals', value: 'equals' },
          { label: 'Greater Than', value: 'greaterThan' },
          { label: 'Less Than', value: 'lessThan' }
        ];
      case 'text':
        return [
          { label: 'Equals', value: 'equals' },
          { label: 'Contains', value: 'contains' }
        ];
      case 'select':
        return [{ label: 'Equals', value: 'equals' }];
      default:
        return [{ label: 'Equals', value: 'equals' }];
    }
  };

  const formatFilterLabel = (filter: Filter): string => {
    const option = filterOptions.find(opt => opt.value === filter.field);
    if (!option) return filter.label;

    let displayValue = filter.value;
    
    if (option.type === 'date' && filter.value) {
      displayValue = format(new Date(filter.value), 'PP');
    } else if (option.type === 'select' && option.options) {
      const selectedOption = option.options.find(opt => opt.value === filter.value);
      displayValue = selectedOption?.label || filter.value;
    }

    return `${option.label} ${filter.operator} ${displayValue}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Active Filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map(filter => (
            <Badge
              key={filter.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {formatFilterLabel(filter)}
              <button
                onClick={() => onRemoveFilter(filter.id)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 items-end">
        <div className="min-w-[200px]">
          <Select onValueChange={setSelectedField} value={selectedField}>
            <SelectTrigger>
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[150px]">
          <Select onValueChange={(value) => setSelectedOperator(value as FilterOperator)} value={selectedOperator}>
            <SelectTrigger disabled={!selectedField}>
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              {getOperatorOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[200px]">
          {selectedOption?.type === 'select' ? (
            <Select onValueChange={setFilterValue} value={filterValue}>
              <SelectTrigger disabled={!selectedField}>
                <SelectValue placeholder="Select value" />
              </SelectTrigger>
              <SelectContent>
                {selectedOption.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={selectedOption?.type === 'date' ? 'date' : selectedOption?.type || 'text'}
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              placeholder={`Enter ${selectedOption?.type || 'value'}`}
              disabled={!selectedField}
            />
          )}
        </div>

        <Button
          onClick={handleAddFilter}
          disabled={!selectedField || !filterValue}
          variant="outline"
          className="w-full sm:w-auto"
        >
          Add Filter
        </Button>

        <Button
          onClick={onApplyFilters}
          disabled={filters.length === 0}
          variant="default"
          className="w-full sm:w-auto"
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
} 