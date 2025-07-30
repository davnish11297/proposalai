import mongoose from 'mongoose';

const FollowUpSequenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  
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
  
  // Trigger conditions
  triggerConditions: {
    daysAfterSent: {
      type: Number,
      default: 3,
    },
    proposalStatuses: [{
      type: String,
      enum: ['SENT', 'VIEWED'],
      default: ['SENT', 'VIEWED'],
    }],
    proposalValue: {
      min: Number,
      max: Number,
    },
    clientType: String, // 'LEAD', 'PROSPECT', 'ACTIVE'
  },
  
  // Email sequence steps
  steps: [{
    stepNumber: {
      type: Number,
      required: true,
    },
    name: String,
    delayDays: {
      type: Number,
      required: true,
    },
    emailTemplate: {
      subject: {
        type: String,
        required: true,
      },
      body: {
        type: String,
        required: true,
      },
      // Template variables: {{client_name}}, {{proposal_title}}, {{company_name}}, etc.
    },
    stopConditions: [{
      type: String,
      enum: ['CLIENT_RESPONDED', 'PROPOSAL_ACCEPTED', 'PROPOSAL_REJECTED', 'MANUAL_STOP'],
    }],
  }],
  
  // Escalation settings
  escalation: {
    enabled: {
      type: Boolean,
      default: false,
    },
    afterDays: {
      type: Number,
      default: 7,
    },
    escalateTo: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      email: String,
    }],
    escalationMessage: String,
  },
  
  // Sequence settings
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  
  // Usage statistics
  usageCount: {
    type: Number,
    default: 0,
  },
  successRate: {
    type: Number,
    default: 0,
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

// Follow-up execution tracking
const FollowUpExecutionSchema = new mongoose.Schema({
  proposalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal',
    required: true,
  },
  sequenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FollowUpSequence',
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  
  // Execution state
  status: {
    type: String,
    enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'STOPPED'],
    default: 'ACTIVE',
  },
  currentStep: {
    type: Number,
    default: 1,
  },
  
  // Execution log
  executionLog: [{
    stepNumber: Number,
    executedAt: {
      type: Date,
      default: Date.now,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailId: String, // SendGrid message ID
    recipientEmail: String,
    subject: String,
    status: {
      type: String,
      enum: ['SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'FAILED'],
      default: 'SENT',
    },
    error: String,
  }],
  
  // Stop conditions
  stoppedReason: {
    type: String,
    enum: ['CLIENT_RESPONDED', 'PROPOSAL_ACCEPTED', 'PROPOSAL_REJECTED', 'MANUAL_STOP', 'SEQUENCE_COMPLETED'],
  },
  stoppedAt: Date,
  
  // Next execution
  nextExecutionAt: Date,
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
FollowUpSequenceSchema.index({ organizationId: 1, isActive: 1 });
FollowUpSequenceSchema.index({ userId: 1 });
FollowUpSequenceSchema.index({ isDefault: 1 });

FollowUpExecutionSchema.index({ proposalId: 1 });
FollowUpExecutionSchema.index({ nextExecutionAt: 1, status: 1 });
FollowUpExecutionSchema.index({ organizationId: 1, status: 1 });

// Update updatedAt on save
FollowUpSequenceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

FollowUpExecutionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Ensure virtual fields are serialized
FollowUpSequenceSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

FollowUpExecutionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const FollowUpSequence = mongoose.models.FollowUpSequence || mongoose.model('FollowUpSequence', FollowUpSequenceSchema);
export const FollowUpExecution = mongoose.models.FollowUpExecution || mongoose.model('FollowUpExecution', FollowUpExecutionSchema);