import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Package, ArrowLeftRight, ClipboardList, XCircle, BarChart2, Menu, X } from 'lucide-react';
import { fetchLogisticsData } from './api/googleSheetService';
import DashboardStats from './components/DashboardStats';
import FilterBar from './components/FilterBar';
import OrderTable from './components/OrderTable';
import ReportChart, { ProductivityChart } from './components/ReportChart';
import ReturnOrderReport from './components/ReturnOrderReport';
import InventoryReport from './components/InventoryReport';
import CancelledOrderReport from './components/CancelledOrderReport';
import ComparisonReport from './components/ComparisonReport';
import DailyPendingReport from './components/DailyPendingReport';

const App = () => {
    const [processedData, setProcessedData] = useState({ mainData: [], returnData: [], inventoryData: [], cancelledData: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('logistics');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // --- STATE BỘ LỌC CHUNG (Logistics, Returns...) ---
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1); 
    const formatDate = (d) => d.toISOString().split('T')[0];

    const [filterDateStart, setFilterDateStart] = useState(formatDate(firstDay));
    const [filterDateEnd, setFilterDateEnd] = useState(formatDate(today));
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); 
    const [nhanhStatusFilter, setNhanhStatusFilter] = useState('all'); 
    const [carrierFilter, setCarrierFilter] = useState('all');
    const [selectedPendingDate, setSelectedPendingDate] = useState(null);

    // --- STATE BỘ LỌC RIÊNG CHO TAB SO SÁNH (Lưu tại đây để không mất khi chuyển tab) ---
    const [periodA, setPeriodA] = useState({ start: '', end: '' });
    const [periodB, setPeriodB] = useState({ start: '', end: '' });

    const handleFetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchLogisticsData();
            setProcessedData(data); 
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { handleFetchData(); }, []);

    // Filter Logic cho Tab Logistics
    const filteredLogisticsData = useMemo(() => {
        let data = processedData.mainData || [];
        if (filterDateStart) {
            const start = new Date(filterDateStart);
            data = data.filter(item => item.dateObj && item.dateObj >= start);
        }
        if (filterDateEnd) {
            const end = new Date(filterDateEnd);
            end.setHours(23, 59, 59, 999);
            data = data.filter(item => item.dateObj && item.dateObj <= end);
        }
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            data = data.filter(item => (item.trackingCode && item.trackingCode.toLowerCase().includes(lowerTerm)) || (item.carrier && item.carrier.toLowerCase().includes(lowerTerm)));
        }
        if (selectedPendingDate) {
            data = data.filter(item => item.date === selectedPendingDate && item.internalStatus === 'Chưa đi' && (item.nhanhStatus === 'Mới' || item.nhanhStatus === 'Đang đóng gói'));
        } else {
            if (statusFilter !== 'all') {
                const targetStatus = statusFilter === 'shipped' ? 'Đã đi' : 'Chưa đi';
                data = data.filter(item => item.internalStatus === targetStatus);
            }
            if (nhanhStatusFilter !== 'all') data = data.filter(item => item.nhanhStatus === nhanhStatusFilter);
            if (carrierFilter !== 'all') data = data.filter(item => item.carrier === carrierFilter);
        }
        return data;
    }, [processedData.mainData, filterDateStart, filterDateEnd, searchTerm, statusFilter, nhanhStatusFilter, carrierFilter, selectedPendingDate]);

    const stats = useMemo(() => {
        let baseData = processedData.mainData || [];
        if (filterDateStart) {
            const start = new Date(filterDateStart);
            baseData = baseData.filter(item => item.dateObj && item.dateObj >= start);
        }
        if (filterDateEnd) {
            const end = new Date(filterDateEnd);
            end.setHours(23, 59, 59, 999);
            baseData = baseData.filter(item => item.dateObj && item.dateObj <= end);
        }
        const total = baseData.length;
        const shipped = baseData.filter(d => d.internalStatus === 'Đã đi').length;
        return { total, shipped, pending: total - shipped };
    }, [processedData.mainData, filterDateStart, filterDateEnd]);

    const pendingReportDataSource = useMemo(() => {
        let data = processedData.mainData || [];
        if (filterDateStart) {
            const start = new Date(filterDateStart);
            data = data.filter(item => item.dateObj && item.dateObj >= start);
        }
        if (filterDateEnd) {
            const end = new Date(filterDateEnd);
            end.setHours(23, 59, 59, 999);
            data = data.filter(item => item.dateObj && item.dateObj <= end);
        }
        return data;
    }, [processedData.mainData, filterDateStart, filterDateEnd]);

    const handleReset = () => {
        setFilterDateStart(formatDate(firstDay)); setFilterDateEnd(formatDate(today)); 
        setSearchTerm(''); setStatusFilter('all'); setNhanhStatusFilter('all'); setCarrierFilter('all');
        setSelectedPendingDate(null);
    };

    const tabs = [
        { id: 'logistics', label: 'Đơn đi', icon: null },
        { id: 'returns', label: 'Đơn hoàn', icon: ArrowLeftRight },
        { id: 'inventory', label: 'Kiểm kê', icon: ClipboardList },
        { id: 'cancelled', label: 'Đơn huỷ sàn', icon: XCircle },
        { id: 'comparison', label: 'So sánh', icon: BarChart2 },
    ];

    return (
        <div className="min-h-screen pb-12 bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="bg-blue-600 p-2 rounded-lg"><Package className="h-5 w-5 text-white" /></div>
                            <h1 className="text-lg md:text-xl font-bold text-gray-900">AMELIE - BÁO CÁO KHO VẬN</h1>
                        </div>
                        <div className="hidden md:flex bg-gray-100 p-1 rounded-lg gap-1">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}>
                                    {tab.icon && <tab.icon className="h-4 w-4" />}{tab.label}
                                </button>
                            ))}
                        </div>
                        </div>
                </div>
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white shadow-lg absolute w-full left-0 z-20">
                        <div className="p-2 space-y-1">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition ${activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                                    {tab.icon && <tab.icon className="h-5 w-5" />}{tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                {error && <div className="text-red-500 mb-4 bg-red-50 p-3 rounded border border-red-200 text-sm">{error}</div>}
                
                {activeTab !== 'comparison' && (
                    <FilterBar filterDateStart={filterDateStart} setFilterDateStart={setFilterDateStart} filterDateEnd={filterDateEnd} setFilterDateEnd={setFilterDateEnd} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onReset={handleReset} />
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div><p className="text-gray-500 text-sm">Đang tải dữ liệu...</p></div>
                ) : (
                    <>
                        {activeTab === 'logistics' && (
                            <div className="animate-fade-in space-y-6">
                                <DashboardStats stats={stats} />
                                <ProductivityChart data={pendingReportDataSource} />
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2">
                                        <ReportChart filteredData={pendingReportDataSource} onFilterNhanhStatus={setNhanhStatusFilter} currentNhanhFilter={nhanhStatusFilter} onFilterCarrier={setCarrierFilter} currentCarrierFilter={carrierFilter} />
                                    </div>
                                    <div className="lg:col-span-1">
                                        <DailyPendingReport data={pendingReportDataSource} onDateSelect={setSelectedPendingDate} selectedDate={selectedPendingDate} />
                                    </div>
                                </div>
                                {(nhanhStatusFilter !== 'all' || carrierFilter !== 'all' || selectedPendingDate) && (
                                    <div className="flex flex-wrap gap-2 items-center bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                                        <span className="text-xs text-gray-500 font-medium ml-2">Đang lọc theo:</span>
                                        {selectedPendingDate && <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs flex items-center border border-yellow-200">Ngày tồn: <strong>{selectedPendingDate}</strong><button onClick={() => setSelectedPendingDate(null)} className="ml-1.5 text-yellow-600 hover:text-yellow-800 font-bold">×</button></div>}
                                        {nhanhStatusFilter !== 'all' && <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs flex items-center border border-blue-200">Trạng thái: <strong>{nhanhStatusFilter}</strong><button onClick={() => setNhanhStatusFilter('all')} className="ml-1.5 text-blue-600 hover:text-blue-800 font-bold">×</button></div>}
                                        {carrierFilter !== 'all' && <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs flex items-center border border-purple-200">ĐVVC: <strong>{carrierFilter}</strong><button onClick={() => setCarrierFilter('all')} className="ml-1.5 text-purple-600 hover:text-purple-800 font-bold">×</button></div>}
                                        <button onClick={handleReset} className="ml-auto text-xs text-gray-500 hover:text-red-600 underline">Xóa tất cả</button>
                                    </div>
                                )}
                                <OrderTable data={filteredLogisticsData} />
                            </div>
                        )}
                        
                        {activeTab === 'returns' && <div className="animate-fade-in"><ReturnOrderReport data={processedData.returnData || []} filterDateStart={filterDateStart} filterDateEnd={filterDateEnd} searchTerm={searchTerm} /></div>}
                        {activeTab === 'inventory' && <div className="animate-fade-in"><InventoryReport data={processedData.inventoryData || []} filterDateStart={filterDateStart} filterDateEnd={filterDateEnd} searchTerm={searchTerm} /></div>}
                        {activeTab === 'cancelled' && <div className="animate-fade-in"><CancelledOrderReport data={processedData.cancelledData || []} filterDateStart={filterDateStart} filterDateEnd={filterDateEnd} searchTerm={searchTerm} /></div>}
                        
                        {/* Tab So Sánh sử dụng State riêng */}
                        {activeTab === 'comparison' && (
                            <div className="animate-fade-in">
                                <ComparisonReport 
                                    data={processedData} 
                                    periodA={periodA}
                                    setPeriodA={setPeriodA}
                                    periodB={periodB}
                                    setPeriodB={setPeriodB}
                                />
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default App;