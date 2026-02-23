'use client';

import { useEffect, useState } from 'react';

interface PriceRecord {
    market: string;
    state?: string;
    commodity: string;
    min_price: string;
    max_price: string;
    modal_price: string;
    arrival_date: string;
}

interface Props {
    state?: string;
    district?: string;
    mandi?: string;
    records?: PriceRecord[];
}

// Icon mapping for different commodities
const getCropIcon = (commodity: string) => {
    const name = commodity.toLowerCase();
    if (name.includes('cotton')) return { icon: '🌿', bg: 'bg-green-100', color: 'text-green-600' };
    if (name.includes('wheat')) return { icon: '🌾', bg: 'bg-amber-100', color: 'text-amber-600' };
    if (name.includes('rice') || name.includes('paddy')) return { icon: '🍚', bg: 'bg-yellow-100', color: 'text-yellow-600' };
    if (name.includes('onion')) return { icon: '🧅', bg: 'bg-red-100', color: 'text-red-600' };
    if (name.includes('potato')) return { icon: '🥔', bg: 'bg-amber-100', color: 'text-amber-700' };
    if (name.includes('tomato')) return { icon: '🍅', bg: 'bg-red-100', color: 'text-red-500' };
    if (name.includes('carrot')) return { icon: '🥕', bg: 'bg-orange-100', color: 'text-orange-600' };
    if (name.includes('banana')) return { icon: '🍌', bg: 'bg-yellow-100', color: 'text-yellow-600' };
    if (name.includes('apple')) return { icon: '🍎', bg: 'bg-red-100', color: 'text-red-500' };
    if (name.includes('mango')) return { icon: '🥭', bg: 'bg-orange-100', color: 'text-orange-500' };
    if (name.includes('chilli') || name.includes('pepper')) return { icon: '🌶️', bg: 'bg-red-100', color: 'text-red-600' };
    if (name.includes('maize') || name.includes('corn')) return { icon: '🌽', bg: 'bg-yellow-100', color: 'text-yellow-600' };
    if (name.includes('soyabean') || name.includes('soybean')) return { icon: '🫘', bg: 'bg-green-100', color: 'text-green-600' };
    if (name.includes('groundnut') || name.includes('peanut')) return { icon: '🥜', bg: 'bg-amber-100', color: 'text-amber-700' };
    if (name.includes('mustard')) return { icon: '🌻', bg: 'bg-yellow-100', color: 'text-yellow-600' };
    if (name.includes('sugarcane')) return { icon: '🎋', bg: 'bg-green-100', color: 'text-green-600' };
    return { icon: '🌱', bg: 'bg-emerald-100', color: 'text-emerald-600' };
};

// Random status for demo
const getStatus = (index: number) => {
    const statuses = [
        { label: 'Steady', bg: 'bg-green-100', color: 'text-green-700' },
        { label: 'Rising', bg: 'bg-blue-100', color: 'text-blue-700' },
        { label: 'Stable', bg: 'bg-amber-100', color: 'text-amber-700' },
        { label: 'Falling', bg: 'bg-red-100', color: 'text-red-700' },
    ];
    return statuses[index % statuses.length];
};

