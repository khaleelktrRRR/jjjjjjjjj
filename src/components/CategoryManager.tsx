import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { supabase, type Category } from '../lib/supabase';

interface CategoryManagerProps {
  onClose: () => void;
  onSave: () => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ onClose, onSave }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) {
      setError('Failed to load categories.');
      console.error(error);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    const { error: rpcError } = await supabase.rpc('add_category', { p_name: newCategory.trim() });
    
    if (rpcError) {
      alert(`Error adding category: ${rpcError.message}`);
    } else {
      setNewCategory('');
      fetchCategories(); // Refetch to get the new list
      onSave();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure? This might affect existing books.')) {
      const { error: rpcError } = await supabase.rpc('delete_category', { p_id: id });
      
      if (rpcError) {
        alert(`Error deleting category: ${rpcError.message}. It might be in use.`);
      } else {
        fetchCategories(); // Refetch to update the list
        onSave();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Manage Categories</h2>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="p-6 space-y-4">
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name"
              className="flex-grow px-3 py-2 border rounded-md"
            />
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-md flex items-center gap-2">
              <Plus size={18} /> Add
            </button>
          </form>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {loading ? <p>Loading...</p> : categories.map(cat => (
              <div key={cat.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                <span>{cat.name}</span>
                <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
