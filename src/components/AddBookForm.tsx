import React, { useState } from 'react';
import { supabase, type Category, type Book } from '../lib/supabase';

interface AddBookFormProps {
  categories: Category[];
  onSave: () => void;
}

const AddBookForm: React.FC<AddBookFormProps> = ({ categories, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category_id: '',
    language: '' as Book['language'],
    price: '0',
    publisher: '',
    ddc_number: '',
    total_copies: 1,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bookData = {
        title: formData.title,
        author: formData.author,
        category_id: formData.category_id || null,
        language: formData.language || null,
        price: formData.price ? parseFloat(formData.price) : 0,
        publisher: formData.publisher,
        ddc_number: formData.ddc_number,
        total_copies: formData.total_copies,
        available_copies: formData.total_copies,
        status: 'available' as const,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('books').insert(bookData);
      if (error) throw error;

      alert('Book added successfully!');
      setFormData({
        title: '', author: '', category_id: '', language: '', price: '0', publisher: '', ddc_number: '', total_copies: 1,
      });
      onSave();
    } catch (error) {
      console.error('Error saving book:', error);
      alert('Error saving book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Add New Book</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Book Title</label>
          <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" placeholder="Enter book title" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author Name</label>
            <input type="text" required value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" placeholder="Enter author's name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Book Category</label>
            <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-purple-500 focus:border-purple-500">
              <option value="">Select a category...</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <select value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value as Book['language'] })} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-purple-500 focus:border-purple-500">
              <option value="">Select a language</option>
              <option>English</option>
              <option>Kannada</option>
              <option>Malayalam</option>
              <option>Urdu</option>
              <option>Arabic</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Book Price (₹)</label>
            <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" placeholder="0" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Publisher Name</label>
            <input type="text" value={formData.publisher} onChange={(e) => setFormData({ ...formData, publisher: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" placeholder="Enter publisher name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DDC</label>
            <input type="text" value={formData.ddc_number} onChange={(e) => setFormData({ ...formData, ddc_number: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" placeholder="e.g. 813.6" />
          </div>
        </div>
        <div className="pt-2">
          <button type="submit" disabled={loading} className="w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-md disabled:opacity-50 hover:bg-purple-700 transition-colors">
            {loading ? 'Adding...' : 'Add Book'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBookForm;
