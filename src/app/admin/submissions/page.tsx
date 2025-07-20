"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, Timestamp, doc, getDoc, where } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FilterManager } from '@/components/ui/filter-manager';
import { OnCampusSubmissionCard } from './components/OnCampusSubmissionCard';
import { SubmissionDetailModal } from './components/SubmissionDetailModal';
import { Submission } from '@/types/Submission';
import { motion } from 'framer-motion';
import { Settings2, Landmark, Building, RefreshCw, Loader2, AlertCircle, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { FilterOption } from '@/types/FilterSettings';
import { Filter as FilterType, FilterCriterion } from '@/types/FilterSettings';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showFilterManager, setShowFilterManager] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const router = useRouter();

  // Check admin authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const credsDocRef = doc(db, 'admin_config/main_credentials');
        await getDoc(credsDocRef);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication error:', error);
        setIsAuthenticated(false);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  // Fetch submissions with user data
  const fetchSubmissions = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const submissionsCollection = collection(db, "contactSubmissions");
      const q = query(submissionsCollection, orderBy("submittedAt", "desc"));
      const snapshot = await getDocs(q);
      const fetchedSubmissions: Submission[] = [];
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        // Ensure we have default values for our filter fields
        data.domain = data.domain || 'other';
        data.sector = data.sector || 'other';
        data.developmentStage = data.developmentStage || 'ideation';
        
        // Get user profile data if available
        let userData = {};
        if (data.email) {
          const userQuery = query(
            collection(db, "contactSubmissions"),
            where("email", "==", data.email),
            where("status", "==", "accepted")
          );
          const userSnapshot = await getDocs(userQuery);
          if (!userSnapshot.empty) {
            userData = userSnapshot.docs[0].data();
          }
        }

        fetchedSubmissions.push({
          id: docSnap.id,
          ...data,
          ...userData, // Merge user data
          submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : new Date(data.submittedAt),
          status: data.status || "pending",
          processedByAdminAt: data.processedByAdminAt instanceof Timestamp ? data.processedByAdminAt.toDate() : data.processedByAdminAt ? new Date(data.processedByAdminAt) : undefined,
        } as Submission);
      }
      setSubmissions(fetchedSubmissions);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      if (error.code === 'permission-denied') {
        setError('Access denied. Please check your permissions or try logging in again.');
        router.push('/login');
      } else {
        setError('Failed to load submissions. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions();
    }
  }, [isAuthenticated]);

  // Define filter options
  const filterOptions: FilterOption[] = [
    {
      value: 'domain',
      label: 'Domain',
      type: 'select',
      options: [
        { value: 'all', label: 'All Domains' },
        { value: 'technology', label: 'Technology' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'education', label: 'Education' },
        { value: 'fintech', label: 'Fintech' },
        { value: 'ecommerce', label: 'E-Commerce' },
        { value: 'sustainability', label: 'Sustainability' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      value: 'sector',
      label: 'Sector',
      type: 'select',
      options: [
        { value: 'all', label: 'All Sectors' },
        { value: 'agriculture', label: 'Agriculture' },
        { value: 'manufacturing', label: 'Manufacturing' },
        { value: 'services', label: 'Services' },
        { value: 'retail', label: 'Retail' },
        { value: 'energy', label: 'Energy' },
        { value: 'it', label: 'Information Technology' },
        { value: 'biotech', label: 'Biotech' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      value: 'developmentStage',
      label: 'Development Stage',
      type: 'select',
      options: [
        { value: 'all', label: 'All Stages' },
        { value: 'ideation', label: 'Ideation' },
        { value: 'prototype', label: 'Prototype' },
        { value: 'mvp', label: 'MVP' },
        { value: 'early_traction', label: 'Early Traction' },
        { value: 'growth', label: 'Growth' },
        { value: 'scaling', label: 'Scaling' }
      ]
    }
  ];

  const handleAddFilter = (criterion: FilterCriterion) => {
    const newFilter: FilterType = {
      id: Math.random().toString(36).substr(2, 9),
      ...criterion,
      label: `${criterion.field} ${criterion.operator} ${criterion.value}`
    };
    setActiveFilters([...activeFilters, newFilter]);
  };

  const handleRemoveFilter = (id: string) => {
    setActiveFilters(activeFilters.filter(filter => filter.id !== id));
  };

  // Filter application function
  const applyFilters = () => {
    let filtered = [...submissions];
    
    // Group filters by field
    const filtersByField = activeFilters.reduce((acc, filter) => {
      acc[filter.field] = filter;
      return acc;
    }, {} as Record<string, FilterType>);

    // Apply all filters
    filtered = filtered.filter(submission => {
      // Check each field that has an active filter
      return Object.entries(filtersByField).every(([field, filter]) => {
        const fieldValue = submission[field as keyof Submission];
        
        // Skip if the value is 'all'
        if (filter.value === 'all') {
          return true;
        }

        // Handle null or undefined values
        if (!fieldValue) {
          return false;
        }

        switch (filter.operator) {
          case 'equals':
            return fieldValue.toString().toLowerCase() === filter.value.toString().toLowerCase();
          case 'contains':
            return fieldValue.toString().toLowerCase().includes(filter.value.toString().toLowerCase());
          default:
            return true;
        }
      });
    });

    setFilteredSubmissions(filtered);
    setShowFilterManager(false);
  };

  useEffect(() => {
    setFilteredSubmissions(submissions);
  }, [submissions]);

  if (isAuthenticated === false) {
    return null; // Router will redirect to login
  }

  if (isLoading && isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Header with filter count */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Startup Submissions</h1>
          {activeFilters.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing {filteredSubmissions.length} filtered results
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <Button
            onClick={fetchSubmissions}
            variant="outline"
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button
            onClick={() => setShowFilterManager(true)}
            className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
            {activeFilters.length > 0 && (
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {activeFilters.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Filter Dialog with Active Filters */}
      <Dialog open={showFilterManager} onOpenChange={setShowFilterManager}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Filter Submissions</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {activeFilters.length > 0 && (
              <div className="bg-secondary/20 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map(filter => {
                    const filterOption = filterOptions.find(opt => opt.value === filter.field);
                    const optionLabel = filterOption?.options?.find(opt => opt.value === filter.value)?.label;
                    return (
                      <div key={filter.id} className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full text-sm">
                        <span>{`${filterOption?.label}: ${optionLabel || filter.value}`}</span>
                        <button
                          onClick={() => handleRemoveFilter(filter.id)}
                          className="hover:text-destructive"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => setActiveFilters([])}
                    className="text-sm text-muted-foreground hover:text-destructive"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
            <FilterManager
              filterOptions={filterOptions}
              onAddFilter={handleAddFilter}
              onRemoveFilter={handleRemoveFilter}
              onApplyFilters={applyFilters}
              filters={activeFilters}
              className="space-y-4"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* On-Campus Submissions */}
      <div className="rounded-2xl bg-neutral-900/50 border border-neutral-800/50 overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-semibold flex items-center">
            <Landmark className="mr-2" />
            On-Campus Submissions
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Review on-campus applications</p>
        </div>
        <div className="p-6 pt-0">
          {error ? (
            <div className="flex items-center justify-center text-red-500 text-center py-8">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSubmissions}
                className="ml-4"
              >
                Retry
              </Button>
            </div>
          ) : filteredSubmissions.filter(s => s.campusStatus === 'campus').length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No on-campus submissions found.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubmissions
                .filter(submission => submission.campusStatus === 'campus')
                .map((submission) => (
                  <OnCampusSubmissionCard
                    key={submission.id}
                    submission={submission}
                    onViewDetails={() => setSelectedSubmission(submission)}
                    className="h-full"
                  />
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Off-Campus Submissions */}
      <div className="rounded-2xl bg-neutral-900/50 border border-neutral-800/50 overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-semibold flex items-center">
            <Building className="mr-2" />
            Off-Campus Submissions
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Review off-campus applications</p>
        </div>
        <div className="p-6 pt-0">
          {error ? (
            <div className="flex items-center justify-center text-red-500 text-center py-8">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSubmissions}
                className="ml-4"
              >
                Retry
              </Button>
            </div>
          ) : filteredSubmissions.filter(s => s.campusStatus === 'off-campus').length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No off-campus submissions found.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubmissions
                .filter(submission => submission.campusStatus === 'off-campus')
                .map((submission) => (
                  <OnCampusSubmissionCard
                    key={submission.id}
                    submission={submission}
                    onViewDetails={() => setSelectedSubmission(submission)}
                    className="h-full"
                  />
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onUpdateEvaluation={(evaluations) => {
            setSubmissions(submissions.map(sub => 
              sub.id === selectedSubmission.id 
                ? { ...sub, evaluations } 
                : sub
            ));
          }}
        />
      )}
    </div>
  );
}