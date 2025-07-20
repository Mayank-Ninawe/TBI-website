export type StatusFilter = 'all' | 'accepted' | 'rejected';
export type LegalStatus = 'all' | 'registered' | 'unregistered' | 'private_limited' | 'public_limited' | 'partnership' | 'proprietorship';
export type DevelopmentStage = 'all' | 'idea' | 'prototype' | 'market';

export interface CustomFilter {
  id: string;
  label: string;
  type: 'text' | 'dropdown';
  value: string;
  options?: string[];
}

export interface EvaluationFilterSettings {
  status: StatusFilter;
  legalStatus: LegalStatus;
  developmentStage: DevelopmentStage;
  customFilters: CustomFilter[];
}

export type FilterOperator = 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between';

export type FilterValue = string | number | Date | boolean | Array<number | string | Date>;

export interface Filter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: FilterValue;
  label: string;
}

export interface FilterCriterion {
  field: string;
  operator: FilterOperator;
  value: FilterValue;
}

export interface FilterOption {
  label: string;
  value: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: { label: string; value: FilterValue }[];
} 