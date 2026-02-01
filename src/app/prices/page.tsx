'use client'

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AlertForm from '@/components/AlertForm';
import { INDIAN_LOCATIONS } from '@/constants/locations';
import { INDIAN_LANGUAGES, TRANSLATIONS } from '@/constants/languages';
import { Bell, X, LogOut, MessageSquare, ChevronLeft, ChevronRight, Search, Globe, Moon, Sun, User, Clock, Check } from 'lucide-react';

interface PriceRecord {
    market: string;
    state?: string;
    commodity: string;
    min_price: string;
    max_price: string;
    modal_price: string;
    arrival_date: string;
}

// Icon mapping for different commodities
const getCropIcon = (commodity: string) => {
    const name = commodity.toLowerCase();
    if (name.includes('cotton')) return { icon: '🌿', bg: 'bg-blue-50 dark:bg-blue-500/10' };
    if (name.includes('wheat')) return { icon: '🌾', bg: 'bg-amber-50 dark:bg-amber-500/10' };
    if (name.includes('rice') || name.includes('paddy')) return { icon: '🍚', bg: 'bg-yellow-50 dark:bg-yellow-500/10' };
    if (name.includes('onion')) return { icon: '🧅', bg: 'bg-red-50 dark:bg-red-500/10' };
    if (name.includes('potato')) return { icon: '🥔', bg: 'bg-amber-50 dark:bg-amber-500/10' };
    if (name.includes('tomato')) return { icon: '🍅', bg: 'bg-red-50 dark:bg-red-500/10' };
    if (name.includes('carrot')) return { icon: '🥕', bg: 'bg-orange-50 dark:bg-orange-500/10' };
    if (name.includes('castor')) return { icon: '🌱', bg: 'bg-emerald-50 dark:bg-emerald-500/10' };
    if (name.includes('maize') || name.includes('corn')) return { icon: '🌽', bg: 'bg-yellow-50 dark:bg-yellow-500/10' };
    if (name.includes('soyabean') || name.includes('soybean')) return { icon: '🫘', bg: 'bg-green-50 dark:bg-green-500/10' };
    if (name.includes('groundnut') || name.includes('peanut')) return { icon: '🥜', bg: 'bg-amber-50 dark:bg-amber-500/10' };
    return { icon: '🌱', bg: 'bg-emerald-50 dark:bg-emerald-500/10' };
};

