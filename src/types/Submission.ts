import { Timestamp } from 'firebase/firestore';

export type SubmissionStatus = 'pending' | 'accepted' | 'rejected';
export type CampusStatus = 'campus' | 'off-campus' | undefined;

export interface Submission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  linkedin?: string;
  course?: string;
  yearOfStudy?: string;
  campus?: string;
  companyName?: string;
  startupName: string;
  idea?: string;
  startupIdea?: string;
  message?: string;
  campusStatus?: CampusStatus;
  submittedAt: Date | Timestamp | string;
  status: SubmissionStatus;
  temporaryUserId?: string;
  temporaryPassword?: string;
  processedByAdminAt?: Date | Timestamp | string;
  source?: 'campus' | 'off-campus';
  
  // New fields from CampusApplicationForm
  fullName?: string;
  natureOfInquiry?: string;
  companyEmail?: string;
  founderNames?: string;
  founderBio?: string;
  portfolioUrl?: string;
  teamInfo?: string;
  targetAudience?: string;
  problemSolving?: string;
  uniqueness?: string;
  currentStage?: string;
  
  // New dropdown fields
  domain: string;
  sector: string;
  legalStatus?: string;
  
  attachmentBase64?: string;
  attachmentName?: string;

  evaluations?: {
    criterionId: string;
    score: number;
  }[];
}

export interface ProcessingActionState {
  id: string;
  type: 'accept' | 'reject';
}

export interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  weight: number;
}

export interface EvaluationScore {
  criterionId: string;
  score: number;
  comment?: string;
}

export interface Evaluation {
  id: string;
  submissionId: string;
  evaluatorId: string;
  scores: EvaluationScore[];
  totalScore: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}
