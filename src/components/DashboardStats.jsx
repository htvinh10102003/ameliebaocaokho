import React from 'react';
import { Package, Truck, AlertCircle } from 'lucide-react';

const DashboardStats = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Tổng đơn */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Tổng đơn đã in</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</h3>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Package className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
            </div>
            {/* Đơn đã đi */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Đơn đã đi</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.shipped}</h3>
                        <p className="text-sm text-green-600 mt-1 font-medium">
                            {stats.total > 0 ? Math.round((stats.shipped / stats.total) * 100) : 0}% hoàn thành
                        </p>
                        <p className="text-sm text-gray-500">*Số lượng đơn đi có thể ít hơn so với thực tế do đơn đi chỉ lọc dựa theo đơn in</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                        <Truck className="h-6 w-6 text-green-600" />
                    </div>
                </div>
            </div>

            {/* Đơn tồn */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Đơn chưa đi (Đơn tồn)</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.pending}</h3>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded-lg">
                        <AlertCircle className="h-6 w-6 text-yellow-600" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardStats;
