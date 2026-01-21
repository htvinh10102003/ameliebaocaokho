import React from 'react';
import { 
    PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ComposedChart, ReferenceLine
} from 'recharts';

// --- COMPONENT 1: Biểu đồ Năng suất (Stacked Bar - Fixed Y-Axis) ---
export const ProductivityChart = ({ data }) => {
    // 1. Xử lý dữ liệu
    const dailyStats = data.reduce((acc, curr) => {
        const date = curr.date;
        if (date) {
            if (!acc[date]) acc[date] = { printed: 0, shipped: 0 };
            acc[date].printed += 1; // Tổng đơn in
            if (curr.internalStatus === 'Đã đi') {
                acc[date].shipped += 1; // Đơn đi
            }
        }
        return acc;
    }, {});

    const chartData = Object.keys(dailyStats)
        .map(dateStr => {
            const parts = dateStr.split('/');
            let dateObj = null;
            if(parts.length === 3) dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            
            const printed = dailyStats[dateStr].printed;
            const shipped = dailyStats[dateStr].shipped;
            const pending = printed - shipped;

            return {
                name: dateStr,
                printed: printed, 
                shipped: shipped, 
                pending: pending < 0 ? 0 : pending, 
                dateObj: dateObj
            };
        })
        .filter(item => item.dateObj && !isNaN(item.dateObj))
        .sort((a, b) => a.dateObj - b.dateObj);

    // 2. Tính trung bình
    const avgPrinted = chartData.length > 0 
        ? Math.round(chartData.reduce((sum, item) => sum + item.printed, 0) / chartData.length) 
        : 0;
    const avgShipped = chartData.length > 0 
        ? Math.round(chartData.reduce((sum, item) => sum + item.shipped, 0) / chartData.length) 
        : 0;

    // 3. Custom Tooltip [FIXED]
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const currentItem = chartData.find(item => item.name === label);
            const isSunday = currentItem && currentItem.dateObj.getDay() === 0;
            // Lấy tổng in trực tiếp từ dữ liệu đã tính toán để chính xác nhất
            const totalPrinted = currentItem ? currentItem.printed : 0;

            return (
                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-xs sm:text-sm z-50">
                    <p className="font-bold text-gray-900 mb-1">
                        {label} {isSunday ? <span className="text-yellow-600 font-normal">(Chủ Nhật)</span> : ''}
                    </p>
                    <p className="text-indigo-600">Tổng in: <strong>{totalPrinted}</strong></p>
                    <div className="my-1 border-t border-gray-100"></div>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                            {/* Hiển thị trực tiếp tên (entry.name) đã định nghĩa ở <Bar name="..." /> */}
                            {entry.name}: <strong>{entry.value}</strong>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // 4. Tính toán độ rộng động
    const minWidthMobile = 600; 
    const itemWidth = 50; 
    const calculatedWidth = chartData.length * itemWidth;
    const isScrollable = chartData.length > 15; 

    const commonMargin = { top: 20, bottom: 50 };

    return (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-indigo-500 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Năng suất vận hành (Đơn in = Đơn đã đi + Đơn tồn)
                </h3>
                <div className="flex flex-wrap gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm bg-[#82ca9d]"></span>
                        <span className="text-gray-600">Đã đi (TB: {avgShipped}) đơn/ngày</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm bg-[#f59e0b]"></span>
                        <span className="text-gray-600">Còn tồn</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-1 border-t border-dashed border-[#8884d8]"></span>
                        <span className="text-gray-600">TB In ({avgPrinted}) đơn/ngày</span>
                    </div>
                </div>
            </div>
            
            <div className="flex h-64 sm:h-80 relative border border-gray-100 rounded-lg overflow-hidden">
                {/* 1. Trục Y Cố Định (Bên Trái) */}
                <div className="w-10 sm:w-14 h-full bg-white border-r border-gray-100 z-10 flex-none">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ ...commonMargin, right: 0, left: 0 }}>
                            <YAxis 
                                tick={{fontSize: 10, fill: '#6b7280'}} 
                                tickLine={false} 
                                axisLine={false}
                                width={40}
                            />
                            {/* Cột ẩn để ép Recharts tính toán trục Y */}
                            <Bar dataKey="shipped" stackId="a" fill="transparent" />
                            <Bar dataKey="pending" stackId="a" fill="transparent" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* 2. Nội dung Biểu đồ Cuộn (Bên Phải) */}
                <div className="flex-1 overflow-x-auto pb-2 custom-scrollbar relative">
                    <div style={{ 
                        width: isScrollable ? `${Math.max(minWidthMobile, calculatedWidth)}px` : '100%', 
                        height: '100%',
                        minWidth: '100%' 
                    }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ ...commonMargin, right: 30, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis 
                                    dataKey="name" 
                                    angle={-45} 
                                    textAnchor="end" 
                                    interval={0} 
                                    height={60} 
                                    tick={{fontSize: 10, fill: '#6b7280'}} 
                                />
                                <YAxis hide domain={['auto', 'auto']} />
                                <ReTooltip content={<CustomTooltip />} cursor={{fill: '#f3f4f6', opacity: 0.5}} />
                                
                                {/* Cột Chồng (Stacked) */}
                                <Bar dataKey="shipped" name="Đã đi" stackId="a" barSize={30} radius={[0, 0, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-shipped-${index}`} 
                                            fill={entry.dateObj.getDay() === 0 ? '#f59e0b' : '#82ca9d'} 
                                        />
                                    ))}
                                </Bar>

                                <Bar dataKey="pending" name="Còn tồn" stackId="a" barSize={30} radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-pending-${index}`} 
                                            fill={entry.dateObj.getDay() === 0 ? '#fcd34d' : '#f97316'} 
                                        />
                                    ))}
                                </Bar>
                                
                                <ReferenceLine 
                                    y={avgPrinted} 
                                    stroke="#8884d8" 
                                    strokeDasharray="5 5"
                                    label={{ position: 'right', value: `${avgPrinted}`, fill: '#8884d8', fontSize: 10, fontWeight: 'bold' }} 
                                />
                                <ReferenceLine 
                                    y={avgShipped} 
                                    stroke="#166534" 
                                    strokeDasharray="3 3"
                                    label={{ position: 'right', value: `${avgShipped}`, fill: '#166534', fontSize: 10, fontWeight: 'bold', dy: 15 }} 
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT 2: Các biểu đồ còn lại ---
const ReportChart = ({ 
    filteredData, 
    onFilterNhanhStatus, currentNhanhFilter,
    onFilterCarrier, currentCarrierFilter
}) => {
    
    const shippedCount = filteredData.filter(d => d.internalStatus === 'Đã đi').length;
    const pendingCount = filteredData.length - shippedCount;
    const pieData = [
        { name: 'Đã đi', value: shippedCount, color: '#10b981' },
        { name: 'Chưa đi', value: pendingCount, color: '#f59e0b' },
    ];

    const nhanhStats = filteredData.reduce((acc, curr) => {
        const status = curr.nhanhStatus || 'Không rõ';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});
    const barDataNhanh = Object.keys(nhanhStats).map(key => ({
        name: key,
        value: nhanhStats[key]
    })).sort((a, b) => b.value - a.value);

    const carrierStats = filteredData.reduce((acc, curr) => {
        const carrier = curr.carrier || 'Không rõ';
        acc[carrier] = (acc[carrier] || 0) + 1;
        return acc;
    }, {});
    const barDataCarrier = Object.keys(carrierStats).map(key => ({
        name: key,
        value: carrierStats[key]
    })).sort((a, b) => b.value - a.value);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm">
                    <p className="font-bold text-gray-900">{label}</p>
                    <p className="text-blue-600">Số lượng: {payload[0].value}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Tỷ lệ hoàn thành (Tổng quát)</h3>
                    <div className="h-56 sm:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <ReTooltip />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Thống kê theo ĐVVC</h3>
                        {currentCarrierFilter !== 'all' && (
                            <button onClick={() => onFilterCarrier('all')} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200">Xóa lọc ĐVVC</button>
                        )}
                    </div>
                    <div className="h-56 sm:h-64 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ĐVVC</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {barDataCarrier.map((item, idx) => (
                                    <tr key={idx} onClick={() => onFilterCarrier(item.name)} className={`cursor-pointer transition ${currentCarrierFilter === item.name ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                        <td className="px-3 py-2 text-sm text-gray-900 font-medium">{item.name}</td>
                                        <td className="px-3 py-2 text-sm text-gray-500 text-right">{item.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Báo cáo trạng thái đơn (Nhanh.vn)</h3>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs sm:text-sm text-gray-500 italic">Bấm vào cột để lọc</span>
                        {currentNhanhFilter !== 'all' && (
                            <button onClick={() => onFilterNhanhStatus('all')} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200">Xóa lọc</button>
                        )}
                    </div>
                </div>
                <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barDataNhanh} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} tick={{fontSize: 10}} />
                            <YAxis tick={{fontSize: 10}} />
                            <ReTooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} onClick={(data) => onFilterNhanhStatus(data.name)} cursor="pointer">
                                {barDataNhanh.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.name === currentNhanhFilter ? '#1d4ed8' : '#3b82f6'} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ReportChart;