export default function PriceList({ state, district, mandi, records = [] }: Props) {
    const [displayRecords, setDisplayRecords] = useState<PriceRecord[]>(records);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        // Fetch data on client side
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                if (state) params.set('state', state);
                if (district) params.set('district', district);

                const res = await fetch(`/api/prices?${params.toString()}`);
                const data = await res.json();

                if (res.ok) {
                    let filtered = data.records || [];

                    if (mandi) {
                        filtered = filtered.filter((r: PriceRecord) =>
                            r.market.toLowerCase().includes(mandi.toLowerCase())
                        );
                    }

                    // Sort by Mandi Name
                    filtered.sort((a: PriceRecord, b: PriceRecord) => a.market.localeCompare(b.market));

                    setDisplayRecords(filtered);
                } else {
                    setError(data.error || 'Failed to load prices');
                    setDisplayRecords([]);
                }
            } catch (error) {
                console.error('Failed to fetch prices:', error);
                setError('Unable to load prices. Please check your internet connection and refresh.');
                setDisplayRecords([]);
            }
            setLoading(false);
        };

        fetchData();
    }, [state, district, mandi]);

    const totalPages = Math.ceil(displayRecords.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRecords = displayRecords.slice(startIndex, startIndex + itemsPerPage);

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-48 mx-auto"></div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded"></div>
                        ))}
                    </div>
                </div>
                <p className="text-green-700 dark:text-green-400 mt-6 font-medium">Loading latest prices...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900 shadow-sm overflow-hidden">
                <div className="px-6 py-8 text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Unable to Load Prices</h3>
                    <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                    <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 text-left text-sm text-red-700 dark:text-red-300 space-y-2">
                        <p className="font-semibold flex items-start gap-2">Please check:</p>
                        <ul className="space-y-1 text-red-600 dark:text-red-400">
                            <li>• Internet connection is active</li>
                            <li>• API key is properly configured</li>
                            <li>• Try selecting a different state/district</li>
                            <li>• Refresh the page to retry</li>
                        </ul>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-green-600">Live Data</span>
                        <span className="text-slate-300 px-1">•</span>
                        <span className="text-xs text-slate-500">
                            {state ? `${state}${district ? ` - ${district}` : ''}` : 'All States'}
                        </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        📊 Mandi Prices
                    </h2>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                    {displayRecords.length} results found
                </div>
            </div>

            {displayRecords.length === 0 ? (
                <div className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🔍</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No Data Found</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                        No recent price data found for {state || 'selected'} {district ? `- ${district}` : ''}.
                        <br />
                        <span className="text-xs mt-2 block text-slate-400">Try selecting &quot;Haryana&quot; and &quot;Hisar&quot; for demo data.</span>
                    </p>
                </div>
            ) : (
                <>
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Mandi</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Crop</th>
                                    <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest">Min (₹)</th>
                                    <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest">Max (₹)</th>
                                    <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest">Modal (₹)</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {paginatedRecords.map((record, index) => {
                                    const cropStyle = getCropIcon(record.commodity);
                                    const status = getStatus(index);
                                    return (
                                        <tr
                                            key={index}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100">{record.market}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">{record.state || state || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-lg ${cropStyle.bg} flex items-center justify-center text-lg`}>
                                                        {cropStyle.icon}
                                                    </div>
                                                    <span className="font-medium text-slate-800 dark:text-slate-200">{record.commodity}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-sm text-slate-600 dark:text-slate-400">
                                                ₹{Number(record.min_price).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-sm text-slate-600 dark:text-slate-400">
                                                ₹{Number(record.max_price).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-green-700 font-mono text-base">
                                                    ₹{Number(record.modal_price).toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                {record.arrival_date}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${status.bg} ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Showing <span className="font-semibold text-slate-900 dark:text-white">{startIndex + 1}</span> to{' '}
                            <span className="font-semibold text-slate-900 dark:text-white">{Math.min(startIndex + itemsPerPage, displayRecords.length)}</span> of{' '}
                            <span className="font-semibold text-slate-900 dark:text-white">{displayRecords.length}</span> entries
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-300"
                            >
                                Previous
                            </button>
                            {[...Array(Math.min(3, totalPages))].map((_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${currentPage === pageNum
                                            ? 'border-green-700 bg-green-700 text-white'
                                            : 'border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 dark:text-slate-300'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            {totalPages > 3 && <span className="px-2 text-slate-400">...</span>}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-300"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Footer */}
            <div className="px-6 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-400">
                    Source: data.gov.in (Agmarknet) • Updated Daily at 11:30 AM
                </p>
            </div>
        </div>
    );
}
