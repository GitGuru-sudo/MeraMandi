export interface MandiRecord {
    state: string;
    district: string;
    market: string;
    commodity: string;
    variety: string;
    min_price: string;
    max_price: string;
    modal_price: string;
    arrival_date: string;
}

const TODAY = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY

const MOCK_DATA: MandiRecord[] = [
    {
        state: 'Haryana',
        district: 'Hisar',
        market: 'Adampur',
        commodity: 'Cotton',
        variety: 'American',
        min_price: '5800',
        max_price: '6200',
        modal_price: '6000',
        arrival_date: TODAY,
    },
    {
        state: 'Haryana',
        district: 'Hisar',
        market: 'Hisar',
        commodity: 'Wheat',
        variety: 'HD-2967',
        min_price: '2400',
        max_price: '2500',
        modal_price: '2450',
        arrival_date: TODAY,
    },
    {
        state: 'Punjab',
        district: 'Bathinda',
        market: 'Bathinda',
        commodity: 'Wheat',
        variety: 'Other',
        min_price: '2350',
        max_price: '2450',
        modal_price: '2400',
        arrival_date: TODAY,
    },
];

export async function fetchMandiPrices(apiKey?: string, state?: string, district?: string): Promise<MandiRecord[]> {
    // If no API key is provided, return mock data for development
    console.log('fetchMandiPrices called with:', { apiKey: !!apiKey, state, district, useMockData: process.env.USE_MOCK_DATA });
    
    if (!apiKey || process.env.USE_MOCK_DATA === 'true') {
        console.log('Using MOCK DATA for Mandi Prices...');
        let data = MOCK_DATA;
        if (state) data = data.filter(r => r.state.toLowerCase() === state.toLowerCase());
        if (district) data = data.filter(r => r.district.toLowerCase() === district.toLowerCase());
        console.log('Returning mock data with', data.length, 'records');
        return data;
    }

    // Retry logic for API calls
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // NOTE: Gov API doesn't support server-side filtering reliably, so we fetch all data and filter client-side
            const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=2000`;

            console.log(`Fetching from gov API (attempt ${attempt}/${maxRetries}): [Fetching all records, will filter client-side for state=${state}, district=${district}]`);
            
            // Add timeout and better error handling for Vercel
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            
            try {
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'application/json',
                        'Accept-Encoding': 'gzip, deflate',
                    },
                    // Disable keepalive which can cause connection resets
                    keepalive: false,
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    console.error(`Gov API returned status ${response.statusText}`);
                    throw new Error(`Failed to fetch data: ${response.statusText}`);
                }

                let data = await response.json();
                let records = data.records || [];
                console.log(`✅ Gov API response received with ${records.length} total records`);
                
                // Apply client-side filtering (Gov API filtering doesn't work reliably)
                if (state) {
                    records = records.filter((r: MandiRecord) => r.state?.toLowerCase() === state.toLowerCase());
                }
                if (district) {
                    records = records.filter((r: MandiRecord) => r.district?.toLowerCase() === district.toLowerCase());
                }
                
                console.log(`After filtering by state=${state}, district=${district}: ${records.length} records`);
                return records;
            } catch (fetchError: any) {
                clearTimeout(timeoutId);
                lastError = fetchError;
                
                if (fetchError.name === 'AbortError') {
                    console.error(`Attempt ${attempt}: Request timeout after 15s`);
                } else {
                    console.error(`Attempt ${attempt}: ${fetchError.message}`);
                }
                
                // Don't retry on last attempt
                if (attempt < maxRetries) {
                    const waitTime = attempt * 1000; // 1s, 2s backoff
                    console.log(`Retrying in ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed:`, error);
            
            if (attempt < maxRetries) {
                const waitTime = attempt * 1000;
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    // All retries failed, fall back to mock data
    console.error('❌ All API attempts failed, falling back to MOCK DATA');
    if (lastError) {
        console.error('Last error:', lastError.message || lastError);
    }
    
    let data = MOCK_DATA;
    if (state) data = data.filter(r => r.state.toLowerCase() === state.toLowerCase());
    if (district) data = data.filter(r => r.district.toLowerCase() === district.toLowerCase());
    return data;
}
