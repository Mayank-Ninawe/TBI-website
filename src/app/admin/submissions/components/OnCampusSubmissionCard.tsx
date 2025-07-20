'use client';

import { Submission } from '@/types/Submission';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Calendar, User, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OnCampusSubmissionCardProps {
  submission: Submission;
  onViewDetails: () => void;
  className?: string;
}

export function OnCampusSubmissionCard({ submission, onViewDetails, className }: OnCampusSubmissionCardProps) {
  // Calculate average score
  const averageScore = submission.evaluations?.length 
    ? submission.evaluations.reduce((acc, curr) => acc + curr.score, 0) / submission.evaluations.length 
    : 0;

  // Format date
  const formattedDate = new Date(submission.submittedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Status color mapping
  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500',
    accepted: 'bg-green-500/10 text-green-500',
    rejected: 'bg-red-500/10 text-red-500'
  };

  return (
    <Card className={cn(
      "relative overflow-hidden group transition-all duration-300",
      "hover:border-accent/50",
      className
    )}>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="relative">
        <div className="flex justify-between items-start mb-2">
          <Badge 
            variant="outline" 
            className={cn(
              "px-2 py-0.5 text-xs font-medium capitalize",
              statusColors[submission.status]
            )}
          >
            {submission.status}
          </Badge>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">{averageScore.toFixed(1)}</span>
          </div>
        </div>
        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
          {submission.startupName}
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{formattedDate}</span>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm truncate">{submission.name}</span>
          </div>
          {submission.companyName && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm truncate">{submission.companyName}</span>
            </div>
          )}
        </div>

        {submission.idea && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {submission.idea}
          </p>
        )}

        <div className="pt-2">
          <Button 
            onClick={onViewDetails}
            className="w-full bg-gradient-to-r from-primary/80 to-accent/80 hover:from-primary hover:to-accent text-primary-foreground"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 