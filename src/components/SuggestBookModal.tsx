import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SearchableSelect from './SearchableSelect';

interface SuggestBookModalProps {
  onClose: () => void;
}

const SuggestBookModal: React.FC<SuggestBookModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    member_id: '',
    suggestion_title: '',
    suggestion_author: '',
    suggestion_reason: ''
  });
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.member_id) {
      alert('Please select a member.');
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.from('feedback').insert({
        ...formData,
        feedback_type: 'suggestion',
        status: 'pending'
      });

      if (error) throw error;

      alert('Thank you! Your suggestion has been submitted.');
      onClose();
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      alert('Failed to submit suggestion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Suggest a Book</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Book Title *</label>
            <input
              type="text"
              required
              value={formData.suggestion_title}
              onChange={(e) => setFormData({ ...formData, suggestion_title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
            <input
              type="text"
              value={formData.suggestion_author}
              onChange={(e) => setFormData({ ...formData, suggestion_author: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Suggestion</label>
            <textarea
              rows={3}
              value={formData.suggestion_reason}
              onChange={(e) => setFormData({ ...formData, suggestion_reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-md">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Suggestion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuggestBookModal;
