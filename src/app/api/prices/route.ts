import { NextRequest, NextResponse } from 'next/server';
import { fetchMandiPrices } from '@/services/govApi';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get('state') || undefined;
    const district = searchParams.get('district') || undefined;

    const apiKey = process.env.GOV_API_KEY;

    console.log('[Prices API] Request received with:', { state, district, hasApiKey: !!apiKey });

    try {
        if (!apiKey) {
            console.error('[Prices API] GOV_API_KEY environment variable is not set');
            return NextResponse.json(
                { 
                    records: [], 
                    error: 'API key is not configured. Please contact administrator.' 
                }, 
                { status: 503 }
            );
        }

        const records = await fetchMandiPrices(apiKey, state, district);
        console.log('[Prices API] Successfully retrieved', records.length, 'records');
        
        return NextResponse.json({ records, total: records.length });
    } catch (error) {
        console.error('[Prices API] Error fetching prices:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch prices';
        
        return NextResponse.json(
            { 
                records: [], 
                error: errorMessage
            }, 
            { status: 500 }
        );
    }
}

