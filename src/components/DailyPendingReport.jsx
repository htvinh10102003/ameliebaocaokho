import React, { useMemo } from 'react';

const DailyPendingReport = ({ data, onDateSelect, selectedDate }) => {
    const reportData = useMemo(() => {
        const stats = {};
        
        // Lọc các đơn có trạng thái "Chưa đi" VÀ (Trạng thái Nhanh là "Mới" hoặc "Đang đóng gói")
        data.forEach(item => {
            const nStatus = item.nhanhStatus || ''; 
            if (
                item.internalStatus === 'Chưa đi' && 
                item.date && 
                (nStatus === 'Mới' || nStatus === 'Đang đóng gói' || nStatus === 'Đã xác nhận')
            ) {
                stats[item.date] = (stats[item.date] || 0) + 1;
            }
        });
        
        return Object.entries(stats).map(([date, count]) => {
            const parts = date.split('/');
            const dateObj = parts.length === 3 ? new Date(parts[2], parts[1] - 1, parts[0]) : null;
            return { date, count, dateObj };
        }).sort((a, b) => (a.dateObj && b.dateObj) ? a.dateObj - b.dateObj : 0);
    }, [data]);

    if (reportData.length === 0) return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500 text-sm h-full flex items-center justify-center">
            Không có đơn tồn kho (Mới/Đang đóng gói).
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 bg-yellow-50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-900 uppercase">SL Đơn tồn theo ngày</h3>
                <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                    {reportData.reduce((sum, item) => sum + item.count, 0)} đơn
                </span>
            </div>
            
            {/* Giới hạn chiều cao max-h-60 để bảng ngắn lại, buộc scroll */}
            <div className="overflow-y-auto flex-1 max-h-385 scrollbar-thin">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">SL</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.map((item, idx) => {
                            const isActive = selectedDate === item.date;
                            return (
                                <tr 
                                    key={idx} 
                                    onClick={() => onDateSelect(isActive ? null : item.date)} 
                                    className={`cursor-pointer transition duration-150 ${
                                        isActive 
                                            ? 'bg-blue-100 hover:bg-blue-200' 
                                            : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <td className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${isActive ? 'text-blue-800' : 'text-gray-700'}`}>
                                        {item.date}
                                    </td>
                                    <td className={`px-4 py-2 whitespace-nowrap text-sm font-bold text-right ${isActive ? 'text-blue-800' : 'text-yellow-600'}`}>
                                        {item.count}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {selectedDate && (
                <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 text-xs text-blue-600 text-center">
                    Đang xem: <strong>{selectedDate}</strong>
                </div>
            )}
        </div>
    );
};

export default DailyPendingReport;
