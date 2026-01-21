export const parseCSV = (text) => {
    const cleanText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const rows = [];
    let currentRow = [];
    let currentVal = '';
    let inQuote = false;
    
    for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        const nextChar = cleanText[i + 1];
        
        if (inQuote) {
            if (char === '"' && nextChar === '"') {
                currentVal += '"';
                i++;
            } else if (char === '"') {
                inQuote = false;
            } else {
                currentVal += char;
            }
        } else {
            if (char === '"') {
                inQuote = true;
            } else if (char === ',') {
                currentRow.push(currentVal);
                currentVal = '';
            } else if (char === '\n') {
                currentRow.push(currentVal);
                rows.push(currentRow);
                currentRow = [];
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
    }
    if (currentVal || currentRow.length > 0) {
        currentRow.push(currentVal);
        rows.push(currentRow);
    }

    let headerIndex = 0;
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const rowString = rows[i].join(',').toLowerCase();
        if ((rowString.includes('mã') && rowString.includes('đơn')) || rowString.includes('ngày') || rowString.includes('đvvc') || rowString.includes('trạng thái')) {
             if (rows[i].length >= 2) { // Giảm điều kiện xuống >=2 cột để linh hoạt
                headerIndex = i;
                break;
             }
        }
    }

    const headers = rows[headerIndex].map(h => 
        h.trim().replace(/^"|"$/g, '').toLowerCase()
    );
    
    return rows.slice(headerIndex + 1).map(values => {
        const entry = {};
        headers.forEach((header, index) => {
            if (header) {
                entry[header] = values[index] ? values[index].trim() : '';
            }
        });
        return entry;
    });
};

export const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    return new Date(dateStr); // Fallback cho format yyyy-mm-dd
};
