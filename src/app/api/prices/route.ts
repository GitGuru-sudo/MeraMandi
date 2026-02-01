import { NextRequest, NextResponse } from 'next/server';
import { fetchMandiPrices } from '@/services/govApi';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get('state') || undefined;
    const district = searchParams.get('district') || undefined;

    const apiKey = process.env.GOV_API_KEY;

    console.log('[Prices API] Request received with:', { state, district, hasApiKey: !!apiKey });

    try {
        const records = await fetchMandiPrices(apiKey, state, district);
        console.log('[Prices API] Returning', records.length, 'records');
        return NextResponse.json({ records });
    } catch (error) {
        console.error('[Prices API] Error fetching prices:', error);
        return NextResponse.json({ records: [], error: 'Failed to fetch prices' }, { status: 500 });
    }
}
