import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Folder, Loader2 } from 'lucide-react';
import { supabase, type Category } from '../lib/supabase';

interface ManageCategoriesFormProps {
  onSave: () => void;
}

const ManageCategoriesForm: React.FC<ManageCategoriesFormProps> = ({ onSave }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchCategories();
    
    const channel = supabase.channel('public:categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchCategories)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const { error: rpcError } = await supabase.rpc('add_category', { p_name: newCategory.trim() });
    
    if (rpcError) {
      alert(`Error adding category: ${rpcError.message}`);
    } else {
      setNewCategory('');
      onSave();
    }
    setIsSubmitting(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure? This might affect existing books.')) {
      const { error: rpcError } = await supabase.rpc('delete_category', { p_id: id });
      
      if (rpcError) {
        alert(`Error deleting category: ${rpcError.message}. It might be in use.`);
      } else {
        onSave();
      }
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 h-full flex flex-col">
      <h3 className="text-2xl font-bold text-neutral-800 mb-6">Manage Categories</h3>
      <div className="space-y-6 flex-grow flex flex-col">
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Add new category"
            className="flex-grow px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light"
          />
          <button type="submit" disabled={isSubmitting || !newCategory.trim()} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed">
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            <span>Add</span>
          </button>
        </form>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light"
          />
        </div>
        
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex-grow overflow-y-auto space-y-2 pr-2 -mr-2">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : filteredCategories.length > 0 ? filteredCategories.map(cat => (
            <div key={cat.id} className="flex justify-between items-center p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors">
              <span className="text-neutral-700 font-medium">{cat.name}</span>
              <button onClick={() => handleDeleteCategory(cat.id)} className="text-neutral-400 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          )) : (
            <div className="text-center py-10 h-full flex flex-col justify-center items-center">
              <Folder size={40} className="mx-auto text-neutral-300" />
              <p className="mt-2 text-neutral-500">
                {searchQuery ? 'No categories match your search.' : 'No categories available.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageCategoriesForm;