// Status badges
const getStatus = (index: number, t: (k: string) => string) => {
    const statuses = [
        { label: t('steady') || 'STEADY', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10' },
        { label: t('rising') || 'RISING', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
        { label: t('stable') || 'STABLE', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
        { label: t('falling') || 'FALLING', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
    ];
    return statuses[index % statuses.length];
};

// Modal price color based on trend
const getModalColor = (index: number) => {
    const colors = ['text-green-500', 'text-blue-500', 'text-emerald-500', 'text-amber-500'];
    return colors[index % colors.length];
};

function PricesContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [selectedState, setSelectedState] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [showLangModal, setShowLangModal] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [records, setRecords] = useState<PriceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [darkMode, setDarkMode] = useState(false);
    const [lang, setLang] = useState('en');
    const itemsPerPage = 10;
    const profileRef = useRef<HTMLDivElement>(null);

    // Translation helper
    const t = (key: string) => {
        return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en'][key] || key;
    };

    // State Translation Helper
    const tState = (stateName: string) => {
        if (!stateName) return '';
        return TRANSLATIONS[lang]?.states?.[stateName] || stateName;
    };

    useEffect(() => {
        // Read from URL params on mount
        const urlState = searchParams.get('state');
        const urlDistrict = searchParams.get('district');

        if (urlState) setSelectedState(urlState);
        if (urlDistrict) setSelectedDistrict(urlDistrict);

        checkAuth();
        
        // Fetch prices on mount with URL params
        const fetchInitial = async () => {
            const params = new URLSearchParams();
            if (urlState) params.set('state', urlState);
            if (urlDistrict) params.set('district', urlDistrict);

            const url = `/api/prices?${params.toString()}`;
            console.log('[Frontend] Initial fetch from:', url);
            
            try {
                const res = await fetch(url, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    console.log('[Frontend] Initial received data:', data);
                    setRecords(Array.isArray(data.records) ? data.records : []);
                } else {
                    console.error('[Frontend] Initial API error:', res.status);
                    setRecords([]);
                }
            } catch (error) {
                console.error('[Frontend] Initial fetch failed:', error);
                setRecords([]);
            }
            setLoading(false);
        };
        
        fetchInitial();

        // Close profile menu on click outside
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchParams]);

    // Only fetch when user manually changes state/district (not on initial mount)
    useEffect(() => {
        // Skip initial mount (when both are empty and we haven't fetched yet)
        if (!selectedState && !selectedDistrict && records.length === 0) {
            return;
        }
        
        console.log('[Frontend] State/District changed, fetching new data:', { selectedState, selectedDistrict });
        fetchPrices();
    }, [selectedState, selectedDistrict]);

    const checkAuth = async (urlState?: string | null, urlDistrict?: string | null) => {
        try {
            const res = await fetch('/api/auth/me', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                
                // Auto-fill state and district from user's registration data if not provided in URL
                if (!urlState && data.user.location?.state) {
                    setSelectedState(data.user.location.state);
                }
                if (!urlDistrict && data.user.location?.district) {
                    setSelectedDistrict(data.user.location.district);
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    };

    const fetchPrices = async (state?: string, district?: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            
            // Use provided state/district or fall back to selected ones
            const stateToUse = state || selectedState;
            const districtToUse = district || selectedDistrict;
            
            if (stateToUse) params.set('state', stateToUse);
            if (districtToUse) params.set('district', districtToUse);

            const url = `/api/prices?${params.toString()}`;
            console.log('[Frontend] Fetching prices from:', url);
            const res = await fetch(url, { credentials: 'include' });
            
            if (res.ok) {
                const data = await res.json();
                console.log('[Frontend] Received data:', data);
                console.log('[Frontend] Received', data.records?.length || 0, 'records');
                setRecords(Array.isArray(data.records) ? data.records : []);
            } else {
                console.error('[Frontend] API returned status:', res.status);
                const errorData = await res.json().catch(() => ({}));
                console.error('[Frontend] Error response:', errorData);
                setRecords([]);
            }
        } catch (error) {
            console.error('[Frontend] Failed to fetch prices:', error);
            setRecords([]);
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            router.push('/home');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };



    useEffect(() => {
        // Initialize dark mode from localStorage
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'dark') {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const districts = INDIAN_LOCATIONS[selectedState] || [];

    // Filter by search query
    const filteredRecords = records.filter((r) =>
        r.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.market.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

    const now = new Date();
    const lastUpdated = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }) + ', ' + now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    return (
        <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-slate-900' : 'bg-gray-50'}`}>
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <div className="flex items-center gap-2">
                        <div className="bg-green-600 p-1.5 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xl">🌾</span>
                        </div>
                        <h1 className="font-bold text-lg tracking-tight text-slate-800 dark:text-white">{t('appTitle')}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-green-500 transition-all"
                            >
                                <span className="text-slate-500 text-xl">👤</span>
                            </button>

                            {/* Dropdown Menu */}
                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden z-50">
                                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                            {user?.name || 'User'}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {user?.email || user?.phone}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => router.push('/profile')}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                    >
                                        <User className="w-4 h-4" />
                                        {t('profile')}
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {t('logout')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-lg mx-auto px-4 py-6 pb-24">
                {/* Live Badge */}
                <div className="flex items-center gap-2 mb-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-green-500">{t('liveData')}</span>
                </div>

                {/* Title Section */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('mainTitle')}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {t('subTitle')}
                    </p>
                </div>

                {/* Last Updated */}
                <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {t('lastUpdated')}: {lastUpdated}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <button
                        onClick={() => setShowLangModal(true)}
                        className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-3 rounded-xl font-semibold text-sm shadow-sm text-slate-800 dark:text-white"
                    >
                        <Globe className="w-5 h-5 text-slate-500" />
                        <span>{t('language')}</span>
                    </button>
                    <button
                        onClick={() => setShowAlertModal(true)}
                        className="flex items-center justify-center gap-2 bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm shadow-lg shadow-orange-600/20"
                    >
                        <MessageSquare className="w-5 h-5" />
                        <span>{t('settings')}</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="space-y-3 mb-8">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute top-2 left-3 z-10">
                                {t('selectState')}
                            </label>
                            <select
                                value={selectedState}
                                onChange={(e) => {
                                    setSelectedState(e.target.value);
                                    setSelectedDistrict('');
                                }}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pt-7 pb-2 px-3 rounded-xl text-sm appearance-none focus:ring-orange-500 focus:border-orange-500 text-slate-800 dark:text-white"
                            >
                                <option value="">{t('allStates')}</option>
                                {Object.keys(INDIAN_LOCATIONS).map((s) => (
                                    <option key={s} value={s}>{tState(s)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute top-2 left-3 z-10">
                                {t('selectDistrict')}
                            </label>
                            <select
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                                disabled={!selectedState}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pt-7 pb-2 px-3 rounded-xl text-sm appearance-none focus:ring-orange-500 focus:border-orange-500 text-slate-800 dark:text-white disabled:opacity-50"
                            >
                                <option value="">{t('allDistricts')}</option>
                                {districts.map((d: string) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('searchPlaceholder')}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-3.5 pl-10 pr-4 rounded-xl text-sm focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400 text-slate-800 dark:text-white"
                        />
                    </div>
                </div>

                {/* Results Header */}
                <div className="flex items-center justify-between px-1 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-orange-500">📊</span>
                        <h3 className="font-bold text-slate-800 dark:text-white">{t('mandiPrices')}</h3>
                    </div>
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                        {filteredRecords.length} {t('resultsFound')}
                    </span>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 animate-pulse">
                                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
                                <div className="h-12 bg-slate-100 dark:bg-slate-700 rounded mb-4"></div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded"></div>
                                    <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded"></div>
                                    <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🔍</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('noData')}</h3>
                        <p className="text-slate-500 text-sm">{t('tryDemo')}</p>
                    </div>
                ) : (
                    <>
                        {/* Price Cards */}
                        <div className="space-y-4">
                            {paginatedRecords.map((record, index) => {
                                const cropStyle = getCropIcon(record.commodity);
                                const status = getStatus(index, t);
                                const modalColor = getModalColor(index);

                                return (
                                    <div
                                        key={`${record.market}-${record.commodity}-${index}`}
                                        className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm"
                                    >
                                        {/* Card Header */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-white text-base">
                                                    {record.market} APMC
                                                </h4>
                                                <p className="text-xs text-slate-500">{tState(record.state || selectedState) || 'India'}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-md ${status.bg} ${status.color} text-[10px] font-bold tracking-wider uppercase`}>
                                                {status.label}
                                            </span>
                                        </div>

                                        {/* Crop Info */}
                                        <div className="flex items-center gap-3 mb-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                            <div className={`h-10 w-10 ${cropStyle.bg} rounded-full flex items-center justify-center text-xl`}>
                                                {cropStyle.icon}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{t('crop')}</p>
                                                <p className="font-bold text-slate-800 dark:text-white">{record.commodity}</p>
                                            </div>
                                        </div>

                                        {/* Prices */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="text-center">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t('min')}</p>
                                                <p className="font-bold text-slate-800 dark:text-white">
                                                    ₹{Number(record.min_price).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t('max')}</p>
                                                <p className="font-bold text-slate-800 dark:text-white">
                                                    ₹{Number(record.max_price).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t('modal')}</p>
                                                <p className={`font-bold ${modalColor}`}>
                                                    ₹{Number(record.modal_price).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                            <span className="text-[10px] font-medium text-slate-400">
                                                {t('date')}: {record.arrival_date}
                                            </span>
                                            {/* Details button removed as per request */}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 disabled:opacity-50"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>

                                {[...Array(Math.min(3, totalPages))].map((_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold text-sm ${currentPage === pageNum
                                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                {totalPages > 3 && (
                                    <>
                                        <span className="text-slate-400 px-1">...</span>
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm"
                                        >
                                            {totalPages}
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Language Modal */}
            {showLangModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
                            <h3 className="font-bold text-lg dark:text-white">{t('language')}</h3>
                            <button onClick={() => setShowLangModal(false)}>
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-2 gap-1 grid grid-cols-1">
                            {INDIAN_LANGUAGES.map((l) => (
                                <button
                                    key={l.code}
                                    onClick={() => {
                                        setLang(l.code);
                                        setShowLangModal(false);
                                    }}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-left font-medium transition-colors ${lang === l.code
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                        }`}
                                >
                                    <span>{l.name}</span>
                                    {lang === l.code && <Check className="w-5 h-5" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Alert Modal */}
            {showAlertModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <button
                            onClick={() => setShowAlertModal(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full z-10"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                        <AlertForm
                            onSuccess={() => setShowAlertModal(false)}
                            user={user}
                            state={selectedState}
                            district={selectedDistrict}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PricesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading prices...</p>
                </div>
            </div>
        }>
            <PricesContent />
        </Suspense>
    );
}
