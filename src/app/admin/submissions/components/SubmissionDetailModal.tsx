"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Submission, EvaluationCriterion } from '@/types/Submission';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Calendar, User, Building2, Mail, Phone, Link2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubmissionDetailModalProps {
  submission: Submission;
  onClose: () => void;
  onUpdateEvaluation: (evaluations: { criterionId: string; score: number }[]) => void;
}

export function SubmissionDetailModal({ submission, onClose, onUpdateEvaluation }: SubmissionDetailModalProps) {
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([]);
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load evaluation criteria
  useEffect(() => {
    const fetchCriteria = async () => {
      try {
        const criteriaCollection = collection(db, 'evaluationCriteria');
        const snapshot = await getDocs(criteriaCollection);
        const fetchedCriteria: EvaluationCriterion[] = [];
        snapshot.forEach(doc => {
          fetchedCriteria.push({ id: doc.id, ...doc.data() } as EvaluationCriterion);
        });
        setCriteria(fetchedCriteria);

        // Initialize scores from existing evaluations
        const initialScores: { [key: string]: number } = {};
        submission.evaluations?.forEach(evaluation => {
          initialScores[evaluation.criterionId] = evaluation.score;
        });
        setScores(initialScores);
      } catch (error) {
        console.error('Error fetching criteria:', error);
      }
    };

    fetchCriteria();
  }, [submission]);

  // Calculate total score
  const totalScore = Object.values(scores).reduce((acc, score) => acc + score, 0);
  const maxPossibleScore = criteria.reduce((acc, criterion) => acc + criterion.maxScore, 0);
  const scorePercentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

  // Format date
  const formattedDate = new Date(submission.submittedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Handle score change
  const handleScoreChange = (criterionId: string, score: number) => {
    setScores(prev => ({ ...prev, [criterionId]: score }));
  };

  // Handle save
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const evaluations = Object.entries(scores).map(([criterionId, score]) => ({
        criterionId,
        score
      }));
      await onUpdateEvaluation(evaluations);
      onClose();
    } catch (error) {
      console.error('Error saving evaluation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-2xl font-semibold">{submission.startupName}</span>
            <Badge 
              variant="outline" 
              className={cn(
                "px-3 py-1",
                submission.status === 'pending' && "bg-yellow-500/10 text-yellow-500",
                submission.status === 'accepted' && "bg-green-500/10 text-green-500",
                submission.status === 'rejected' && "bg-red-500/10 text-red-500"
              )}
            >
              {submission.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          {/* Left Column - Submission Details */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{submission.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{submission.email}</span>
                </div>
                {submission.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{submission.phone}</span>
                  </div>
                )}
                {submission.linkedin && (
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-muted-foreground" />
                    <a href={submission.linkedin} target="_blank" rel="noopener noreferrer" 
                       className="text-primary hover:underline">
                      LinkedIn Profile
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Submitted on {formattedDate}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Startup Details</h3>
              <div className="space-y-3">
                {submission.companyName && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span>{submission.companyName}</span>
                  </div>
                )}
                {submission.idea && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Startup Idea</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {submission.idea}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Details */}
            {(submission.domain || submission.sector || submission.legalStatus) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {submission.domain && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Domain</span>
                        <p>{submission.domain}</p>
                      </div>
                    )}
                    {submission.sector && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Sector</span>
                        <p>{submission.sector}</p>
                      </div>
                    )}
                    {submission.legalStatus && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Legal Status</span>
                        <p>{submission.legalStatus}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Evaluation */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Evaluation</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Overall Score</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>{totalScore}/{maxPossibleScore}</span>
                  </div>
                </div>
                <Progress value={scorePercentage} className="h-2" />
              </div>

              <div className="space-y-4 mt-4">
                <AnimatePresence>
                  {criteria.map((criterion) => (
                    <motion.div
                      key={criterion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">
                          {criterion.name}
                          <span className="text-xs text-muted-foreground ml-2">
                            (max: {criterion.maxScore})
                          </span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={criterion.maxScore}
                          value={scores[criterion.id] || 0}
                          onChange={(e) => handleScoreChange(criterion.id, Number(e.target.value))}
                          className="w-16 px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{criterion.description}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isLoading}
                className="bg-gradient-to-r from-primary/80 to-accent/80 hover:from-primary hover:to-accent text-primary-foreground"
              >
                {isLoading ? 'Saving...' : 'Save Evaluation'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 