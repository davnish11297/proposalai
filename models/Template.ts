import mongoose from 'mongoose';

const TemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  content: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['BUSINESS_PROPOSAL', 'RFP_RESPONSE', 'SALES_PROPOSAL', 'PROJECT_PROPOSAL', 'SERVICE_AGREEMENT', 'QUOTE', 'OTHER'],
    default: 'BUSINESS_PROPOSAL',
  },
  industry: String,
  tags: [String],
  
  // Template metadata
  isPublic: {
    type: Boolean,
    default: false,
  },
  isSystemTemplate: {
    type: Boolean,
    default: false,
  },
  difficulty: {
    type: String,
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
    default: 'BEGINNER',
  },
  estimatedTime: Number, // in minutes
  
  // Organization and user references
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
  
  // Template structure
  sections: [{
    name: String,
    content: String,
    order: Number,
    isRequired: {
      type: Boolean,
      default: false,
    },
    variables: [String], // Variables that can be replaced
  }],
  
  // Variables and placeholders
  variables: [{
    name: String,
    label: String,
    type: {
      type: String,
      enum: ['TEXT', 'NUMBER', 'DATE', 'EMAIL', 'URL', 'TEXTAREA', 'SELECT'],
      default: 'TEXT',
    },
    defaultValue: String,
    options: [String], // For SELECT type
    isRequired: {
      type: Boolean,
      default: false,
    },
    placeholder: String,
    description: String,
  }],
  
  // Usage statistics
  usageCount: {
    type: Number,
    default: 0,
  },
  lastUsedAt: Date,
  rating: {
    average: {
      type: Number,
      default: 0,
    },
    count: {
      type: Number,
      default: 0,
    },
    reviews: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      review: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  
  // Template preview
  previewImage: String,
  thumbnailImage: String,
  
  // Collaboration
  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    role: {
      type: String,
      enum: ['EDITOR', 'VIEWER'],
      default: 'VIEWER',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Version control
  version: {
    type: String,
    default: '1.0.0',
  },
  parentTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
  },
  changelog: [{
    version: String,
    changes: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Status
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    default: 'DRAFT',
  },
  publishedAt: Date,
  archivedAt: Date,
  
  // Timestamps
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
TemplateSchema.index({ organizationId: 1, status: 1 });
TemplateSchema.index({ userId: 1 });
TemplateSchema.index({ category: 1, isPublic: 1 });
TemplateSchema.index({ tags: 1 });
TemplateSchema.index({ 'rating.average': -1 });
TemplateSchema.index({ usageCount: -1 });

// Update updatedAt on save
TemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Ensure virtual fields are serialized
TemplateSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.models.Template || mongoose.model('Template', TemplateSchema);