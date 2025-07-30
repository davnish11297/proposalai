import mongoose from 'mongoose';

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  description: String,
  website: String,
  industry: String,
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
  },
  logo: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  settings: {
    allowPublicProposals: {
      type: Boolean,
      default: true,
    },
    requireApproval: {
      type: Boolean,
      default: false,
    },
    defaultProposalExpiry: {
      type: Number,
      default: 30, // days
    },
    branding: {
      primaryColor: {
        type: String,
        default: '#3b82f6',
      },
      secondaryColor: {
        type: String,
        default: '#1f2937',
      },
      fontFamily: {
        type: String,
        default: 'Inter',
      },
    },
    notifications: {
      emailOnProposalViewed: {
        type: Boolean,
        default: true,
      },
      emailOnProposalCommented: {
        type: Boolean,
        default: true,
      },
      emailOnProposalExpiring: {
        type: Boolean,
        default: true,
      },
    },
  },
  subscription: {
    plan: {
      type: String,
      enum: ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
      default: 'FREE',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'CANCELLED', 'PAST_DUE'],
      default: 'ACTIVE',
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    billingEmail: String,
  },
  limits: {
    maxUsers: {
      type: Number,
      default: 5,
    },
    maxProposals: {
      type: Number,
      default: 10,
    },
    maxStorageGB: {
      type: Number,
      default: 1,
    },
  },
  usage: {
    userCount: {
      type: Number,
      default: 0,
    },
    proposalCount: {
      type: Number,
      default: 0,
    },
    storageUsedMB: {
      type: Number,
      default: 0,
    },
  },
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

// Update updatedAt on save
OrganizationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Ensure virtual fields are serialized
OrganizationSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);