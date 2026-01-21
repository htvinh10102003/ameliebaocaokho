import { parseCSV, parseDate } from '../utils/helpers';

const SHEET_IN_ID = "16uPRX6vf6hT7knpGlMpZL_SjDp4rVMYHn475fsER8EM";
const SHEET_DI_ID = "1-ZJZx4dAuN0yqv9gbbjkVT-qL-a2hLVUc0J7xqKpMGI";
const SHEET_NHANH_ID = "1c_nIDmOUZ9pv7pC1WTzL6aoirVTiM23_4uJK-2PVUfY"; 
const SHEET_HOAN_ID = "1OaFrl-uHwRo1XPHwtd7dPxUbwb9zxnKBomMTBAZOZqQ";
const SHEET_KIEMKE_ID = "1tZF434b3NVXiHre_dXa5wfyahmf6We713uuWM_u3woE";
const SHEET_HUY_ID = "1f_cwggWwiT5QDCSxfAoo6bUdKcForpD4DII1toJw8gM"; 

const URL_DON_IN = `https://docs.google.com/spreadsheets/d/${SHEET_IN_ID}/export?format=csv`;
const URL_DON_DI = `https://docs.google.com/spreadsheets/d/${SHEET_DI_ID}/export?format=csv`;
const URL_NHANH = `https://docs.google.com/spreadsheets/d/${SHEET_NHANH_ID}/export?format=csv`;
const URL_HOAN = `https://docs.google.com/spreadsheets/d/${SHEET_HOAN_ID}/export?format=csv`;
const URL_KIEMKE = `https://docs.google.com/spreadsheets/d/${SHEET_KIEMKE_ID}/export?format=csv`;
const URL_HUY = `https://docs.google.com/spreadsheets/d/${SHEET_HUY_ID}/export?format=csv`;

const findKey = (row, keywords) => {
    const keys = Object.keys(row);
    return keys.find(key => keywords.every(k => key.includes(k))) || '';
};

const determineCarrier = (trackingCode) => {
    if (!trackingCode) return 'GHN'; 
    const code = trackingCode.toString().toUpperCase().trim();
    if (code.startsWith('58')) return 'JT';
    if (code.startsWith('25')) return 'SPX';
    if (code.startsWith('12')) return 'VTP';
    if (code.startsWith('LM')) return 'Lazada';
    if (code.startsWith('SP')) return 'SPX';
    if (code.startsWith('6')) return 'TVC';
    if (code.startsWith('8')) return 'JT';
    return 'GHN';
};

const determineReturnGroup = (trackingCode) => {
    if (!trackingCode) return 'Đơn hoàn không thêm được BBBG';
    const code = trackingCode.toString().toUpperCase().trim();
    if (code.startsWith('58') || code.startsWith('25')) {
        return 'Đơn hoàn sàn';
    }
    return 'Đơn hoàn không thêm được BBBG';
};

// [CẬP NHẬT] Hàm phân loại lý do huỷ chính xác hơn
const categorizeCancellation = (reason) => {
    const lowerReason = reason.toLowerCase();
    let group = 'Tự động huỷ bởi hệ thống Shopee'; // Mặc định cho các lý do khác
    let detail = reason;

    // 1. Phân loại Huỷ bởi người bán (Chỉ 3 lý do cụ thể)
    if (
        lowerReason.includes('người bán không gửi hàng đúng hạn') || 
        lowerReason.includes('người bán không xử lý đơn hàng đúng hạn') ||
        lowerReason.includes('người bán không trả lời thắc mắc')
    ) {
        group = 'Huỷ bởi người bán';
    } 
    // 2. Phân loại Huỷ bởi người mua
    else if (lowerReason.includes('người mua')) {
        group = 'Huỷ bởi người mua';
    }
    // 3. Còn lại (Khác) -> Tự động huỷ bởi hệ thống Shopee

    if (reason.includes(':')) {
        detail = reason.split(':')[1].trim();
    } else if (reason.includes('-')) {
        detail = reason.split('-')[1].trim();
    }

    return { group, detail };
};

