// Note: These enums don't exist in the current Prisma schema, using string types instead
type UserRole = string;
type ProposalStatus = string;
type ProposalType = string;
type ActivityType = string;
type ExportFormat = string;

// User Types
export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  avatar?: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
}

export interface IUpdateUser {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: UserRole;
}

// Organization Types
export interface IOrganization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  brandVoice?: string;
  brandGuidelines?: string;
  valueProps?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateOrganization {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  brandVoice?: string;
  brandGuidelines?: string;
  valueProps?: string[];
}

// Proposal Types
export interface IProposal {
  id: string;
  title: string;
  description?: string;
  clientName: string;
  clientEmail?: string;
  status: ProposalStatus;
  type: ProposalType;
  content: any;
  metadata?: any;
  version: number;
  isPublic: boolean;
  publicUrl?: string;
  userId: string;
  organizationId: string;
  templateId?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface ICreateProposal {
  title: string;
  description?: string;
  clientName: string;
  clientEmail?: string;
  type: ProposalType;
  status?: ProposalStatus;
  content?: any;
  metadata?: any;
  templateId?: string;
}

export interface IUpdateProposal {
  title?: string;
  description?: string;
  clientName?: string;
  clientEmail?: string;
  status?: ProposalStatus;
  content?: any;
  metadata?: any;
  isPublic?: boolean;
}

// Template Types
export interface ITemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  content: any;
  isActive: boolean;
  isPublic: boolean;
  userId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateTemplate {
  name: string;
  description?: string;
  category: string;
  content: any;
  isPublic?: boolean;
}

// Snippet Types
export interface ISnippet {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  usageCount: number;
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateSnippet {
  title: string;
  content: string;
  category: string;
  tags?: string[];
}

// Case Study Types
export interface ICaseStudy {
  id: string;
  title: string;
  description: string;
  clientName?: string;
  industry?: string;
  challenge: string;
  solution: string;
  results: string;
  metrics?: any;
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateCaseStudy {
  title: string;
  description: string;
  clientName?: string;
  industry?: string;
  challenge: string;
  solution: string;
  results: string;
  metrics?: any;
}

// Pricing Model Types
export interface IPricingModel {
  id: string;
  name: string;
  description?: string;
  pricing: any;
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreatePricingModel {
  name: string;
  description?: string;
  pricing: any;
}

// Comment Types
export interface IComment {
  id: string;
  content: string;
  position?: any;
  userId: string;
  proposalId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateComment {
  content: string;
  position?: any;
}

export interface IUpdateComment {
  content: string;
  position?: any;
}

export interface ICreateTeam {
  name: string;
  description?: string;
}

export interface IUpdateTeam {
  name: string;
  description?: string;
}

export interface IAddTeamMember {
  email: string;
  role?: 'ADMIN' | 'EDITOR' | 'VIEWER' | 'MEMBER';
}

export interface IUpdateTeamMember {
  role: 'ADMIN' | 'EDITOR' | 'VIEWER' | 'MEMBER';
}

// Activity Types
export interface IActivity {
  id: string;
  type: ActivityType;
  details?: any;
  userId: string;
  proposalId: string;
  createdAt: Date;
}

// Export Types
export interface IExport {
  id: string;
  format: ExportFormat;
  filePath: string;
  fileSize?: number;
  proposalId: string;
  createdAt: Date;
}

// AI Generation Types
export interface IGenerateProposalRequest {
  clientName: string;
  clientEmail?: string;
  projectDescription: string;
  budget?: string;
  timeline?: string;
  requirements?: string[];
  templateId?: string;
  customInstructions?: string;
}

export interface IGenerateProposalResponse {
  proposal: IProposal;
  suggestedSnippets: ISnippet[];
  estimatedTime: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth Types
export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  user: IUser;
  token: string;
  organization?: IOrganization;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  organizationSlug: string;
}

// Search and Filter Types
export interface IProposalFilters {
  status?: ProposalStatus[];
  type?: ProposalType[];
  clientName?: string;
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
}

export interface ISearchParams {
  query: string;
  category?: string;
  tags?: string[];
}

// File Upload Types
export interface IFileUpload {
  originalname: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
}

// Analytics Types
export interface IProposalAnalytics {
  totalProposals: number;
  proposalsByStatus: Record<ProposalStatus, number>;
  proposalsByType: Record<ProposalType, number>;
  recentActivity: IActivity[];
  topTemplates: ITemplate[];
  conversionRate: number;
}

// Brand Guidelines Types
export interface IBrandGuidelines {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  brandVoice: string;
  toneOfVoice: string[];
  doAndDonts: {
    do: string[];
    dont: string[];
  };
  examples: string[];
} 