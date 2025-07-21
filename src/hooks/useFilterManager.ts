import { useState, useMemo } from 'react';
import { Filter, FilterCriterion, FilterOption } from '@/types/FilterSettings';

interface UseFilterManagerResult<T> {
  filters: Filter[];
  addFilter: (criterion: FilterCriterion) => void;
  removeFilter: (id: string) => void;
  clearFilters: () => void;
  filteredData: T[];
  applyFilters: () => void;
}

export function useFilterManager<T>(
  data: T[],
  filterOptions: FilterOption[]
): UseFilterManagerResult<T> {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [shouldApplyFilters, setShouldApplyFilters] = useState(true);

  const addFilter = (criterion: FilterCriterion) => {
    const option = filterOptions.find(opt => opt.value === criterion.field);
    if (!option) return;

    const newFilter: Filter = {
      id: Math.random().toString(36).substr(2, 9),
      field: criterion.field,
      operator: criterion.operator,
      value: criterion.value,
      label: `${option.label} ${criterion.operator} ${criterion.value}`
    };

    setFilters(prev => [...prev, newFilter]);
    setShouldApplyFilters(true);
  };

  const removeFilter = (id: string) => {
    setFilters(prev => prev.filter(filter => filter.id !== id));
    setShouldApplyFilters(true);
  };

  const clearFilters = () => {
    setFilters([]);
    setShouldApplyFilters(true);
  };

  const applyFilters = () => {
    setShouldApplyFilters(true);
  };

  const compareValues = (itemValue: any, filterValue: any, operator: string): boolean => {
    // Handle null/undefined values
    if (itemValue === null || itemValue === undefined) {
      return false;
    }

    // Convert to strings for case-insensitive comparison
    const normalizedItemValue = String(itemValue).toLowerCase();
    const normalizedFilterValue = String(filterValue).toLowerCase();

    switch (operator) {
      case 'equals':
        return normalizedItemValue === normalizedFilterValue;
      case 'contains':
        return normalizedItemValue.includes(normalizedFilterValue);
      case 'greaterThan':
        return Number(itemValue) > Number(filterValue);
      case 'lessThan':
        return Number(itemValue) < Number(filterValue);
      case 'between':
        if (Array.isArray(filterValue) && filterValue.length === 2) {
          const value = Number(itemValue);
          return value >= filterValue[0] && value <= filterValue[1];
        }
        return true;
      default:
        return true;
    }
  };

  const filteredData = useMemo(() => {
    if (!shouldApplyFilters || filters.length === 0) {
      return data;
    }

    return data.filter(item =>
      filters.every(filter => {
        const value = item[filter.field as keyof T];
        return compareValues(value, filter.value, filter.operator);
      })
    );
  }, [data, filters, shouldApplyFilters]);

  return {
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    filteredData,
    applyFilters
  };
} 