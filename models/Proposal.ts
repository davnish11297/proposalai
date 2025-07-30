import mongoose from 'mongoose';

const ProposalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
    default: 'DRAFT',
  },
  type: {
    type: String,
    enum: ['PROPOSAL', 'RFP_RESPONSE', 'QUOTE', 'CONTRACT'],
    default: 'PROPOSAL',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
  },
  // Client information embedded for proposals without formal client records
  clientInfo: {
    name: String,
    email: String,
    company: String,
    phone: String,
    address: String,
  },
  // Proposal metadata
  description: String,
  tags: [String],
  category: String,
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM',
  },
  // Proposal settings
  isPublic: {
    type: Boolean,
    default: false,
  },
  publicId: {
    type: String,
    unique: true,
    sparse: true,
  },
  password: String, // For password-protected proposals
  expiresAt: Date,
  // AI generation metadata
  aiGenerated: {
    type: Boolean,
    default: false,
  },
  aiPrompt: String,
  aiModel: String,
  generationTokens: Number,
  // Email tracking
  emailSent: {
    type: Boolean,
    default: false,
  },
  emailSentAt: Date,
  emailSentTo: [String],
  emailSubject: String,
  emailMessage: String,
  
  // Enhanced Send History - Track each time proposal is sent with immutable version info
  sendHistory: [{
    sendId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    version: {
      type: Number,
      required: true // Version that was sent (immutable)
    },
    versionSnapshot: {
      content: String, // Exact content that was sent (immutable)
      title: String,
      description: String,
      wordCount: Number,
      snapshotTakenAt: {
        type: Date,
        default: Date.now
      }
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    sentTo: {
      type: String,
      required: true,
    },
    clientName: String,
    subject: String,
    emailMessage: String, // Custom message with the proposal
    status: {
      type: String,
      enum: ['SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
      default: 'SENT',
    },
    viewedAt: Date,
    respondedAt: Date,
    // Tracking info
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sendMethod: {
      type: String,
      enum: ['EMAIL', 'LINK', 'DOWNLOAD'],
      default: 'EMAIL'
    },
    // Version validation
    isVersionLocked: {
      type: Boolean,
      default: true // Once sent, this send record is immutable
    }
  }],
  
  // Enhanced Version Control - Proper content snapshots
  version: {
    type: Number,
    default: 1
  },
  
  // Version snapshots - immutable once sent
  versionSnapshots: [{
    version: {
      type: Number,
      required: true
    },
    content: {
      type: String,
      required: true // Full content snapshot
    },
    title: String,
    description: String,
    changes: String, // Summary of what changed
    changeType: {
      type: String,
      enum: ['created', 'content_edit', 'minor_edit', 'major_edit', 'pre_send'],
      default: 'content_edit'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isSent: {
      type: Boolean,
      default: false // True when this version is sent to someone
    },
    sentCount: {
      type: Number,
      default: 0 // How many times this version was sent
    },
    wordCount: Number,
    characterCount: Number,
    isLocked: {
      type: Boolean,
      default: false // Once sent, version becomes locked
    }
  }],
  
  // Current working version info
  currentVersionContent: String, // What user is currently editing
  hasUnsavedChanges: {
    type: Boolean,
    default: false
  },
  lastContentHash: String, // To detect if content actually changed
  // Engagement tracking
  views: [{
    viewedAt: {
      type: Date,
      default: Date.now,
    },
    viewerIP: String,
    viewerUserAgent: String,
    viewerLocation: String,
    duration: Number, // in seconds
  }],
  downloads: [{
    downloadedAt: {
      type: Date,
      default: Date.now,
    },
    format: {
      type: String,
      enum: ['PDF', 'DOCX', 'PPTX'],
    },
    downloaderIP: String,
  }],
  // Collaboration
  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    role: {
      type: String,
      enum: ['EDITOR', 'REVIEWER', 'VIEWER'],
      default: 'VIEWER',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // Template reference
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
  },
  // Version control
  version: {
    type: Number,
    default: 1,
  },
  parentProposalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal',
  },
  // Financial information
  totalValue: Number,
  currency: {
    type: String,
    default: 'USD',
  },
  paymentTerms: String,
  // Approval workflow
  approvalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'NOT_REQUIRED'],
    default: 'NOT_REQUIRED',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  rejectionReason: String,
  // Auto-save functionality
  lastAutoSave: Date,
  autoSaveContent: String, // For recovery purposes
  isDraft: {
    type: Boolean,
    default: true,
  },
  // Timestamps
  sentAt: Date,
  viewedAt: Date,
  respondedAt: Date,
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
ProposalSchema.index({ userId: 1, status: 1 });
ProposalSchema.index({ organizationId: 1, status: 1 });
ProposalSchema.index({ clientId: 1 });
ProposalSchema.index({ expiresAt: 1 });
ProposalSchema.index({ createdAt: -1 });

// Update updatedAt on save
ProposalSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Generate public ID for public proposals
ProposalSchema.pre('save', function(next) {
  if (this.isPublic && !this.publicId) {
    this.publicId = generatePublicId();
  }
  next();
});

// Helper function to generate public ID
function generatePublicId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Virtual for view count
ProposalSchema.virtual('viewCount').get(function() {
  return this.views?.length || 0;
});

// Virtual for download count
ProposalSchema.virtual('downloadCount').get(function() {
  return this.downloads?.length || 0;
});

// Ensure virtual fields are serialized
ProposalSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    // Keep _id for backward compatibility
    // delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.models.Proposal || mongoose.model('Proposal', ProposalSchema);