export const fetchLogisticsData = async () => {
    try {
        const [resIn, resDi, resNhanh, resHoan, resKiemKe, resHuy] = await Promise.all([
            fetch(URL_DON_IN),
            fetch(URL_DON_DI),
            fetch(URL_NHANH),
            fetch(URL_HOAN),
            fetch(URL_KIEMKE),
            fetch(URL_HUY)
        ]);

        const textIn = await resIn.text();
        const textDi = await resDi.text();
        const textNhanh = await resNhanh.text();
        const textHoan = await resHoan.text();
        const textKiemKe = await resKiemKe.text();
        const textHuy = await resHuy.text();

        const dataIn = parseCSV(textIn);
        const dataDiRaw = parseCSV(textDi);
        const dataNhanh = parseCSV(textNhanh);
        const dataHoanRaw = parseCSV(textHoan);
        const dataKiemKeRaw = parseCSV(textKiemKe);
        const dataHuyRaw = parseCSV(textHuy);

        // --- XỬ LÝ ĐƠN IN (chỉ lấy dữ liệu hợp lệ) ---
        const dataInMap = new Map();
        const sampleRowIn = dataIn[0] || {};
        const keysIn = Object.keys(sampleRowIn);
        let colCodeIn = findKey(sampleRowIn, ['mã', 'đơn']);
        let colDateIn = findKey(sampleRowIn, ['ngày']);
        let colCarrierIn = findKey(sampleRowIn, ['đvvc']) || findKey(sampleRowIn, ['vận', 'chuyển']);
        
        if (!colCodeIn && keysIn.length >= 3) { 
            colDateIn = keysIn[0]; 
            colCarrierIn = keysIn[1]; 
            colCodeIn = keysIn[2]; 
        }

        // Lọc chỉ lấy dòng có mã hợp lệ
        dataIn.forEach(item => {
            const code = item[colCodeIn] ? item[colCodeIn].trim() : '';
            // Chỉ lấy mã hợp lệ: có mã, độ dài >= 5, có chứa số
            if (code && code.length >= 5 && /\d/.test(code)) {
                dataInMap.set(code, { 
                    date: item[colDateIn], 
                    carrier: item[colCarrierIn] 
                });
            }
        });

        console.log("Số mã đơn in hợp lệ:", dataInMap.size);

        // --- XỬ LÝ ĐƠN ĐI (clean dữ liệu) ---
        const dataDiMap = new Map();
        const sampleRowDi = dataDiRaw[0] || {};
        const keysDi = Object.keys(sampleRowDi);
        let colCodeDi = findKey(sampleRowDi, ['mã', 'đơn']); 
        let colDateDi = findKey(sampleRowDi, ['ngày']);      
        let colCarrierDi = findKey(sampleRowDi, ['đvvc']) || findKey(sampleRowDi, ['vận', 'chuyển']); 
        
        if (!colCodeDi && keysDi.length >= 3) { 
            colDateDi = keysDi[0]; 
            colCarrierDi = keysDi[1]; 
            colCodeDi = keysDi[2]; 
        }
        
        dataDiRaw.forEach(row => {
            let code = row[colCodeDi];
            if (code) {
                const cleanCode = code.toString().trim();
                // Chỉ lấy mã hợp lệ, bỏ qua tiêu đề và dòng trống
                if (cleanCode && cleanCode.length >= 5 && /\d/.test(cleanCode)) {
                    if (!dataDiMap.has(cleanCode)) { 
                        dataDiMap.set(cleanCode, { 
                            date: row[colDateDi], 
                            carrier: row[colCarrierDi] 
                        }); 
                    }
                }
            }
        });

        console.log("Số mã đơn đi hợp lệ:", dataDiMap.size);

        // --- XỬ LÝ ĐƠN NHÁNH ---
        const dataNhanhMap = new Map();
        const sampleRowNhanh = dataNhanh[0] || {};
        const keysNhanh = Object.keys(sampleRowNhanh);
        let colCodeNhanh = findKey(sampleRowNhanh, ['mã', 'đơn']);
        let colStatusNhanh = findKey(sampleRowNhanh, ['trạng', 'thái']);
        
        if (!colCodeNhanh && keysNhanh.length > 0) colCodeNhanh = keysNhanh.find(k => k.includes('mã')) || keysNhanh[0];
        if (!colStatusNhanh && keysNhanh.length > 1) colStatusNhanh = keysNhanh.find(k => k.includes('trạng')) || keysNhanh[1];
        
        dataNhanh.forEach(row => {
            let code = row[colCodeNhanh];
            let status = row[colStatusNhanh];
            if (code && code.trim() !== '') { 
                dataNhanhMap.set(code.trim(), status || 'Chưa cập nhật'); 
            }
        });

        console.log("Số mã đơn nhánh:", dataNhanhMap.size);

        // --- TẠO MAIN DATA (CHỈ TỪ ĐƠN IN) ---
        const mainData = [];
        
        // Chỉ lấy đơn từ sheet đơn in làm gốc
        dataInMap.forEach((inInfo, code) => {
            const diInfo = dataDiMap.get(code);
            const nhanhStatus = dataNhanhMap.get(code);
            
            let carrier = inInfo.carrier;
            if (!carrier || carrier.trim() === '' || carrier.toLowerCase() === 'không xác định') { 
                carrier = determineCarrier(code); 
            }
            
            const internalStatus = diInfo ? 'Đã đi' : 'Chưa đi';
            
            mainData.push({ 
                id: code, 
                date: inInfo.date, 
                dateObj: parseDate(inInfo.date), 
                carrier: carrier, 
                trackingCode: code, 
                internalStatus: internalStatus, 
                nhanhStatus: nhanhStatus || 'Chưa có thông tin' 
            });
        });

        console.log("Tổng đơn trong mainData (chỉ từ đơn in):", mainData.length);
        console.log("Số đơn đã đi:", mainData.filter(item => item.internalStatus === 'Đã đi').length);
        console.log("Số đơn chưa đi:", mainData.filter(item => item.internalStatus === 'Chưa đi').length);

        // --- XỬ LÝ ĐƠN HOÀN ---
        const returnData = [];
        const sampleRowHoan = dataHoanRaw[0] || {};
        let colCodeHoan = findKey(sampleRowHoan, ['mã', 'đơn']);
        let colDateHoan = findKey(sampleRowHoan, ['ngày']);
        let colProductHoan = findKey(sampleRowHoan, ['sản', 'phẩm']) || findKey(sampleRowHoan, ['mã', 'sp']);
        let colQtyHoan = findKey(sampleRowHoan, ['số', 'lượng']);
        
        let lastHoanCode = '';
        let lastHoanDate = '';
        
        dataHoanRaw.forEach(row => {
            let code = row[colCodeHoan];
            let date = row[colDateHoan];
            let product = row[colProductHoan];
            let qty = row[colQtyHoan] || '1';
            
            if (code && code.trim() !== '') { 
                lastHoanCode = code.trim(); 
                lastHoanDate = date; 
            }
            
            if (lastHoanCode && product && product.trim() !== '') {
                returnData.push({ 
                    id: lastHoanCode + '-' + product, 
                    date: lastHoanDate, 
                    dateObj: parseDate(lastHoanDate), 
                    trackingCode: lastHoanCode, 
                    product: product, 
                    quantity: parseInt(qty) || 1, 
                    carrier: determineCarrier(lastHoanCode), 
                    group: determineReturnGroup(lastHoanCode) 
                });
            }
        });

        // --- XỬ LÝ KIỂM KÊ ---
        const inventoryData = [];
        const sampleRowKK = dataKiemKeRaw[0] || {};
        let colDateKK = findKey(sampleRowKK, ['ngày']);
        let colProductKK = findKey(sampleRowKK, ['mã', 'sản', 'phẩm']) || findKey(sampleRowKK, ['mã', 'sp']);
        let colCountKK = findKey(sampleRowKK, ['số', 'kiểm', 'kê']) || findKey(sampleRowKK, ['sl', 'kiểm']);
        let colDiffKK = findKey(sampleRowKK, ['chênh', 'lệch']);
        
        dataKiemKeRaw.forEach((row, idx) => {
            const product = row[colProductKK];
            const date = row[colDateKK];
            if (product && date) {
                inventoryData.push({ 
                    id: `kk-${idx}`, 
                    date: date, 
                    dateObj: parseDate(date), 
                    productCode: product, 
                    count: parseInt(row[colCountKK]) || 0, 
                    discrepancy: parseInt(row[colDiffKK]) || 0 
                });
            }
        });

        // --- XỬ LÝ ĐƠN HUỶ ---
        const cancelledData = [];
        const sampleRowHuy = dataHuyRaw[0] || {};
        let colDateHuy = findKey(sampleRowHuy, ['ngày']);
        let colCodeHuy = findKey(sampleRowHuy, ['mã', 'đơn']);
        let colProductHuy = findKey(sampleRowHuy, ['mã', 'sản', 'phẩm']) || findKey(sampleRowHuy, ['mã', 'sp']);
        let colQtyHuy = findKey(sampleRowHuy, ['số', 'lượng']);
        let colReasonHuy = findKey(sampleRowHuy, ['lý', 'do']);

        let lastHuyCode = '';
        let lastHuyDate = '';
        let lastHuyReason = '';

        dataHuyRaw.forEach((row, idx) => {
            let code = row[colCodeHuy];
            let date = row[colDateHuy];
            let reasonRaw = row[colReasonHuy];
            let product = row[colProductHuy];
            let qty = row[colQtyHuy] || '1';

            if (code && code.trim() !== '') {
                lastHuyCode = code.trim();
                lastHuyDate = date;
                lastHuyReason = reasonRaw;
            }

            if (lastHuyCode && product) {
                const { group, detail } = categorizeCancellation(lastHuyReason || '');
                cancelledData.push({
                    id: `huy-${idx}`,
                    date: lastHuyDate,
                    dateObj: parseDate(lastHuyDate),
                    orderCode: lastHuyCode,
                    productCode: product,
                    quantity: parseInt(qty) || 1,
                    reasonGroup: group,
                    reasonDetail: detail,
                    originalReason: lastHuyReason
                });
            }
        });

        return { 
            mainData,  // Chỉ chứa đơn từ sheet đơn in (~6049)
            returnData, 
            inventoryData, 
            cancelledData 
        };
        
    } catch (error) {
        console.error("Lỗi fetch data:", error);
        throw new Error("Không thể tải dữ liệu.");
    }
};

