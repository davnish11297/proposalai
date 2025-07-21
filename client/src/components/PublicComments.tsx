import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  ChatBubbleLeftIcon, 
  UserIcon, 
  CalendarIcon, 
  PaperAirplaneIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
    email: string;
  };
}

interface PublicCommentsProps {
  proposalId: string;
  accessCode: string;
  className?: string;
}

// Generate avatar initials from name or email
const getAvatarInitials = (name: string, email: string): string => {
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

export default function PublicComments({ proposalId, accessCode, className = '' }: PublicCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      // Use direct backend URL since proxy is having issues
      const response = await fetch(`http://localhost:3001/api/public/proposals/${proposalId}/comments?accessCode=${accessCode}`);
      const data = await response.json();
      
      if (data.success) {
        setComments(data.data);
      } else {
        console.error('Failed to fetch comments:', data.error);
        toast.error('Failed to load comments');
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [proposalId, accessCode]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !authorName.trim() || !authorEmail.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      // Use direct backend URL since proxy is having issues
      const response = await fetch(`http://localhost:3001/api/public/proposals/${proposalId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessCode,
          content: newComment.trim(),
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setNewComment('');
        fetchComments();
        toast.success('Comment added successfully');
      } else {
        throw new Error(data.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(authorEmail || 'guest')}`}>
                {getAvatarInitials(authorName, authorEmail || 'guest')}
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Your name"
                  className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  disabled={submitting}
                  required
                />
                <input
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="Your email"
                  className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  disabled={submitting}
                  required
                />
              </div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                rows={3}
                disabled={submitting}
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim() || !authorName.trim() || !authorEmail.trim() || submitting}
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
            const avatarColor = getAvatarColor(comment.author.email);
            const initials = getAvatarInitials(comment.author.name, comment.author.email);
            
            return (
              <div key={comment.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${avatarColor}`}>
                      {initials}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900 truncate">
                        {comment.author.name || comment.author.email.split('@')[0]}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        <BuildingOfficeIcon className="h-3 w-3" />
                        Client
                      </span>
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
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 