import React, { useState, useMemo, useEffect } from 'react';
import { 
    PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { Download, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const ReturnOrderReport = ({ data, filterDateStart, filterDateEnd, searchTerm }) => {
    
    // 1. State quản lý bộ lọc
    const [selectedGroup, setSelectedGroup] = useState('all'); // Filter từ Pie Chart
    const [colFilters, setColFilters] = useState({
        date: '',
        trackingCode: '',
        product: '',
        group: '',
        carrier: ''
    });

    const [tableData, setTableData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(30);

    // 2. Logic Lọc Tổng hợp (Global + Chart + Column)
    const filteredData = useMemo(() => {
        let res = data;

        // a. Lọc Global (Date + Search bar to)
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
                (item.trackingCode && item.trackingCode.toLowerCase().includes(lowerTerm)) ||
                (item.product && item.product.toLowerCase().includes(lowerTerm))
            );
        }
        return res;
    }, [data, filterDateStart, filterDateEnd, searchTerm]);

    // 3. Tính toán thống kê (Dựa trên data đã lọc Global)
    const groupStats = useMemo(() => {
        const stats = { 'Đơn hoàn sàn': 0, 'Đơn hoàn không thêm được BBBG': 0 };
        filteredData.forEach(item => {
            if (stats[item.group] !== undefined) {
                stats[item.group] += item.quantity; 
            }
        });
        return [
            { name: 'Đơn hoàn sàn', value: stats['Đơn hoàn sàn'], color: '#3b82f6' },
            { name: 'Đơn hoàn không thêm được BBBG', value: stats['Đơn hoàn không thêm được BBBG'], color: '#ef4444' }
        ].filter(i => i.value > 0);
    }, [filteredData]);

    const topProducts = useMemo(() => {
        const prodMap = {};
        filteredData.forEach(item => {
            prodMap[item.product] = (prodMap[item.product] || 0) + item.quantity;
        });
        return Object.keys(prodMap)
            .map(key => ({ name: key, value: prodMap[key] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [filteredData]);

    // 4. Áp dụng Filter cho Bảng (Chart selection + Column Filters)
    useEffect(() => {
        let res = filteredData;

        // Lọc theo Chart (Group)
        if (selectedGroup !== 'all') {
            res = res.filter(item => item.group === selectedGroup);
        }

        // Lọc theo từng cột
        if (colFilters.date) res = res.filter(r => r.date.includes(colFilters.date));
        if (colFilters.trackingCode) res = res.filter(r => r.trackingCode.toLowerCase().includes(colFilters.trackingCode.toLowerCase()));
        if (colFilters.product) res = res.filter(r => r.product.toLowerCase().includes(colFilters.product.toLowerCase()));
        if (colFilters.group) res = res.filter(r => r.group.toLowerCase().includes(colFilters.group.toLowerCase()));
        if (colFilters.carrier) res = res.filter(r => r.carrier.toLowerCase().includes(colFilters.carrier.toLowerCase()));

        setTableData(res);
        setCurrentPage(1);
    }, [filteredData, selectedGroup, colFilters]);

    // ... Pagination Logic ...
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = tableData.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(tableData.length / rowsPerPage);

    const handleRowsPerPageChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleExportCSV = () => {
        const header = ["Ngày", "Mã đơn hàng", "Sản phẩm", "Số lượng", "Nhóm", "ĐVVC"];
        const csvRows = [header.join(',')];
        tableData.forEach(row => {
            const values = [
                `"${row.date || ''}"`,
                `"${row.trackingCode || ''}"`,
                `"${row.product || ''}"`,
                `"${row.quantity || ''}"`,
                `"${row.group || ''}"`,
                `"${row.carrier || ''}"`
            ];
            csvRows.push(values.join(','));
        });
        const csvContent = "\uFEFF" + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `bao_cao_don_hoan_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg">
                    <p className="font-bold text-gray-900">{label}</p>
                    <p className="text-blue-600">Số lượng: {payload[0].value}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8">
            {/* Biểu đồ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Đơn hoàn theo Nguồn</h3>
                        {selectedGroup !== 'all' && (
                            <button 
                                onClick={() => setSelectedGroup('all')}
                                className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 flex items-center"
                            >
                                Xóa lọc: {selectedGroup} <span className="ml-1">✕</span>
                            </button>
                        )}
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={groupStats} 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={60} 
                                    outerRadius={80} 
                                    paddingAngle={5} 
                                    dataKey="value" 
                                    label
                                    onClick={(data) => setSelectedGroup(data.name === selectedGroup ? 'all' : data.name)}
                                    cursor="pointer"
                                >
                                    {groupStats.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.color} 
                                            stroke={selectedGroup === entry.name ? '#000' : 'none'}
                                            strokeWidth={selectedGroup === entry.name ? 2 : 0}
                                        />
                                    ))}
                                </Pie>
                                <ReTooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-2 italic">Bấm vào biểu đồ để lọc danh sách bên dưới</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 mã sản phẩm hoàn nhiều nhất</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} tick={{fontSize: 10}} />
                                <YAxis />
                                <ReTooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                    {topProducts.map((entry, index) => <Cell key={`cell-${index}`} fill="#8b5cf6" />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bảng Chi tiết */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">Chi tiết sản phẩm hoàn <span className="text-blue-600">({tableData.length})</span></h3>
                    <button onClick={handleExportCSV} className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition shadow-sm text-sm font-medium">
                        <Download className="h-4 w-4" /> <span>Xuất CSV</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr className="bg-gray-50">
                                <th className="px-6 py-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                                        <input type="text" placeholder="Lọc ngày..." className="pl-8 w-full text-xs border-gray-300 rounded p-1" value={colFilters.date} onChange={(e) => setColFilters({...colFilters, date: e.target.value})} />
                                    </div>
                                </th>
                                <th className="px-6 py-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                                        <input type="text" placeholder="Tìm mã..." className="pl-8 w-full text-xs border-gray-300 rounded p-1" value={colFilters.trackingCode} onChange={(e) => setColFilters({...colFilters, trackingCode: e.target.value})} />
                                    </div>
                                </th>
                                <th className="px-6 py-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                                        <input type="text" placeholder="Lọc SP..." className="pl-8 w-full text-xs border-gray-300 rounded p-1" value={colFilters.product} onChange={(e) => setColFilters({...colFilters, product: e.target.value})} />
                                    </div>
                                </th>
                                <th className="px-6 py-2"></th>
                                <th className="px-6 py-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                                        <input type="text" placeholder="Lọc nhóm..." className="pl-8 w-full text-xs border-gray-300 rounded p-1" value={colFilters.group} onChange={(e) => setColFilters({...colFilters, group: e.target.value})} />
                                    </div>
                                </th>
                                <th className="px-6 py-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                                        <input type="text" placeholder="Lọc ĐVVC..." className="pl-8 w-full text-xs border-gray-300 rounded p-1" value={colFilters.carrier} onChange={(e) => setColFilters({...colFilters, carrier: e.target.value})} />
                                    </div>
                                </th>
                            </tr>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã đơn hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">SL</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nhóm</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ĐVVC</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentRows.length > 0 ? (
                                currentRows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 font-mono">{row.trackingCode}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{row.product}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-bold">{row.quantity}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${row.group === 'Đơn hoàn sàn' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                                                {row.group}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.carrier}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500">
                                        Không tìm thấy dữ liệu phù hợp.
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
                        <select value={rowsPerPage} onChange={handleRowsPerPageChange} className="mx-2 border-gray-300 rounded text-sm">
                            <option value={30}>30</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={500}>500</option>
                        </select>
                        <span>dòng/trang</span>
                    </div>
                    <div className="text-sm text-gray-700">
                        {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, tableData.length)} / {tableData.length}
                    </div>
                    <div className="flex items-center space-x-1">
                        <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
                        <span className="text-sm px-2">Trang {currentPage}</span>
                        <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReturnOrderReport;