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

    try {
        let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=2000`;

        if (state) {
            url += `&filters[state]=${encodeURIComponent(state)}`;
        }
        if (district) {
            url += `&filters[district]=${encodeURIComponent(district)}`;
        }

        console.log('Fetching from gov API:', url.replace(apiKey, '***'));
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Gov API returned status ${response.statusText}. The state/district filter may not exist in the dataset.`);
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Gov API response received with', data.records?.length || 0, 'records');
        return data.records || [];
    } catch (error) {
        console.error('Error fetching mandi prices:', error);
        console.log('Falling back to MOCK DATA due to error');
        let data = MOCK_DATA;
        if (state) data = data.filter(r => r.state.toLowerCase() === state.toLowerCase());
        if (district) data = data.filter(r => r.district.toLowerCase() === district.toLowerCase());
        return data;
    }
}
