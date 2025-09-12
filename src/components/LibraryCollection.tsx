import React, { useState, useEffect } from 'react';
import { Search, Download, BookOpen } from 'lucide-react';
import { supabase, type Book } from '../lib/supabase';

const LibraryCollection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      const { data } = await supabase.from('books').select('*, categories(name)').order('title');
      setBooks(data || []);
      setLoading(false);
    };

    fetchBooks();

    const channel = supabase.channel('public:books')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, fetchBooks)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.isbn?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-neutral-900">Library Collection</h2>
        <button className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Download size={20} />
          <span>Export / Print</span>
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
        <input
          type="text"
          placeholder="Search by title, author, or ISBN..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-neutral-500">Loading books...</div>
      ) : filteredBooks.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-16">
                  Sl. No.
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Author
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  ISBN
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredBooks.map((book, index) => (
                <tr key={book.id} className="hover:bg-neutral-50 transition-colors duration-150">
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-900">{book.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-600">{book.author}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-light/10 text-primary">
                      {book.categories?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {book.isbn || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <BookOpen size={48} className="text-neutral-300 mb-4" />
          <p className="text-neutral-500 text-lg">
            {searchQuery ? 'No books match your search.' : 'No books available in the library.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default LibraryCollection;
