import type { GradeCategory, SurveyStatus, UserRole } from '../shared';

export type AnswerType = 'TEXT' | 'YES_NO' | 'NUMBER' | 'CHOICE' | 'MULTI';

export interface Question {
  id: string;
  text: string;
  answerType: AnswerType;
  options: string[];
  required: boolean;
  section: string;
  order: number;
  occupationId?: string | null;
  occupation?: { id: string; code: string; name: string; level: number } | null;
}

export interface SurveyAnswer {
  id: string;
  surveyId: string;
  questionId: string;
  question: Question;
  value: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Occupation {
  id: string;
  code: string;
  name: string;
  level: number;
  parentId: string | null;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  ownerName: string;
  occupationId: string;
  occupation?: Occupation;
  extraData?: Record<string, unknown> | null;
}

export interface SurveyItem {
  id: string;
  code: string;
  name: string;
  order: number;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  itemId: string;
  item: SurveyItem;
  score: number;
  notes?: string | null;
}

export interface RiskGrade {
  id: string;
  surveyId: string;
  adminId: string;
  admin?: { id: string; name: string; email: string };
  totalScore: number;
  category: GradeCategory;
  notes?: string | null;
  gradedAt: string;
}

export interface SurveyAttachment {
  id: string;
  surveyId: string;
  fileName: string;
  fileKey: string;
  mimeType: string;
  sizeBytes: number;
  kind: 'photo' | 'document' | 'video';
  downloadUrl?: string | null;
  createdAt: string;
}

export interface Survey {
  id: string;
  propertyId: string;
  surveyorId: string;
  status: SurveyStatus;
  surveyDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  property: Property & { occupation?: Occupation };
  surveyor?: User;
  responses?: SurveyResponse[];
  answers?: SurveyAnswer[];
  attachments?: SurveyAttachment[];
  grade?: RiskGrade | null;
}

export interface Notification {
  id: string;
  userId: string;
  surveyId?: string | null;
  message: string;
  readAt?: string | null;
  createdAt: string;
  survey?: { id: string; status: SurveyStatus; property: { name: string } } | null;
}

export interface ReportData {
  id: string;
  status: SurveyStatus;
  surveyDate?: string | null;
  notes?: string | null;
  createdAt: string;
  property: {
    name: string;
    address: string;
    ownerName: string;
    extraData?: any;
    occupation: {
      code: string;
      name: string;
      level1?: string | null;
      level2?: string | null;
      level3: string;
    };
  };
  surveyor: { name: string; email: string };
  answers: Array<{
    section: string;
    items: Array<{ question: string; answerType: string; value: string }>;
  }>;
  items: Array<{
    code: string;
    name: string;
    order: number;
    score: number;
    notes?: string | null;
  }>;
  attachments: Array<{
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    kind: string;
  }>;
  grading: {
    gradeBelumDinasilkan?: boolean;
    totalScore: number | null;
    category: GradeCategory | null;
    categoryLabel: string | null;
    notes?: string | null;
    adminName?: string | null;
    gradedAt?: string | null;
    recommendedCategory: GradeCategory | null;
  };
}

export interface DashboardStats {
  byStatus: Array<{ status: SurveyStatus; count: number }>;
  totalSurveys: number;
  totalProperties: number;
  highRisk?: number;
  avgScore?: number | null;
  critical?: number;
  distribution?: Record<'GOOD' | 'AVERAGE' | 'MARGINAL' | 'POOR', number>;
  rankings?: Array<{
    surveyId: string;
    propertyId: string;
    name: string;
    score: number;
    category: GradeCategory;
    status: SurveyStatus;
  }>;
}