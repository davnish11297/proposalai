import React, { useState, useEffect } from 'react';
import { commentsAPI } from '../services/api';
import { 
  ChatBubbleLeftIcon, 
  PaperAirplaneIcon, 
  TrashIcon, 
  PencilIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    name: string | null;
    email: string;
  };
}

interface CommentsProps {
  proposalId: string;
  className?: string;
  onCommentsLoaded?: () => void;
  currentUserEmail?: string; // To identify if comment is from current user
}

// Generate avatar initials from name or email
const getAvatarInitials = (name: string | null, email: string): string => {
  if (name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  return email.split('@')[0].slice(0, 2).toUpperCase();
};

// Generate avatar color based on string
const getAvatarColor = (str: string): string => {
  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-teal-500'
  ];
  const index = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

// Check if user is a public user (client)
const isPublicUser = (email: string): boolean => {
  return email.includes('@example.com') || email.includes('test.com') || email.includes('localhost');
};

export default function Comments({ proposalId, className = '', onCommentsLoaded, currentUserEmail }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchComments();
  }, [proposalId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await commentsAPI.getByProposal(proposalId);
      setComments(response.data.data);
      onCommentsLoaded?.();
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      await commentsAPI.create(proposalId, { content: newComment.trim() });
      setNewComment('');
      fetchComments();
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await commentsAPI.update(commentId, { content: editContent.trim() });
      setEditingId(null);
      setEditContent('');
      fetchComments();
      toast.success('Comment updated successfully');
    } catch (error) {
      console.error('Failed to update comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsAPI.delete(commentId);
      fetchComments();
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <ChatBubbleLeftIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Comments</h3>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <ChatBubbleLeftIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Comments</h3>
          <p className="text-sm text-gray-500">{comments.length} comment{comments.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Add new comment */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(currentUserEmail || 'user')}`}>
                {getAvatarInitials(null, currentUserEmail || 'user')}
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                rows={3}
                disabled={submitting}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <PaperAirplaneIcon className="h-4 w-4" />
                  )}
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <ChatBubbleLeftIcon className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-400">No comments yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to start the conversation!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isPublic = isPublicUser(comment.author.email);
            const isCurrentUser = currentUserEmail === comment.author.email;
            const avatarColor = getAvatarColor(comment.author.email);
            const initials = getAvatarInitials(comment.author.name, comment.author.email);
            
            return (
              <div key={comment.id} className="group">
                {editingId === comment.id ? (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${avatarColor}`}>
                          {initials}
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(comment.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 font-medium transition-colors"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${avatarColor}`}>
                          {initials}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-gray-900 truncate">
                              {comment.author.name || comment.author.email.split('@')[0]}
                            </span>
                            {isPublic && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                <UserIcon className="h-3 w-3" />
                                Client
                              </span>
                            )}
                            {isCurrentUser && !isPublic && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                <CheckCircleIcon className="h-3 w-3" />
                                You
                              </span>
                            )}
                            <span className="text-gray-400">•</span>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <CalendarIcon className="h-3 w-3" />
                              {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          {/* Only show edit/delete buttons for current user's comments */}
                          {isCurrentUser && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEdit(comment)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit your comment"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(comment.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete your comment"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          {/* Show info for client comments that can't be edited */}
                          {isPublic && !isCurrentUser && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs text-gray-400 px-2 py-1 bg-gray-50 rounded" title="Client comments cannot be edited">
                                Client Comment
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 