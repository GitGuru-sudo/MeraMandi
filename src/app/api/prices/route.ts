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
        
        let errorMessage = 'Unable to load prices at this moment';
        let statusCode = 500;

        if (error instanceof Error) {
            if (error.message.includes('timeout') || error.message.includes('AbortError')) {
                errorMessage = 'Request timeout. Please try again or refresh the page.';
                statusCode = 504;
            } else if (error.message.includes('API key')) {
                errorMessage = 'API configuration error. Please contact administrator.';
                statusCode = 503;
            } else if (error.message.includes('Government API')) {
                errorMessage = 'Government API is currently unavailable. Please try again later.';
                statusCode = 503;
            } else {
                errorMessage = error.message;
            }
        }
        
        return NextResponse.json(
            { 
                records: [], 
                error: errorMessage
            }, 
            { status: statusCode }
        );
    }
}

