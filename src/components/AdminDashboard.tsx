import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Bell, LogOut, Search, Plus, Edit, Trash2, Star, Folder } from 'lucide-react';
import { supabase, type Book, type Circulation, type Member, type Feedback, type Category } from '../lib/supabase';
import MemberModal from './MemberModal';
import IssueBookModal from './IssueBookModal';
import AddBookForm from './AddBookForm';
import ManageCategoriesForm from './ManageCategoriesForm';

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabType = 'Circulation' | 'Library' | 'Members' | 'Feedback' | 'History';
type BookStatusFilter = 'Available' | 'Issued' | 'Overdue';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('Circulation');
  const [activeFilter, setActiveFilter] = useState<BookStatusFilter>('Available');
  const [circulationSearch, setCirculationSearch] = useState('');
  
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [circulation, setCirculation] = useState<Circulation[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ available: 0, issued: 0, overdue: 0 });

  // Modal states
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const tabs: TabType[] = ['Circulation', 'Library', 'Members', 'Feedback', 'History'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: booksData },
        { data: membersData },
        { data: circulationData },
        { data: feedbackData },
        { data: categoriesData }
      ] = await Promise.all([
        supabase.from('books').select('*, categories(name)').order('title'),
        supabase.from('members').select('*').order('name'),
        supabase.from('circulation').select('*, books(*), members(*)').order('updated_at', { ascending: false }),
        supabase.from('feedback').select('*, members(name), books(title)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name')
      ]);

      setBooks(booksData || []);
      setMembers(membersData || []);
      setCirculation(circulationData || []);
      setFeedback(feedbackData || []);
      setCategories(categoriesData || []);

      const availableCount = booksData?.reduce((sum, book) => sum + book.available_copies, 0) || 0;
      const issuedCount = circulationData?.filter(c => c.status === 'issued').length || 0;
      const overdueCount = circulationData?.filter(c => c.status === 'issued' && new Date(c.due_date) < new Date()).length || 0;

      setCounts({ available: availableCount, issued: issuedCount, overdue: overdueCount });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const handleDeleteMember = async (memberId: string) => {
    if (window.confirm('Are you sure? This will delete the member and all associated records.')) {
      await supabase.from('members').delete().eq('id', memberId);
    }
  };

  const handleReturnBook = async (circulationId: string) => {
    const { error } = await supabase.rpc('return_book', { p_circulation_id: circulationId });
    if (error) alert('Error returning book.');
  };
  
  const updateFeedbackStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('feedback').update({ status }).eq('id', id);
    if (error) alert('Failed to update feedback status.');
  };

  const getCirculationData = () => {
    let data: (Book | Circulation)[] = [];
    switch (activeFilter) {
      case 'Available': data = books.filter(b => b.available_copies > 0); break;
      case 'Issued': data = circulation.filter(c => c.status === 'issued'); break;
      case 'Overdue': data = circulation.filter(c => c.status === 'issued' && new Date(c.due_date) < new Date()); break;
    }
    if (!circulationSearch) return data;
    const lowerSearch = circulationSearch.toLowerCase();
    return data.filter(item => {
      if ('title' in item) {
        return item.title.toLowerCase().includes(lowerSearch) || item.author.toLowerCase().includes(lowerSearch);
      }
      if ('book_id' in item) {
        return item.books?.title.toLowerCase().includes(lowerSearch) || item.members?.name.toLowerCase().includes(lowerSearch);
      }
      return false;
    });
  };

  const circulationData = getCirculationData();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900"><BarChart3 size={20} /></button>
              <button className="text-gray-600 hover:text-gray-900"><Bell size={20} /></button>
              <button onClick={onLogout} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <LogOut size={20} /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-2 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'Circulation' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Borrow & Return Books</h2>
              <button onClick={() => setShowIssueModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus size={20} /> Issue Book
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['Available', 'Issued', 'Overdue'] as BookStatusFilter[]).map(filter => (
                <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-4 py-2 rounded-lg font-medium ${activeFilter === filter ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>
                  {filter} ({counts[filter.toLowerCase() as keyof typeof counts]})
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input type="text" placeholder="Search books, members..." value={circulationSearch} onChange={(e) => setCirculationSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"/>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6 min-h-[400px]">
              {loading ? <p>Loading...</p> : (
                <div className="space-y-4">
                  {circulationData.map((item: any) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      {activeFilter === 'Available' ? (
                        <div><h3 className="font-semibold">{item.title}</h3><p>by {item.author}</p><p>Available: {item.available_copies}</p></div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div><h3 className="font-semibold">{item.books?.title}</h3><p>by {item.members?.name}</p><p>Due: {new Date(item.due_date).toLocaleDateString()}</p></div>
                          <button onClick={() => handleReturnBook(item.id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Return</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Library' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <AddBookForm categories={categories} onSave={fetchData} />
            </div>
            <div className="lg:col-span-2">
              <ManageCategoriesForm onSave={fetchData} />
            </div>
          </div>
        )}

        {activeTab === 'Members' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Library Members</h2>
              <button onClick={() => setShowMemberModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={20} /> Add Member</button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {loading ? <p>Loading...</p> : (
                <div className="space-y-4">
                  {members.map(member => (
                    <div key={member.id} className="border rounded-lg p-4 flex justify-between items-start">
                      <div><h3 className="font-semibold">{member.name}</h3><p>{member.email}</p></div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingMember(member); setShowMemberModal(true); }}><Edit size={18} /></button>
                        <button onClick={() => handleDeleteMember(member.id)}><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Feedback' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Feedback & Suggestions</h2>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {loading ? <p>Loading...</p> : feedback.length > 0 ? (
                <div className="space-y-4">
                  {feedback.map(item => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          {item.feedback_type === 'suggestion' ? (
                            <h3 className="font-semibold text-lg">Suggestion: "{item.suggestion_title}"</h3>
                          ) : (
                            <h3 className="font-semibold text-lg">Review for: "{item.books?.title}"</h3>
                          )}
                          <p className="text-sm text-gray-500">By: {item.members?.name || 'Unknown'}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : item.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.status}</span>
                      </div>
                      {item.feedback_type === 'book_review' && item.rating && (
                        <div className="flex items-center gap-1 mt-2">
                          {[...Array(5)].map((_, i) => (<Star key={i} size={16} className={i < item.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'} />))}
                        </div>
                      )}
                      {item.review && <p className="mt-2 text-gray-700">{item.review}</p>}
                      {item.suggestion_reason && <p className="mt-2 text-gray-700">{item.suggestion_reason}</p>}
                      {item.status === 'pending' && (
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => updateFeedbackStatus(item.id, 'approved')} className="text-sm bg-green-600 text-white px-3 py-1 rounded">Approve</button>
                          <button onClick={() => updateFeedbackStatus(item.id, 'rejected')} className="text-sm bg-red-600 text-white px-3 py-1 rounded">Reject</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-10"><Folder size={40} className="mx-auto text-gray-300" /><p className="mt-2 text-gray-500">No feedback submitted yet.</p></div>}
            </div>
          </div>
        )}

        {activeTab === 'History' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Circulation History</h2>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {loading ? <p>Loading...</p> : circulation.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {circulation.map(item => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.books?.title || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.members?.name || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'returned' ? 'bg-green-100 text-green-800' : item.status === 'issued' ? 'bg-blue-100 text-blue-800' : item.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{item.status}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.issue_date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.return_date ? new Date(item.return_date).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="text-center py-10"><Folder size={40} className="mx-auto text-gray-300" /><p className="mt-2 text-gray-500">No circulation history yet.</p></div>}
            </div>
          </div>
        )}
      </main>

      {showMemberModal && <MemberModal member={editingMember} onClose={() => { setShowMemberModal(false); setEditingMember(null); }} onSave={() => { setShowMemberModal(false); setEditingMember(null); }} />}
      {showIssueModal && <IssueBookModal onClose={() => setShowIssueModal(false)} onSave={() => setShowIssueModal(false)} />}
    </div>
  );
};

export default AdminDashboard;
