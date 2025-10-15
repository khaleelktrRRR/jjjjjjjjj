import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, BarChart, Users, BookOpen, AlertTriangle, Search, ArrowLeft, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ReportsModalProps {
  onClose: () => void;
}

type ReportTab = 'Most Read' | 'Most Active' | 'Issued';
type TimeFilter = 'all' | 'year' | 'month' | 'week';

interface DetailView {
  type: 'book' | 'member';
  item: any;
}

const ReportsModal: React.FC<ReportsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('Most Read');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [mostRead, setMostRead] = useState<any[]>([]);
  const [mostActive, setMostActive] = useState<any[]>([]);
  const [issuedBooks, setIssuedBooks] = useState<any[]>([]);

  const [detailView, setDetailView] = useState<DetailView | null>(null);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchReportData = useCallback(async () => {
    if (detailView) return; // Don't refetch main data when in detail view

    setLoading(true);
    setError(null);
    try {
      let data, rpcError;
      switch (activeTab) {
        case 'Most Read':
          const { data: readData, error: readError } = await supabase.rpc('get_most_read_books_filtered', { time_period: timeFilter });
          data = readData;
          rpcError = readError;
          setMostRead(data || []);
          break;
        case 'Most Active':
          const { data: activeData, error: activeError } = await supabase.rpc('get_most_active_members_filtered', { time_period: timeFilter });
          data = activeData;
          rpcError = activeError;
          setMostActive(data || []);
          break;
        case 'Issued':
          const { data: issuedData, error: issuedError } = await supabase.from('circulation').select('id, due_date, books(title), members(name)').eq('status', 'issued');
          data = (issuedData || []).map((item: any) => ({
            circulation_id: item.id,
            book_title: item.books?.title || 'Unknown Book',
            member_name: item.members?.name || 'Unknown Member',
            due_date: item.due_date
          }));
          rpcError = issuedError;
          setIssuedBooks(data);
          break;
      }
      if (rpcError) throw rpcError;
    } catch (err: any) {
      console.error(`Error fetching ${activeTab} report:`, err);
      setError(err.message || `Failed to fetch ${activeTab} report.`);
    } finally {
      setLoading(false);
    }
  }, [activeTab, timeFilter, detailView]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const fetchDetailData = useCallback(async () => {
    if (!detailView) return;
    
    setDetailLoading(true);
    setError(null);
    try {
      let data, rpcError;
      if (detailView.type === 'book') {
        const { data: detail, error: detailErr } = await supabase.rpc('get_readers_of_book', { p_book_id: detailView.item.book_id });
        data = detail;
        rpcError = detailErr;
      } else { // 'member'
        const { data: detail, error: detailErr } = await supabase.rpc('get_books_read_by_member', { p_member_id: detailView.item.member_id });
        data = detail;
        rpcError = detailErr;
      }
      if (rpcError) throw rpcError;
      setDetailData(data || []);
    } catch (err: any) {
      console.error('Error fetching detail data:', err);
      setError(err.message || 'Failed to fetch details.');
    } finally {
      setDetailLoading(false);
    }
  }, [detailView]);

  useEffect(() => {
    fetchDetailData();
  }, [fetchDetailData]);

  const handleItemClick = (type: 'book' | 'member', item: any) => {
    setDetailView({ type, item });
  };
  
  const handleBack = () => {
    setDetailView(null);
    setDetailData([]);
    setError(null);
    setSearchTerm('');
  };

  const EmptyState = ({ icon: Icon, message }: { icon: React.ElementType, message: string }) => (
    <div className="text-center text-gray-500 py-10 flex flex-col items-center h-full justify-center">
      <Icon className="w-12 h-12 text-gray-300 mb-4" />
      <p>{message}</p>
    </div>
  );

  const filterData = (data: any[]) => {
    if (!searchTerm) return data;
    const lowerSearch = searchTerm.toLowerCase();

    if (activeTab === 'Most Read' || (detailView?.type === 'member')) {
      return data.filter(item => item.title?.toLowerCase().includes(lowerSearch) || item.author?.toLowerCase().includes(lowerSearch));
    }
    if (activeTab === 'Most Active' || (detailView?.type === 'book')) {
      return data.filter(item => item.name?.toLowerCase().includes(lowerSearch) || item.email?.toLowerCase().includes(lowerSearch));
    }
    if (activeTab === 'Issued') {
      return data.filter(item => item.book_title?.toLowerCase().includes(lowerSearch) || item.member_name?.toLowerCase().includes(lowerSearch));
    }
    return data;
  };
  
  const renderListView = () => {
    let data, emptyIcon, emptyMessage;
    switch (activeTab) {
      case 'Most Read':
        data = mostRead; emptyIcon = BarChart; emptyMessage = "No borrowing data available for this period.";
        break;
      case 'Most Active':
        data = mostActive; emptyIcon = Users; emptyMessage = "No active readers found for this period.";
        break;
      case 'Issued':
        data = issuedBooks; emptyIcon = BookOpen; emptyMessage = "No books are currently issued.";
        break;
    }

    const filteredData = filterData(data);

    if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-purple-600" size={32} /></div>;
    if (error) return <div className="text-center text-red-600 py-10 flex flex-col items-center"><AlertTriangle className="w-12 h-12 text-red-400 mb-4" /><p className="font-semibold">An Error Occurred</p><p className="text-sm">{error}</p></div>;
    if (filteredData.length === 0) return <EmptyState icon={emptyIcon} message={searchTerm ? "No results match your search." : emptyMessage} />;

    return (
      <ul className="space-y-3">
        {filteredData.map((item, index) => {
          if (activeTab === 'Most Read') {
            return (
              <li key={item.book_id || index} onClick={() => handleItemClick('book', item)} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors cursor-pointer">
                <div className="flex items-center gap-4"><span className="text-sm font-bold text-purple-600 w-6 text-center">{index + 1}</span><div><p className="font-semibold">{item.title}</p><p className="text-sm text-gray-500">by {item.author}</p></div></div><p className="font-bold text-purple-600">{item.read_count} reads</p>
              </li>
            );
          }
          if (activeTab === 'Most Active') {
            return (
              <li key={item.member_id || index} onClick={() => handleItemClick('member', item)} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors cursor-pointer">
                <div className="flex items-center gap-4"><span className="text-sm font-bold text-purple-600 w-6 text-center">{index + 1}</span><div><p className="font-semibold">{item.name}</p><p className="text-sm text-gray-500">{item.email}</p></div></div><p className="font-bold text-purple-600">{item.book_count} books</p>
              </li>
            );
          }
          if (activeTab === 'Issued') {
            return (
              <li key={item.circulation_id || index} className="p-3 bg-gray-50 rounded-md">
                <p className="font-semibold">{item.book_title}</p><p className="text-sm text-gray-600">Borrowed by: {item.member_name}</p><p className={`text-sm ${new Date(item.due_date) < new Date() ? 'text-red-500 font-medium' : 'text-gray-500'}`}>Due: {new Date(item.due_date).toLocaleDateString()}</p>
              </li>
            );
          }
          return null;
        })}
      </ul>
    );
  };

  const renderDetailView = () => {
    if (!detailView) return null;
    const filteredDetailData = filterData(detailData);

    if (detailLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-purple-600" size={32} /></div>;
    if (error) return <div className="text-center text-red-600 py-10 flex flex-col items-center"><AlertTriangle className="w-12 h-12 text-red-400 mb-4" /><p className="font-semibold">An Error Occurred</p><p className="text-sm">{error}</p></div>;
    if (filteredDetailData.length === 0) return <EmptyState icon={Users} message={searchTerm ? "No results match your search." : "No data found."} />;

    return (
      <ul className="space-y-3">
        {filteredDetailData.map((item, index) => (
          <li key={item.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            {detailView.type === 'book' ? (
              <div><p className="font-semibold">{item.name}</p><p className="text-sm text-gray-500">{item.email}</p></div>
            ) : (
              <div><p className="font-semibold">{item.title}</p><p className="text-sm text-gray-500">by {item.author}</p></div>
            )}
            <p className="text-sm text-gray-500">Read on: {new Date(item.read_date).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Library Reports</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        
        {!detailView && (
          <div className="border-b border-gray-200">
            <nav className="flex gap-4 px-6">
              {(['Most Read', 'Most Active', 'Issued'] as ReportTab[]).map(tab => (
                <button key={tab} onClick={() => { setActiveTab(tab); setSearchTerm(''); }} className={`py-3 px-1 font-medium text-sm transition-colors ${activeTab === tab ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>{tab}</button>
              ))}
            </nav>
          </div>
        )}

        <div className="p-6 flex-grow overflow-y-auto">
          {detailView ? (
            <div className="space-y-4">
              <button onClick={handleBack} className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800"><ArrowLeft size={16} /> Back to Reports</button>
              <h3 className="text-lg font-bold">{detailView.type === 'book' ? `Readers of "${detailView.item.title}"` : `Books read by ${detailView.item.name}`}</h3>
            </div>
          ) : null}

          <div className="flex flex-col md:flex-row justify-between items-center my-4 gap-4">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input type="text" placeholder="Search in results..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"/>
            </div>
            {activeTab !== 'Issued' && !detailView && (
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <Calendar size={16} className="text-gray-500 ml-1" />
                {(['all', 'year', 'month', 'week'] as TimeFilter[]).map(filter => (
                  <button key={filter} onClick={() => setTimeFilter(filter)} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${timeFilter === filter ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>{filter.charAt(0).toUpperCase() + filter.slice(1)}</button>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-4">
            {detailView ? renderDetailView() : renderListView()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsModal;
