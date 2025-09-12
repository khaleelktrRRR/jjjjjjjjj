import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase, type Circulation } from '../lib/supabase';

interface ReportsModalProps {
  onClose: () => void;
}

type ReportTab = 'Most Read' | 'Most Active' | 'Issued';

const ReportsModal: React.FC<ReportsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('Most Read');
  const [loading, setLoading] = useState(true);
  const [mostRead, setMostRead] = useState<any[]>([]);
  const [mostActive, setMostActive] = useState<any[]>([]);
  const [issuedBooks, setIssuedBooks] = useState<any[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        // Step 1: Fetch all circulation records
        const { data: circulationData, error: circError } = await supabase
          .from('circulation')
          .select('id, book_id, member_id, status, due_date');
        
        if (circError) throw circError;
        if (!circulationData) return;

        // Step 2: Get unique IDs and fetch related book and member data
        const bookIds = [...new Set(circulationData.map(c => c.book_id).filter(Boolean))];
        const memberIds = [...new Set(circulationData.map(c => c.member_id).filter(Boolean))];

        const { data: booksData } = await supabase.from('books').select('id, title, author').in('id', bookIds);
        const { data: membersData } = await supabase.from('members').select('id, name, email').in('id', memberIds);

        const booksMap = new Map(booksData?.map(b => [b.id, b]));
        const membersMap = new Map(membersData?.map(m => [m.id, m]));

        // --- Calculate Most Read Books ---
        const readCounts = circulationData.reduce((acc, curr) => {
          if (curr.book_id) {
            acc[curr.book_id] = (acc[curr.book_id] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const mostReadData = Object.entries(readCounts)
          .map(([book_id, count]) => {
            const bookInfo = booksMap.get(book_id);
            return {
              id: book_id, // Use book_id as the unique key
              title: bookInfo?.title || 'Unknown Book (Deleted)',
              author: bookInfo?.author || 'N/A',
              count,
            };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        setMostRead(mostReadData);

        // --- Calculate Most Active Readers ---
        const activeCounts = circulationData.reduce((acc, curr) => {
          if (curr.member_id) {
            acc[curr.member_id] = (acc[curr.member_id] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const mostActiveData = Object.entries(activeCounts)
          .map(([member_id, count]) => {
            const memberInfo = membersMap.get(member_id);
            return {
              id: member_id, // Use member_id as the unique key
              name: memberInfo?.name || 'Unknown Member (Deleted)',
              email: memberInfo?.email || '',
              count,
            };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        setMostActive(mostActiveData);

        // --- Get Currently Issued Books ---
        const issuedBooksData = circulationData
          .filter(c => c.status === 'issued')
          .map(c => ({
            ...c,
            books: booksMap.get(c.book_id),
            members: membersMap.get(c.member_id),
          }));
        setIssuedBooks(issuedBooksData);

      } catch (error) {
        console.error('Error fetching reports:', error);
        alert('Failed to fetch reports.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>;
    }

    switch (activeTab) {
      case 'Most Read':
        return mostRead.length > 0 ? (
          <ul className="space-y-3">
            {mostRead.map((book, index) => (
              <li key={book.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="font-semibold">{index + 1}. {book.title}</p>
                  <p className="text-sm text-gray-500">by {book.author}</p>
                </div>
                <p className="font-bold text-purple-600">{book.count} borrows</p>
              </li>
            ))}
          </ul>
        ) : <p className="text-center text-gray-500 py-10">No borrowing data available.</p>;
      
      case 'Most Active':
        return mostActive.length > 0 ? (
          <ul className="space-y-3">
            {mostActive.map((member, index) => (
              <li key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="font-semibold">{index + 1}. {member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <p className="font-bold text-purple-600">{member.count} borrows</p>
              </li>
            ))}
          </ul>
        ) : <p className="text-center text-gray-500 py-10">No active readers found.</p>;

      case 'Issued':
        return issuedBooks.length > 0 ? (
          <ul className="space-y-3">
            {issuedBooks.map(item => (
              <li key={item.id} className="p-3 bg-gray-50 rounded-md">
                <p className="font-semibold">{item.books?.title || 'Unknown Book'}</p>
                <p className="text-sm text-gray-600">Borrowed by: {item.members?.name || 'Unknown Member'}</p>
                <p className="text-sm text-gray-500">Due: {new Date(item.due_date).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        ) : <p className="text-center text-gray-500 py-10">No books are currently issued.</p>;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Library Reports</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <div className="border-b border-gray-200">
          <nav className="flex gap-4 px-6">
            {(['Most Read', 'Most Active', 'Issued'] as ReportTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 font-medium text-sm transition-colors ${
                  activeTab === tab ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ReportsModal;
