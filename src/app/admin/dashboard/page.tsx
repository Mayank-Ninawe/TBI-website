"use client";

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileTextIcon } from "lucide-react";
import { AlertCircle, Loader2, ThumbsUp, ThumbsDown, KeyRound, UserCircle, CheckCircle, XCircle, Clock, Landmark, Building, RefreshCw } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { processApplicationAction } from '@/app/actions/admin-actions';
import { SubmissionsTable } from './components/SubmissionsTable';
import { Submission } from '@/types/Submission';

interface ProcessingActionState {
  id: string;
  type: 'accept' | 'reject';
}

interface KPIData {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}

export default function AdminDashboardPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [processingActionState, setProcessingActionState] = useState<ProcessingActionState | null>(null);

  const [onCampusKpi, setOnCampusKpi] = useState<KPIData>({ total: 0, pending: 0, accepted: 0, rejected: 0 });
  const [offCampusKpi, setOffCampusKpi] = useState<KPIData>({ total: 0, pending: 0, accepted: 0, rejected: 0 });

  const fetchSubmissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const submissionsCollection = collection(db, "contactSubmissions");
      const q = query(submissionsCollection, orderBy("submittedAt", "desc"));
      const snapshot = await getDocs(q);
      const fetched: Submission[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        fetched.push({
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : new Date(data.submittedAt),
          status: data.status || "pending",
          processedByAdminAt: data.processedByAdminAt instanceof Timestamp ? data.processedByAdminAt.toDate() : data.processedByAdminAt ? new Date(data.processedByAdminAt) : undefined,
        } as Submission);
      });
      setSubmissions(fetched);
      updateKpi(fetched);
    } catch (err: any) {
      console.error("Error fetching submissions:", err);
      setError("Failed to load submissions.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateKpi = (data: Submission[]) => {
    const onCampusCounts = { pending: 0, accepted: 0, rejected: 0 };
    const offCampusCounts = { pending: 0, accepted: 0, rejected: 0 };

    data.forEach(sub => {
      if (sub.campusStatus === 'campus') {
        onCampusCounts[sub.status]++;
      } else if (sub.campusStatus === 'off-campus') {
        offCampusCounts[sub.status]++;
      }
    });

    setOnCampusKpi({
      total: Object.values(onCampusCounts).reduce((a, b) => a + b, 0),
      ...onCampusCounts
    });

    setOffCampusKpi({
      total: Object.values(offCampusCounts).reduce((a, b) => a + b, 0),
      ...offCampusCounts
    });
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const formatDate = (date?: Date | string) => {
    if (!date) return 'N/A';
    try { return format(new Date(date), "PPpp"); } catch { return 'Invalid Date'; }
  };

  const handleProcess = async (id: string, action: 'accept' | 'reject', name: string, email: string) => {
    setProcessingActionState({ id, type: action });
    try {
      const result = await processApplicationAction(id, action, name, email);
      if (result.status === 'success') {
        toast({ title: `Application ${action === 'accept' ? 'Accepted' : 'Rejected'}`, description: result.message });
        fetchSubmissions();
      } else {
        toast({ title: 'Failed', description: result.message, variant: 'destructive' });
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: `Could not ${action} application.`, variant: 'destructive' });
    } finally {
      setProcessingActionState(null);
    }
  };

  const KpiCard = ({ title, value, Icon, description, className = '', iconBg, valueColor }: { title: string; value: number | string; Icon: React.ComponentType<{ className?: string }>; description?: string; className?: string; iconBg?: string; valueColor?: string }) => (
    <div className={`group relative p-6 bg-neutral-900/50 backdrop-blur-sm rounded-2xl border border-neutral-800/50 hover:border-indigo-500/30 transition-all duration-300 overflow-hidden ${className} hover:shadow-lg hover:shadow-indigo-500/5`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${iconBg || 'bg-indigo-500/10'} group-hover:bg-opacity-80 transition-all duration-300`}>
            <Icon className={`h-5 w-5 ${valueColor || 'text-indigo-400'} group-hover:scale-110 transition-transform`} />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-sm font-medium text-neutral-400">{title}</p>
          <p className={`mt-1 text-2xl font-bold ${valueColor || 'text-white'}`}>
            {value}
          </p>
          {description && (
            <p className="mt-1.5 text-xs text-neutral-500 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 mr-1.5"></span>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderKpiSection = (kpiData: KPIData, title: string, Icon: React.ComponentType<{ className?: string }>) => (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-neutral-400" />
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Total" 
          value={kpiData.total} 
          Icon={FileTextIcon} 
          description="All received"
          iconBg="bg-blue-500/10"
          valueColor="text-blue-400"
          className="hover:border-blue-500/30 hover:shadow-blue-500/5"
        />
        <KpiCard 
          title="Pending" 
          value={kpiData.pending} 
          Icon={Clock} 
          description="Awaiting review"
          iconBg="bg-amber-500/10"
          valueColor="text-amber-400"
          className="hover:border-amber-500/30 hover:shadow-amber-500/5"
        />
        <KpiCard 
          title="Accepted" 
          value={kpiData.accepted} 
          Icon={CheckCircle} 
          description="Approved"
          iconBg="bg-teal-500/10"
          valueColor="text-teal-400"
          className="hover:border-teal-500/30 hover:shadow-teal-500/5"
        />
        <KpiCard 
          title="Rejected" 
          value={kpiData.rejected} 
          Icon={XCircle} 
          description="Denied"
          iconBg="bg-rose-500/10"
          valueColor="text-rose-400"
          className="hover:border-rose-500/30 hover:shadow-rose-500/5"
        />
      </div>
    </div>
  );

  const onCampusSubmissions = submissions.filter(sub => sub.campusStatus === 'campus');
  const offCampusSubmissions = submissions.filter(sub => sub.campusStatus === 'off-campus');

  return (
    <div className="space-y-12">
      {/* On-Campus Section */}
      {renderKpiSection(onCampusKpi, "On-Campus Submissions", Landmark)}
      <div className="rounded-2xl bg-neutral-900/50 border border-neutral-800/50 overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <Landmark className="mr-2"/>On-Campus Submissions
            </h2>
            <p className="text-sm text-neutral-400">Review on-campus applications</p>
          </div>
        </div>
        <SubmissionsTable
          submissions={onCampusSubmissions}
          processingAction={processingActionState}
          onProcessAction={handleProcess}
          isLoading={isLoading}
          error={error}
          onRetry={fetchSubmissions}
        />
      </div>

      {/* Off-Campus Section */}
      {renderKpiSection(offCampusKpi, "Off-Campus Submissions", Building)}
      <div className="rounded-2xl bg-neutral-900/50 border border-neutral-800/50 overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <Building className="mr-2"/>Off-Campus Submissions
            </h2>
            <p className="text-sm text-neutral-400">Review off-campus applications</p>
          </div>
          <Button onClick={fetchSubmissions} disabled={isLoading} variant="outline" size="sm" className="mt-4 sm:mt-0">
            {isLoading ? <Loader2 className="animate-spin mr-2"/> : <RefreshCw className="mr-2"/>}Refresh
          </Button>
        </div>
        <SubmissionsTable
          submissions={offCampusSubmissions}
          processingAction={processingActionState}
          onProcessAction={handleProcess}
          isLoading={isLoading}
          error={error}
          onRetry={fetchSubmissions}
        />
      </div>
    </div>
  );
}
