import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  phone: String,
  jobTitle: String,
  department: String,
  website: String,
  industry: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String,
  },
  // Relationship information
  source: {
    type: String,
    enum: ['REFERRAL', 'WEBSITE', 'SOCIAL_MEDIA', 'COLD_OUTREACH', 'EVENT', 'OTHER'],
    default: 'OTHER',
  },
  status: {
    type: String,
    enum: ['LEAD', 'PROSPECT', 'ACTIVE', 'INACTIVE', 'LOST'],
    default: 'LEAD',
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM',
  },
  // Organization reference
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Engagement tracking
  lastContactDate: Date,
  nextFollowUpDate: Date,
  totalProposals: {
    type: Number,
    default: 0,
  },
  acceptedProposals: {
    type: Number,
    default: 0,
  },
  totalValue: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  // Notes and tags
  notes: String,
  tags: [String],
  customFields: {
    type: Map,
    of: String,
  },
  // Preferences
  preferredContactMethod: {
    type: String,
    enum: ['EMAIL', 'PHONE', 'LINKEDIN', 'OTHER'],
    default: 'EMAIL',
  },
  timezone: String,
  language: {
    type: String,
    default: 'en',
  },
  // Communication history
  communications: [{
    type: {
      type: String,
      enum: ['EMAIL', 'PHONE', 'MEETING', 'NOTE'],
      required: true,
    },
    subject: String,
    content: String,
    date: {
      type: Date,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    attachments: [String],
  }],
  // Contact information
  alternateEmails: [String],
  alternatePhones: [String],
  // Company information
  companySize: String,
  annualRevenue: String,
  fiscalYearEnd: String,
  foundedYear: Number,
  headquarters: {
    city: String,
    state: String,
    country: String,
  },
  description: String,
  technologies: [String],
  
  // Enrichment data
  lastEnrichmentDate: Date,
  enrichmentSource: String,
  dataCompleteness: {
    type: Number,
    default: 0,
  },
  
  // Social and competitive intelligence
  recentNews: [{
    title: String,
    summary: String,
    date: Date,
    source: String,
    sentiment: String,
    category: String,
  }],
  
  competitorAnalysis: {
    mainCompetitors: [String],
    marketShare: String,
    competitiveAdvantage: String,
    lastUpdated: Date,
  },
  
  industryInsights: {
    trends: [String],
    challenges: [String],
    opportunities: [String],
    avgDealSize: String,
    salesCycle: String,
    lastUpdated: Date,
    source: String,
  },
  
  // Enhanced contact information
  alternatePhones: [String],
  socialProfiles: {
    linkedin: String,
    twitter: String,
    facebook: String,
  },
  lastSeen: Date,
  // Important dates
  firstContactDate: Date,
  lastProposalDate: Date,
  // Agreement and consent
  marketingConsent: {
    type: Boolean,
    default: false,
  },
  dataProcessingConsent: {
    type: Boolean,
    default: true,
  },
  // Status tracking
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for performance
ClientSchema.index({ organizationId: 1, email: 1 });
ClientSchema.index({ userId: 1 });
ClientSchema.index({ status: 1 });
ClientSchema.index({ company: 1 });
ClientSchema.index({ createdAt: -1 });

// Update updatedAt on save
ClientSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for full contact info
ClientSchema.virtual('fullContact').get(function() {
  return {
    name: this.name,
    email: this.email,
    company: this.company,
    phone: this.phone,
  };
});

// Virtual for proposal success rate
ClientSchema.virtual('successRate').get(function() {
  if (this.totalProposals === 0) return 0;
  return Math.round((this.acceptedProposals / this.totalProposals) * 100);
});

// Ensure virtual fields are serialized
ClientSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.models.Client || mongoose.model('Client', ClientSchema);