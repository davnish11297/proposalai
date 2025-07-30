import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  proposalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal',
    required: true,
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
  // Comment threading
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  },
  threadDepth: {
    type: Number,
    default: 0,
  },
  // Comment type and context
  type: {
    type: String,
    enum: ['COMMENT', 'SUGGESTION', 'APPROVAL', 'REJECTION', 'QUESTION'],
    default: 'COMMENT',
  },
  context: {
    section: String, // Which section of the proposal
    paragraph: Number, // Which paragraph
    selection: {
      start: Number,
      end: Number,
      text: String,
    },
  },
  // Status and resolution
  status: {
    type: String,
    enum: ['OPEN', 'RESOLVED', 'DISMISSED'],
    default: 'OPEN',
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolvedAt: Date,
  resolution: String,
  // Visibility and permissions
  isPrivate: {
    type: Boolean,
    default: false,
  },
  visibleTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  // Attachments and mentions
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  // Reactions and engagement
  reactions: [{
    type: {
      type: String,
      enum: ['LIKE', 'DISLIKE', 'AGREE', 'DISAGREE', 'QUESTION', 'IMPORTANT'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // Edit history
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now,
    },
    editReason: String,
  }],
  // Metadata
  isEdited: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Analytics
  viewCount: {
    type: Number,
    default: 0,
  },
  lastViewedAt: Date,
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

// Indexes for performance
CommentSchema.index({ proposalId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1 });
CommentSchema.index({ parentCommentId: 1 });
CommentSchema.index({ status: 1 });
CommentSchema.index({ isDeleted: 1 });

// Update updatedAt on save
CommentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for reply count
CommentSchema.virtual('replyCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentCommentId',
  count: true,
});

// Virtual for reaction counts
CommentSchema.virtual('reactionCounts').get(function() {
  const counts = {};
  this.reactions?.forEach(reaction => {
    counts[reaction.type] = (counts[reaction.type] || 0) + 1;
  });
  return counts;
});

// Ensure virtual fields are serialized
CommentSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.models.Comment || mongoose.model('Comment', CommentSchema);