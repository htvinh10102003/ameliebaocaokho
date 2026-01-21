import React from 'react';
import { Calendar, X } from 'lucide-react';

const FilterBar = ({ 
    filterDateStart, setFilterDateStart,
    filterDateEnd, setFilterDateEnd,
    onReset 
}) => {
    // Lấy ngày hiện tại (YYYY-MM-DD) để làm giới hạn
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-6">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                
                {/* Nhóm trái: Ngày tháng & Reset */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-gray-50 border border-gray-300 rounded-md px-2 py-1">
                            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 font-semibold leading-none">Từ ngày</span>
                                <input
                                    type="date"
                                    className="bg-transparent border-none p-0 text-xs font-medium focus:ring-0 text-gray-700 h-5"
                                    value={filterDateStart}
                                    max={today} // Chặn chọn ngày tương lai
                                    onChange={(e) => setFilterDateStart(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <span className="text-gray-400">-</span>

                        <div className="flex items-center bg-gray-50 border border-gray-300 rounded-md px-2 py-1">
                            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 font-semibold leading-none">Đến ngày</span>
                                <input
                                    type="date"
                                    className="bg-transparent border-none p-0 text-xs font-medium focus:ring-0 text-gray-700 h-5"
                                    value={filterDateEnd}
                                    max={today} // Chặn chọn ngày tương lai
                                    onChange={(e) => setFilterDateEnd(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Nút Reset */}
                    <button 
                        onClick={onReset}
                        className="flex-none flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 text-xs font-medium transition"
                        title="Xóa bộ lọc"
                    >
                        <X className="h-3 w-3" />
                        <span>Xóa lọc</span>
                    </button>
                </div>

                {/* Nhóm phải: Branding Text */}
                <div className="w-full md:w-auto text-center md:text-right">
                    <span className="text-[10px] sm:text-xs font-bold text-gray-400 tracking-widest uppercase bg-gray-50 px-2 py-1 rounded border border-gray-100">
                        DESIGNED BY HO TA VINH
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
