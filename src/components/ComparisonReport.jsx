import React, { useMemo } from 'react';
import { Calendar, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, CheckCircle, Package, TrendingUp, XCircle, ClipboardList } from 'lucide-react';

const ComparisonReport = ({ data, periodA, setPeriodA, periodB, setPeriodB }) => {
    // Không cần useState nội bộ cho periodA/B nữa vì đã nhận từ props

    const filterByDate = (items, startStr, endStr) => {
        if (!startStr || !endStr) return [];
        const start = new Date(startStr);
        const end = new Date(endStr);
        end.setHours(23, 59, 59, 999);
        return items.filter(item => item.dateObj && item.dateObj >= start && item.dateObj <= end);
    };

    const calculateMetrics = (start, end) => {
        const pMain = filterByDate(data.mainData || [], start, end);
        const pReturn = filterByDate(data.returnData || [], start, end);
        const pCancel = filterByDate(data.cancelledData || [], start, end);
        const pInventory = filterByDate(data.inventoryData || [], start, end);

        const totalPrinted = pMain.length;
        const totalShipped = pMain.filter(i => i.internalStatus === 'Đã đi').length;
        const totalPending = totalPrinted - totalShipped;

        // Chỉ đếm đơn huỷ BỞI NGƯỜI BÁN
        const totalCancelledBySeller = pCancel
            .filter(item => item.reasonGroup === 'Huỷ bởi người bán')
            .reduce((acc, item) => acc + item.quantity, 0);

        const totalReturned = pReturn.reduce((acc, item) => acc + item.quantity, 0);
        const totalDiscrepancy = pInventory.reduce((acc, item) => acc + item.discrepancy, 0);

        return {
            totalPrinted,
            totalShipped,
            totalPending,
            totalCancelledBySeller,
            totalReturned,
            totalDiscrepancy
        };
    };

    const metricsA = useMemo(() => calculateMetrics(periodA.start, periodA.end), [data, periodA]);
    const metricsB = useMemo(() => calculateMetrics(periodB.start, periodB.end), [data, periodB]);

    // Component thẻ so sánh
    const ComparisonCard = ({ title, valueA, valueB, type = 'neutral', icon: Icon }) => {
        const diff = valueB - valueA;
        const percent = valueA !== 0 ? ((diff / Math.abs(valueA)) * 100).toFixed(1) : (valueB !== 0 ? 100 : 0);
        
        let colorTheme = 'gray'; // neutral
        let TrendIcon = Minus; 
        let trendColor = 'text-gray-500';

        // Xác định màu sắc dựa trên tính chất chỉ số (Tốt/Xấu)
        if (diff > 0) {
            TrendIcon = ArrowUpRight;
            if (type === 'good') { colorTheme = 'green'; trendColor = 'text-green-600'; }
            else if (type === 'bad') { colorTheme = 'red'; trendColor = 'text-red-600'; }
            else { colorTheme = 'blue'; trendColor = 'text-blue-600'; }
        } else if (diff < 0) {
            TrendIcon = ArrowDownRight;
            if (type === 'good') { colorTheme = 'red'; trendColor = 'text-red-600'; }
            else if (type === 'bad') { colorTheme = 'green'; trendColor = 'text-green-600'; }
            else { colorTheme = 'blue'; trendColor = 'text-blue-600'; }
        } else {
            if(type === 'good') colorTheme = 'green';
            if(type === 'bad') colorTheme = 'red';
        }

        const borderColors = {
            green: 'border-t-4 border-green-500',
            red: 'border-t-4 border-red-500',
            blue: 'border-t-4 border-blue-500',
            gray: 'border-t-4 border-gray-400',
            orange: 'border-t-4 border-orange-500',
        };

        // Custom theme mapping
        let cardStyle = borderColors.gray;
        if (type === 'good') cardStyle = borderColors.green;
        if (type === 'bad') cardStyle = borderColors.red;
        if (type === 'info') cardStyle = borderColors.blue;

        return (
            <div className={`bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 ${cardStyle}`}>
                <div className="flex justify-between items-start mb-4">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</h4>
                    <div className={`p-2 rounded-full bg-${colorTheme}-50`}>
                        {Icon && <Icon className={`w-5 h-5 text-${colorTheme}-500 opacity-75`} />}
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 items-end mb-4">
                    <div>
                        <span className="text-xs font-semibold text-gray-400 block mb-1">Kỳ A</span>
                        <span className="text-2xl font-extrabold text-gray-700 block">{valueA.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-semibold text-gray-400 block mb-1">Kỳ B</span>
                        <span className={`text-3xl font-extrabold ${trendColor}`}>{valueB.toLocaleString()}</span>
                    </div>
                </div>

                <div className={`flex items-center justify-between text-sm font-bold ${trendColor} bg-gray-50 px-3 py-2 rounded-lg`}>
                    <span className="text-gray-500 font-medium text-xs">Chênh lệch:</span>
                    <div className="flex items-center">
                        <TrendIcon className="h-4 w-4 mr-1" />
                        <span>{diff > 0 ? '+' : ''}{diff.toLocaleString()} ({percent}%)</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* THANH CHỌN NGÀY */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600"/> So sánh hiệu quả hoạt động
                </h3>
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    {/* Kỳ A */}
                    <div className="flex-1 w-full bg-blue-50 p-4 rounded-lg border border-blue-100 relative group">
                        <div className="absolute -top-3 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded shadow-sm">Kỳ A</div>
                        <div className="flex gap-2 mt-2">
                            <input type="date" className="w-1/2 border-gray-300 rounded text-sm p-2 focus:ring-2 focus:ring-blue-500" value={periodA.start} onChange={e => setPeriodA({...periodA, start: e.target.value})} />
                            <span className="self-center text-gray-400">-</span>
                            <input type="date" className="w-1/2 border-gray-300 rounded text-sm p-2 focus:ring-2 focus:ring-blue-500" value={periodA.end} onChange={e => setPeriodA({...periodA, end: e.target.value})} />
                        </div>
                    </div>

                    <div className="text-gray-300 hidden md:block"><ArrowUpRight className="w-6 h-6" /></div>

                    {/* Kỳ B */}
                    <div className="flex-1 w-full bg-orange-50 p-4 rounded-lg border border-orange-100 relative group">
                        <div className="absolute -top-3 left-4 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded shadow-sm">KỲ B (So sánh)</div>
                        <div className="flex gap-2 mt-2">
                            <input type="date" className="w-1/2 border-gray-300 rounded text-sm p-2 focus:ring-2 focus:ring-orange-500" value={periodB.start} onChange={e => setPeriodB({...periodB, start: e.target.value})} />
                            <span className="self-center text-gray-400">-</span>
                            <input type="date" className="w-1/2 border-gray-300 rounded text-sm p-2 focus:ring-2 focus:ring-orange-500" value={periodB.end} onChange={e => setPeriodB({...periodB, end: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>

            {/* KẾT QUẢ SO SÁNH */}
            {(!periodA.start || !periodA.end || !periodB.start || !periodB.end) ? (
                <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <TrendingUp className="w-8 h-8 text-blue-400" />
                    </div>
                    <p className="text-gray-500 font-medium">Vui lòng chọn đầy đủ ngày tháng cho cả 2 kỳ để xem phân tích.</p>
                </div>
            ) : (
                <>
                    <h4 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-2 mt-8">Hiệu suất vận hành</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ComparisonCard title="Tổng Đơn In" valueA={metricsA.totalPrinted} valueB={metricsB.totalPrinted} type="info" icon={Package} />
                        <ComparisonCard title="Số Đơn Đã Đi" valueA={metricsA.totalShipped} valueB={metricsB.totalShipped} type="good" icon={CheckCircle} />
                        <ComparisonCard title="Đơn Tồn (Chưa đi)" valueA={metricsA.totalPending} valueB={metricsB.totalPending} type="bad" icon={AlertTriangle} />
                    </div>

                    <h4 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-2 mt-8">Chỉ số rủi ro & Sự cố</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ComparisonCard 
                            title="Đơn Huỷ (Do Shop)" 
                            valueA={metricsA.totalCancelledBySeller} 
                            valueB={metricsB.totalCancelledBySeller} 
                            type="bad" 
                            icon={XCircle} 
                        />
                        <ComparisonCard title="Đơn Hoàn Về" valueA={metricsA.totalReturned} valueB={metricsB.totalReturned} type="bad" icon={ArrowDownRight} />
                        <ComparisonCard title="Lệch Kiểm Kê" valueA={metricsA.totalDiscrepancy} valueB={metricsB.totalDiscrepancy} type="neutral" icon={ClipboardList} />
                    </div>
                </>
            )}
        </div>
    );
};

export default ComparisonReport;