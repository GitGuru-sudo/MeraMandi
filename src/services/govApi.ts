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
        arrival_date: '24/01/2026',
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
        arrival_date: '24/01/2026',
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
        arrival_date: '24/01/2026',
    },
];

export async function fetchMandiPrices(apiKey?: string, state?: string, district?: string): Promise<MandiRecord[]> {
    // If no API key is provided, return mock data for development
    if (!apiKey || process.env.USE_MOCK_DATA === 'true') {
        console.log('Using MOCK DATA for Mandi Prices...');
        let data = MOCK_DATA;
        if (state) data = data.filter(r => r.state.toLowerCase() === state.toLowerCase());
        if (district) data = data.filter(r => r.district.toLowerCase() === district.toLowerCase());
        return data;
    }

    try {
        let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=2000`; // Increased limit

        if (state) {
            url += `&filters[state]=${encodeURIComponent(state)}`;
        }
        if (district) {
            url += `&filters[district]=${encodeURIComponent(district)}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();
        return data.records || [];
    } catch (error) {
        console.error('Error fetching mandi prices:', error);
        return [];
    }
}
