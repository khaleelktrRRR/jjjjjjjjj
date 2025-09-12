import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SearchableSelect from './SearchableSelect';

interface WriteReviewModalProps {
  onClose: () => void;
}

const WriteReviewModal: React.FC<WriteReviewModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    member_id: '',
    book_id: '',
    rating: 0,
    review: ''
  });
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.member_id || !formData.book_id || formData.rating === 0) {
      alert('Please fill all required fields and provide a rating.');
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.from('feedback').insert({
        ...formData,
        feedback_type: 'book_review',
        status: 'pending'
      });

      if (error) throw error;

      alert('Thank you! Your review has been submitted.');
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Write a Review</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Member *</label>
            <SearchableSelect
              value={selectedMember}
              onChange={(option: any) => {
                setSelectedMember(option);
                setFormData({ ...formData, member_id: option ? option.value : '' });
              }}
              placeholder="Search for a member..."
              tableName="members"
              labelField="name"
              searchFields={['name', 'email']}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Book *</label>
            <SearchableSelect
              value={selectedBook}
              onChange={(option: any) => {
                setSelectedBook(option);
                setFormData({ ...formData, book_id: option ? option.value : '' });
              }}
              placeholder="Search for a book..."
              tableName="books"
              labelField="title"
              searchFields={['title', 'author']}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating *</label>
            <div className="flex">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="focus:outline-none"
                >
                  <Star
                    size={28}
                    className={`transition-colors ${
                      star <= formData.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
            <textarea
              rows={4}
              value={formData.review}
              onChange={(e) => setFormData({ ...formData, review: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-md">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WriteReviewModal;
