import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase, type Book, type Category } from '../lib/supabase';

interface BookModalProps {
  book?: Book | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}

const BookModal: React.FC<BookModalProps> = ({ book, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category_id: '',
    language: 'English' as Book['language'],
    price: '',
    publisher: '',
    isbn: '',
    ddc_number: '',
    publication_year: '',
    total_copies: 1,
    available_copies: 1
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        author: book.author,
        category_id: book.category_id || '',
        language: book.language || 'English',
        price: book.price?.toString() || '',
        publisher: book.publisher || '',
        isbn: book.isbn || '',
        ddc_number: book.ddc_number || '',
        publication_year: book.publication_year?.toString() || '',
        total_copies: book.total_copies,
        available_copies: book.available_copies
      });
    }
  }, [book]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bookData = {
        ...formData,
        publication_year: formData.publication_year ? parseInt(formData.publication_year) : null,
        price: formData.price ? parseFloat(formData.price) : null,
        category_id: formData.category_id || null,
        updated_at: new Date().toISOString()
      };

      if (book) {
        const { error } = await supabase.from('books').update(bookData).eq('id', book.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('books').insert({ ...bookData, created_at: new Date().toISOString() });
        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving book:', error);
      alert('Error saving book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">{book ? 'Edit Book' : 'Add New Book'}</h2>
          <button onClick={onClose}><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Book Title *</label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Author Name *</label>
              <input type="text" required value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Book Category</label>
              <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="w-full px-3 py-2 border rounded-md">
                <option value="">Select a category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value as Book['language'] })} className="w-full px-3 py-2 border rounded-md">
                <option>English</option>
                <option>Kannada</option>
                <option>Malayalam</option>
                <option>Urdu</option>
                <option>Arabic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Book Price</label>
              <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publisher Name</label>
              <input type="text" value={formData.publisher} onChange={(e) => setFormData({ ...formData, publisher: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
              <input type="text" value={formData.isbn} onChange={(e) => setFormData({ ...formData, isbn: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DDC Number</label>
              <input type="text" value={formData.ddc_number} onChange={(e) => setFormData({ ...formData, ddc_number: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publication Year</label>
              <input type="number" value={formData.publication_year} onChange={(e) => setFormData({ ...formData, publication_year: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Copies *</label>
              <input type="number" min="1" required value={formData.total_copies} onChange={(e) => setFormData({ ...formData, total_copies: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 border rounded-md" />
            </div>
            {book && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Copies *</label>
                <input type="number" min="0" max={formData.total_copies} required value={formData.available_copies} onChange={(e) => setFormData({ ...formData, available_copies: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-md" />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-md">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookModal;
