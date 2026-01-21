import React, { useState, useEffect } from 'react';
import { Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const OrderTable = ({ data }) => {
    const [filteredRows, setFilteredRows] = useState(data);
    const [colFilters, setColFilters] = useState({
        trackingCode: '', carrier: '', internalStatus: '', nhanhStatus: ''
    });

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(30);

    useEffect(() => {
        let rows = data;
        if (colFilters.trackingCode) rows = rows.filter(r => r.trackingCode.toLowerCase().includes(colFilters.trackingCode.toLowerCase()));
        if (colFilters.carrier) rows = rows.filter(r => r.carrier.toLowerCase().includes(colFilters.carrier.toLowerCase()));
        if (colFilters.internalStatus) rows = rows.filter(r => r.internalStatus.toLowerCase().includes(colFilters.internalStatus.toLowerCase()));
        if (colFilters.nhanhStatus) rows = rows.filter(r => r.nhanhStatus.toLowerCase().includes(colFilters.nhanhStatus.toLowerCase()));
        
        setFilteredRows(rows);
        setCurrentPage(1); // Reset to page 1 when filters change
    }, [data, colFilters]);

    // Pagination Logic
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredRows.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleRowsPerPageChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleExportCSV = () => {
        const header = ["Ngày", "Mã vận đơn", "ĐVVC", "TT Nội bộ", "TT Nhanh.vn"];
        const csvRows = [header.join(',')];
        filteredRows.forEach(row => {
            const values = [`"${row.date || ''}"`, `"${row.trackingCode || ''}"`, `"${row.carrier || ''}"`, `"${row.internalStatus || ''}"`, `"${row.nhanhStatus || ''}"`];
            csvRows.push(values.join(','));
        });
        const csvContent = "\uFEFF" + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `bao_cao_kho_van_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">Chi tiết đơn hàng <span className="text-blue-600">({filteredRows.length})</span></h3>
                <button onClick={handleExportCSV} className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition shadow-sm text-sm font-medium">
                    <Download className="h-4 w-4" /> <span>Xuất Excel/CSV</span>
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Ngày</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã vận đơn</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ĐVVC</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">TT Nội bộ</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">TT Nhanh.vn</th>
                        </tr>
                        <tr className="bg-gray-50">
                            <th className="px-6 py-2"></th>
                            <th className="px-6 py-2"><div className="relative"><Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" /><input type="text" placeholder="Tìm mã..." className="pl-8 w-full text-xs border-gray-300 rounded p-1" value={colFilters.trackingCode} onChange={(e) => setColFilters({...colFilters, trackingCode: e.target.value})} /></div></th>
                            <th className="px-6 py-2"><div className="relative"><Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" /><input type="text" placeholder="Lọc ĐVVC..." className="pl-8 w-full text-xs border-gray-300 rounded p-1" value={colFilters.carrier} onChange={(e) => setColFilters({...colFilters, carrier: e.target.value})} /></div></th>
                            <th className="px-6 py-2"><select className="w-full text-xs border-gray-300 rounded p-1" value={colFilters.internalStatus} onChange={(e) => setColFilters({...colFilters, internalStatus: e.target.value})}><option value="">Tất cả</option><option value="Đã đi">Đã đi</option><option value="Chưa đi">Chưa đi</option></select></th>
                            <th className="px-6 py-2"><div className="relative"><Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" /><input type="text" placeholder="Lọc trạng thái..." className="pl-8 w-full text-xs border-gray-300 rounded p-1" value={colFilters.nhanhStatus} onChange={(e) => setColFilters({...colFilters, nhanhStatus: e.target.value})} /></div></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentRows.length > 0 ? (
                            currentRows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-blue-50 transition duration-150 ease-in-out">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 font-mono">{row.trackingCode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{row.carrier}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${row.internalStatus === 'Đã đi' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{row.internalStatus}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${row.nhanhStatus.includes('Thành công') ? 'bg-green-50 text-green-700 border-green-200' : row.nhanhStatus.includes('Hoàn') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{row.nhanhStatus}</span></td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <Search className="h-8 w-8 text-gray-300 mb-2" />
                                        <p>Không tìm thấy dữ liệu phù hợp.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center text-sm text-gray-700">
                    <span>Hiển thị</span>
                    <select 
                        value={rowsPerPage} 
                        onChange={handleRowsPerPageChange}
                        className="mx-2 border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value={30}>30</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                        <option value={500}>500</option>
                    </select>
                    <span>dòng mỗi trang</span>
                </div>

                <div className="text-sm text-gray-700">
                    Hiển thị <strong>{indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredRows.length)}</strong> trên tổng số <strong>{filteredRows.length}</strong>
                </div>

                <div className="flex items-center space-x-1">
                    <button 
                        onClick={() => handlePageChange(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    
                    <span className="text-sm text-gray-700 px-2">
                        Trang {currentPage} / {totalPages || 1}
                    </span>

                    <button 
                        onClick={() => handlePageChange(currentPage + 1)} 
                        disabled={currentPage === totalPages || totalPages === 0}
                        className={`p-2 rounded-md ${currentPage === totalPages || totalPages === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderTable;


