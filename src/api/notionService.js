// Đã điền thông tin của bạn
const NOTION_KEY = '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'; 
const DATABASE_ID = '2ed7a0423c688030afdae2069c428d00'; 

// Đường dẫn này sẽ được Vercel Rewrites xử lý
const PROXY_URL = '/api/notion-proxy'; 

const headers = {
    'Authorization': `Bearer ${NOTION_KEY}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
};

const handleResponse = async (response) => {
    if (!response.ok) {
        let errorMsg = response.statusText;
        try {
            const errData = await response.json();
            errorMsg = errData.message || JSON.stringify(errData);
        } catch (e) {
            try {
                const text = await response.text();
                if (text) errorMsg = text;
            } catch (ex) { /* ignore */ }
        }
        throw new Error(`Lỗi Notion (${response.status}): ${errorMsg}`);
    }
    return await response.json();
};

export const fetchNoteByDate = async (dateStr) => {
    try {
        const response = await fetch(`${PROXY_URL}/databases/${DATABASE_ID}/query`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                filter: {
                    property: "Date",
                    title: {
                        equals: dateStr
                    }
                }
            })
        });

        const data = await handleResponse(response);
        
        if (data.results.length > 0) {
            const page = data.results[0];
            const contentArray = page.properties.Content?.rich_text || [];
            const content = contentArray.map(t => t.plain_text).join('');
            return { id: page.id, content: content };
        }
        return null;
    } catch (error) {
        console.error("Fetch note error:", error);
        throw error;
    }
};

export const saveNote = async (dateStr, content, pageId = null) => {
    try {
        const bodyData = {
            properties: {
                Date: {
                    title: [
                        { text: { content: dateStr } }
                    ]
                },
                Content: {
                    rich_text: [
                        { text: { content: content } }
                    ]
                }
            }
        };

        let url = `${PROXY_URL}/pages`;
        let method = 'POST';

        if (pageId) {
            url = `${PROXY_URL}/pages/${pageId}`;
            method = 'PATCH';
        } else {
            bodyData.parent = { database_id: DATABASE_ID };
        }

        const response = await fetch(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(bodyData)
        });

        return await handleResponse(response);
    } catch (error) {
        console.error("Save note error:", error);
        throw error;
    }
};