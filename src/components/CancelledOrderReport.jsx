import React, { useState, useMemo, useEffect } from 'react';
import { 
    PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { Download, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const CancelledOrderReport = ({ data, filterDateStart, filterDateEnd, searchTerm }) => {
    
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
                (item.orderCode && item.orderCode.toLowerCase().includes(lowerTerm)) ||
                (item.productCode && item.productCode.toLowerCase().includes(lowerTerm))
            );
        }
        return res;
    }, [data, filterDateStart, filterDateEnd, searchTerm]);

    const [activeTab, setActiveTab] = useState('Huỷ bởi người mua'); 
    const [selectedReason, setSelectedReason] = useState('all'); 

    const dataByTab = useMemo(() => {
        return filteredData.filter(item => item.reasonGroup === activeTab);
    }, [filteredData, activeTab]);

    const pieChartData = useMemo(() => {
        const stats = {};
        dataByTab.forEach(item => {
            const reason = item.reasonDetail || 'Không rõ';
            stats[reason] = (stats[reason] || 0) + 1; 
        });
        return Object.keys(stats).map((key, index) => ({
            name: key,
            value: stats[key],
            color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]
        })).filter(i => i.value > 0);
    }, [dataByTab]);

    const topSellerCancelledProducts = useMemo(() => {
        const sellerCancelledData = filteredData.filter(item => item.reasonGroup === 'Huỷ bởi người bán');
        const prodMap = {};
        sellerCancelledData.forEach(item => {
            prodMap[item.productCode] = (prodMap[item.productCode] || 0) + item.quantity;
        });
        return Object.keys(prodMap)
            .map(key => ({ name: key, value: prodMap[key] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [filteredData]);

    const [topProductLimit, setTopProductLimit] = useState(10); 

    const [tableData, setTableData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(30);
    const [colFilters, setColFilters] = useState({ date: '', orderCode: '', productCode: '', quantity: '', reasonDetail: '' });

    useEffect(() => {
        let res = dataByTab; 
        if (selectedReason !== 'all') {
            res = res.filter(item => item.reasonDetail === selectedReason);
        }
        if (colFilters.date) res = res.filter(r => r.date.includes(colFilters.date));
        if (colFilters.orderCode) res = res.filter(r => r.orderCode.toLowerCase().includes(colFilters.orderCode.toLowerCase()));
        if (colFilters.productCode) res = res.filter(r => r.productCode.toLowerCase().includes(colFilters.productCode.toLowerCase()));
        if (colFilters.reasonDetail) res = res.filter(r => r.reasonDetail.toLowerCase().includes(colFilters.reasonDetail.toLowerCase()));

        setTableData(res);
        setCurrentPage(1);
    }, [dataByTab, selectedReason, colFilters]);

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = tableData.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(tableData.length / rowsPerPage);

    const handleExportCSV = () => {
        const header = ["Ngày", "Mã đơn hàng", "Mã sản phẩm", "Số lượng", "Lý do", "Nhóm"];
        const csvRows = [header.join(',')];
        tableData.forEach(row => {
            csvRows.push([`"${row.date}"`, `"${row.orderCode}"`, `"${row.productCode}"`, row.quantity, `"${row.reasonDetail}"`, `"${row.reasonGroup}"`].join(','));
        });
        const blob = new Blob(["\uFEFF" + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `don_huy_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            <div className="flex space-x-4 border-b border-gray-200 pb-2">
                {['Huỷ bởi người mua', 'Tự động huỷ bởi hệ thống Shopee', 'Huỷ bởi người bán'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setSelectedReason('all'); }}
                        className={`px-4 py-2 font-medium text-sm rounded-md transition ${activeTab === tab ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. BIỂU ĐỒ TRÒN (THEO TAB) */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Lý do huỷ chi tiết ({activeTab})</h3>
                        {selectedReason !== 'all' && (
                            <button onClick={() => setSelectedReason('all')} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200">
                                Xóa lọc: {selectedReason}
                            </button>
                        )}
                    </div>
                    {pieChartData.length > 0 ? (
                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={pieChartData} cx="40%" cy="50%" 
                                        innerRadius={60} outerRadius={100} 
                                        paddingAngle={5} dataKey="value" label
                                        onClick={(data) => setSelectedReason(data.name === selectedReason ? 'all' : data.name)}
                                        cursor="pointer"
                                    >
                                        {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                    <ReTooltip />
                                    <Legend 
                                        layout="vertical" 
                                        verticalAlign="middle" 
                                        align="right"
                                        width={200}
                                        wrapperStyle={{ paddingLeft: "10px", fontSize: "12px", overflowY: "auto", maxHeight: "300px" }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <p className="text-center text-xs text-gray-500 mt-2 italic">Bấm vào biểu đồ để lọc danh sách bên dưới</p>
                        </div>
                    ) : (
                        <div className="h-80 flex items-center justify-center text-gray-400">Không có dữ liệu</div>
                    )}
                </div>

                {/* 2. TOP SẢN PHẨM HUỶ BỞI NGƯỜI BÁN */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-red-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-red-700">Top SP huỷ bởi Người bán</h3>
                        <select 
                            value={topProductLimit} 
                            onChange={(e) => setTopProductLimit(Number(e.target.value))}
                            className="text-xs border-gray-300 rounded"
                        >
                            <option value={5}>Top 5</option>
                            <option value={10}>Top 10</option>
                            <option value={20}>Top 20</option>
                        </select>
                    </div>
                    <div className="overflow-y-auto h-80">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mã SP</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Số lượng huỷ</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {topSellerCancelledProducts.slice(0, topProductLimit).map((item, idx) => (
                                    <tr key={idx} className="hover:bg-red-50">
                                        <td className="px-4 py-2 text-sm text-gray-900 font-medium">{item.name}</td>
                                        <td className="px-4 py-2 text-sm text-red-600 font-bold text-right">{item.value}</td>
                                    </tr>
                                ))}
                                {topSellerCancelledProducts.length === 0 && (
                                    <tr><td colSpan="2" className="text-center py-4 text-gray-400 text-sm">Chưa có đơn huỷ do shop</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 3. BẢNG CHI TIẾT */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">Chi tiết đơn huỷ <span className="text-blue-600">({tableData.length})</span></h3>
                    <button onClick={handleExportCSV} className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition shadow-sm text-sm font-medium">
                        <Download className="h-4 w-4" /> <span>Xuất Excel</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr className="bg-gray-50">
                                <th className="px-6 py-2"><input type="text" placeholder="Lọc ngày..." className="pl-2 w-full text-xs border-gray-300 rounded p-1" value={colFilters.date} onChange={(e) => setColFilters({...colFilters, date: e.target.value})} /></th>
                                <th className="px-6 py-2"><input type="text" placeholder="Tìm mã đơn..." className="pl-2 w-full text-xs border-gray-300 rounded p-1" value={colFilters.orderCode} onChange={(e) => setColFilters({...colFilters, orderCode: e.target.value})} /></th>
                                <th className="px-6 py-2"><input type="text" placeholder="Tìm SP..." className="pl-2 w-full text-xs border-gray-300 rounded p-1" value={colFilters.productCode} onChange={(e) => setColFilters({...colFilters, productCode: e.target.value})} /></th>
                                <th className="px-6 py-2"></th>
                                <th className="px-6 py-2"><input type="text" placeholder="Lọc lý do..." className="pl-2 w-full text-xs border-gray-300 rounded p-1" value={colFilters.reasonDetail} onChange={(e) => setColFilters({...colFilters, reasonDetail: e.target.value})} /></th>
                            </tr>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ngày</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Mã đơn hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Mã sản phẩm</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">SL</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Lý do chi tiết</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentRows.map((row, idx) => {
                                const isDuplicateOrder = idx > 0 && row.orderCode === currentRows[idx - 1].orderCode;
                                return (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{isDuplicateOrder ? '' : row.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 font-mono">
                                            {isDuplicateOrder ? <span className="text-gray-200">"</span> : row.orderCode}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.productCode}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-bold">{row.quantity}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{isDuplicateOrder ? '' : row.reasonDetail}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center text-sm text-gray-700">
                        <span>Hiển thị</span>
                        <select value={rowsPerPage} onChange={(e) => {setRowsPerPage(Number(e.target.value)); setCurrentPage(1);}} className="mx-2 border-gray-300 rounded text-sm">
                            <option value={30}>30</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span>dòng</span>
                    </div>
                    <div className="text-sm text-gray-700">{indexOfFirstRow + 1}-{Math.min(indexOfLastRow, tableData.length)} / {tableData.length}</div>
                    <div className="flex items-center space-x-1">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
                        <span className="text-sm px-2">Trang {currentPage}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CancelledOrderReport;