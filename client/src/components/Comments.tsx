import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { commentsAPI } from '../services/api';

interface Comment {
  id: string;
  content: string;
  position?: any;
  createdAt: string;
  updatedAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

interface CommentsProps {
  proposalId: string;
  currentUser: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

const Comments: React.FC<CommentsProps> = ({ proposalId, currentUser }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Load comments
  const loadComments = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const response = await commentsAPI.getByProposal(proposalId, { page: pageNum, limit: 10 });
      
      if (response.data.success) {
        const newComments = response.data.data;
        setComments(prev => append ? [...prev, ...newComments] : newComments);
        setHasMore(response.data.pagination.page < response.data.pagination.totalPages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // Load more comments
  const loadMore = () => {
    if (!loading && hasMore) {
      loadComments(page + 1, true);
    }
  };

  // Submit new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const response = await commentsAPI.create(proposalId, { content: newComment.trim() });
      
      if (response.data.success) {
        setComments(prev => [response.data.data, ...prev]);
        setNewComment('');
        toast.success('Comment added successfully');
        
        // Scroll to top to show new comment
        if (commentsEndRef.current) {
          commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Start editing comment
  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  // Submit edited comment
  const handleSubmitEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await commentsAPI.update(commentId, { content: editContent.trim() });
      
      if (response.data.success) {
        setComments(prev => 
          prev.map(comment => 
            comment.id === commentId 
              ? { ...comment, content: editContent.trim(), updatedAt: new Date().toISOString() }
              : comment
          )
        );
        setEditingComment(null);
        setEditContent('');
        toast.success('Comment updated successfully');
      }
    } catch (error) {
      console.error('Failed to update comment:', error);
      toast.error('Failed to update comment');
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await commentsAPI.delete(commentId);
      
      if (response.data.success) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
        toast.success('Comment deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get user initials
  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get user avatar
  const getUserAvatar = (comment: Comment) => {
    if (comment.user.avatar) {
      return <img src={comment.user.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />;
    }
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
        {getUserInitials(comment.user.firstName, comment.user.lastName)}
      </div>
    );
  };

  useEffect(() => {
    loadComments();
  }, [proposalId]);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          💬 Comments ({comments.length})
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Collaborate with your team on this proposal
        </p>
      </div>

      {/* Comment Form */}
      <div className="p-6 border-b border-gray-200">
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="flex gap-3">
            {getUserAvatar({ user: currentUser } as Comment)}
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={submitting}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  Press Ctrl+Enter to submit
                </p>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="max-h-96 overflow-y-auto">
        {loading && comments.length === 0 ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {comments.map((comment) => (
              <div key={comment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex gap-3">
                  {getUserAvatar(comment)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {comment.user.firstName} {comment.user.lastName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                        {comment.updatedAt !== comment.createdAt && (
                          <span className="text-xs text-gray-400">(edited)</span>
                        )}
                      </div>
                      
                      {/* Comment Actions */}
                      <div className="flex items-center gap-2">
                        {comment.user.email === currentUser.email && (
                          <>
                            <button
                              onClick={() => handleEditComment(comment)}
                              className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Comment Content */}
                    {editingComment === comment.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSubmitEdit(comment.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-700 whitespace-pre-wrap">
                        {comment.content}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Load More */}
            {hasMore && (
              <div className="p-6 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {loading ? 'Loading...' : 'Load More Comments'}
                </button>
              </div>
            )}
            
            <div ref={commentsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Comments; 