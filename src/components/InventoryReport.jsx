import React, { useState, useMemo, useEffect } from 'react';
import { Download, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

const InventoryReport = ({ data, filterDateStart, filterDateEnd, searchTerm }) => {
    
    // --- LỌC DỮ LIỆU THÔ ---
    const filteredData = useMemo(() => {
        let res = data;
        if (filterDateStart) {
            const start = new Date(filterDateStart);
            res = res.filter(item => item.dateObj && item.dateObj >= start);
        }
        if (filterDateEnd) {
            const end = new Date(filterDateEnd);
            end.setHours(23, 59, 59, 999);
            res = res.filter(item => item.dateObj && item.dateObj <= end);
        }
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            res = res.filter(item => 
                (item.productCode && item.productCode.toLowerCase().includes(lowerTerm))
            );
        }
        return res;
    }, [data, filterDateStart, filterDateEnd, searchTerm]);

    // --- TÍNH TỔNG CHÊNH LỆCH ---
    const grandTotalDiscrepancy = useMemo(() => {
        return filteredData.reduce((acc, item) => acc + item.discrepancy, 0);
    }, [filteredData]);

    // --- BẢNG CHI TIẾT (Logic cũ: Lọc cột, Sort, Pagination, Export) ---
    const [detailPage, setDetailPage] = useState(1);
    const [detailRowsPerPage, setDetailRowsPerPage] = useState(30);
    const [colFilters, setColFilters] = useState({ date: '', productCode: '', count: '', discrepancy: '' });
    const [detailSortConfig, setDetailSortConfig] = useState({ key: null, direction: 'descending' }); // Mặc định sort chênh lệch

    const filteredDetailRows = useMemo(() => {
        let rows = filteredData;
        // Filter từng cột
        if (colFilters.date) rows = rows.filter(r => r.date.includes(colFilters.date));
        if (colFilters.productCode) rows = rows.filter(r => r.productCode.toLowerCase().includes(colFilters.productCode.toLowerCase()));
        if (colFilters.count) rows = rows.filter(r => r.count.toString().includes(colFilters.count));
        if (colFilters.discrepancy) rows = rows.filter(r => r.discrepancy.toString().includes(colFilters.discrepancy));
        
        // Sort
        if (detailSortConfig.key !== null) {
            rows.sort((a, b) => {
                // Xử lý số và chuỗi
                let valA = a[detailSortConfig.key];
                let valB = b[detailSortConfig.key];
                
                // Nếu là cột số
                if (detailSortConfig.key === 'discrepancy' || detailSortConfig.key === 'count') {
                    valA = Number(valA);
                    valB = Number(valB);
                }

                if (valA < valB) return detailSortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return detailSortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return rows;
    }, [filteredData, colFilters, detailSortConfig]);

    const currentDetailRows = filteredDetailRows.slice((detailPage - 1) * detailRowsPerPage, detailPage * detailRowsPerPage);
    const totalDetailPages = Math.ceil(filteredDetailRows.length / detailRowsPerPage);

    const handleExportDetailCSV = () => {
        const header = ["Ngày", "Mã sản phẩm", "Số kiểm kê", "Chênh lệch"];
        const csvRows = [header.join(',')];
        filteredDetailRows.forEach(row => {
            csvRows.push([`"${row.date}"`, `"${row.productCode}"`, row.count, row.discrepancy].join(','));
        });
        const blob = new Blob(["\uFEFF" + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `chi_tiet_kiem_ke_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            {/* 1. BÁO CÁO TỔNG HỢP CHÊNH LỆCH */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">
                    Tổng chênh lệch: <span className={`font-mono text-2xl ml-2 ${grandTotalDiscrepancy < 0 ? 'text-red-600' : grandTotalDiscrepancy > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {grandTotalDiscrepancy > 0 ? '+' : ''}{grandTotalDiscrepancy}
                    </span>
                </h3>
            </div>

            {/* 2. BẢNG CHI TIẾT */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">Chi tiết kiểm kê <span className="text-blue-600">({filteredDetailRows.length})</span></h3>
                    <button onClick={handleExportDetailCSV} className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition shadow-sm text-sm font-medium">
                        <Download className="h-4 w-4" /> <span>Xuất Excel</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã sản phẩm</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Số kiểm kê</th>
                                <th 
                                    className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                                    onClick={() => {
                                        setDetailSortConfig(prev => ({ 
                                            key: 'discrepancy', 
                                            direction: prev.direction === 'ascending' ? 'descending' : 'ascending' 
                                        }));
                                    }}
                                >
                                    Chênh lệch <ArrowUpDown className="inline h-3 w-3 ml-1" />
                                </th>
                            </tr>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-2"><div className="relative"><Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" /><input type="text" placeholder="Lọc ngày..." className="pl-8 w-full text-xs border-gray-300 rounded p-1" value={colFilters.date} onChange={(e) => setColFilters({...colFilters, date: e.target.value})} /></div></th>
                                <th className="px-6 py-2"><div className="relative"><Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" /><input type="text" placeholder="Tìm mã..." className="pl-8 w-full text-xs border-gray-300 rounded p-1" value={colFilters.productCode} onChange={(e) => setColFilters({...colFilters, productCode: e.target.value})} /></div></th>
                                <th className="px-6 py-2"><input type="text" placeholder="Lọc số..." className="w-full text-xs border-gray-300 rounded p-1 text-center" value={colFilters.count} onChange={(e) => setColFilters({...colFilters, count: e.target.value})} /></th>
                                <th className="px-6 py-2"><input type="text" placeholder="Lọc lệch..." className="w-full text-xs border-gray-300 rounded p-1 text-center" value={colFilters.discrepancy} onChange={(e) => setColFilters({...colFilters, discrepancy: e.target.value})} /></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentDetailRows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{row.productCode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{row.count}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-center ${row.discrepancy < 0 ? 'text-red-600' : row.discrepancy > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                        {row.discrepancy > 0 ? '+' : ''}{row.discrepancy}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Detail Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center text-sm text-gray-700">
                        <span>Hiển thị</span>
                        <select value={detailRowsPerPage} onChange={(e) => {setDetailRowsPerPage(Number(e.target.value)); setDetailPage(1);}} className="mx-2 border-gray-300 rounded text-sm">
                            <option value={30}>30</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span>dòng</span>
                    </div>
                    <div className="text-sm text-gray-700">
                        {filteredDetailRows.length > 0 ? (detailPage - 1) * detailRowsPerPage + 1 : 0}-{Math.min(detailPage * detailRowsPerPage, filteredDetailRows.length)} / {filteredDetailRows.length}
                    </div>
                    <div className="flex items-center space-x-1">
                        <button onClick={() => setDetailPage(p => Math.max(1, p - 1))} disabled={detailPage === 1} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
                        <span className="text-sm px-2">Trang {detailPage}</span>
                        <button onClick={() => setDetailPage(p => Math.min(totalDetailPages, p + 1))} disabled={detailPage === totalDetailPages || totalDetailPages === 0} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryReport;