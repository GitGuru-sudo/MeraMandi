'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PriceList from '@/components/PriceList';
import { INDIAN_LOCATIONS } from '@/constants/locations';

export default function PricesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isDark, setIsDark] = useState(() => {
        if (typeof document === 'undefined') return false;
        return document.documentElement.classList.contains('dark');
    });
    const [language, setLanguage] = useState<'en' | 'hi'>(() => {
        try {
            const saved = window.localStorage.getItem('language');
            if (saved === 'en' || saved === 'hi') return saved;
        } catch {
        }
        return 'en';
    });

    const translations = {
        en: {
            liveData: 'Live Data',
            title: 'Live Mandi Prices',
            description:
                'Real-time commodity prices tracked across government-regulated Indian markets. Monitor daily fluctuations and market trends accurately.',
            lastUpdated: 'Last Updated:',
            exportCsv: 'Export CSV',
            smsAlerts: 'SMS Alerts',
            selectState: 'Select State',
            allStates: 'All States',
            selectDistrict: 'Select District',
            allDistricts: 'All Districts',
            searchCrop: 'Search Crop',
            searchPlaceholder: 'Search commodity (e.g. Potato, Onion, Wheat...)',
            backToHome: 'Back to Home',
            language: 'Language',
        },
        hi: {
            liveData: 'लाइव डेटा',
            title: 'लाइव मंडी भाव',
            description:
                'सरकारी-नियंत्रित भारतीय बाजारों में रियल-टाइम कृषि जिंसों के भाव। रोज़ाना उतार-चढ़ाव और बाज़ार रुझानों को सटीक रूप से देखें।',
            lastUpdated: 'अंतिम अपडेट:',
            exportCsv: 'CSV डाउनलोड',
            smsAlerts: 'SMS अलर्ट',
            selectState: 'राज्य चुनें',
            allStates: 'सभी राज्य',
            selectDistrict: 'जिला चुनें',
            allDistricts: 'सभी जिले',
            searchCrop: 'फसल खोजें',
            searchPlaceholder: 'जिंस खोजें (जैसे आलू, प्याज, गेहूं...)',
            backToHome: 'होम पर वापस',
            language: 'भाषा',
        },
    } as const;

    const t = (key: keyof typeof translations.en) => translations[language][key];

    const [selectedState, setSelectedState] = useState(searchParams.get('state') || '');
    const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get('district') || '');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('mandi') || '');

    const districts = selectedState ? (INDIAN_LOCATIONS[selectedState] || []) : [];

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newState = e.target.value;
        setSelectedState(newState);
        setSelectedDistrict('');

        const params = new URLSearchParams();
        if (newState) params.set('state', newState);
        router.push(`/prices?${params.toString()}`);
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDistrict = e.target.value;
        setSelectedDistrict(newDistrict);

        const params = new URLSearchParams();
        if (selectedState) params.set('state', selectedState);
        if (newDistrict) params.set('district', newDistrict);
        router.push(`/prices?${params.toString()}`);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        const params = new URLSearchParams();
        if (selectedState) params.set('state', selectedState);
        if (selectedDistrict) params.set('district', selectedDistrict);
        if (query) params.set('mandi', query);
        router.push(`/prices?${params.toString()}`);
    };

    const toggleDarkMode = () => {
        setIsDark(!isDark);
        if (!isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const currentDate = new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <>
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => router.push('/home')}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                aria-label={t('backToHome')}
                                type="button"
                            >
                                <span className="material-symbols-outlined text-lg">arrow_back</span>
                            </button>
                            <div className="w-10 h-10 bg-amber-700 flex items-center justify-center rounded-lg shadow-lg">
                                <span className="material-symbols-outlined text-white">agriculture</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight text-amber-700 dark:text-amber-600">Mera Mandi</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <select
                                    value={language}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setLanguage(value as 'en' | 'hi');
                                        try {
                                            window.localStorage.setItem('language', value);
                                        } catch {
                                        }
                                    }}
                                    className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-600 transition-colors cursor-pointer outline-none"
                                    aria-label={t('language')}
                                >
                                    <option value="en">English</option>
                                    <option value="hi">Hindi</option>
                                </select>
                            </div>
                            <button
                                onClick={toggleDarkMode}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">
                                    {isDark ? 'light_mode' : 'dark_mode'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">{t('liveData')}</span>
                        </div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{t('title')}</h1>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
                            {t('description')}
                        </p>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 shadow-sm">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            <span className="font-bold">{t('lastUpdated')}</span>
                            <span>{currentDate}</span>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium hover:border-amber-700 dark:hover:border-amber-600 transition-all group shadow-sm">
                                <span className="material-symbols-outlined text-lg text-slate-400 group-hover:text-amber-700">file_download</span>
                                {t('exportCsv')}
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-amber-700 text-white rounded-xl text-sm font-semibold hover:bg-amber-800 transition-all shadow-lg active:scale-95">
                                <span className="material-symbols-outlined text-lg">sms</span>
                                {t('smsAlerts')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="mb-8">
                    <div className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap lg:flex-nowrap items-center gap-6">
                        {/* State Select */}
                        <div className="w-full lg:w-48 shrink-0">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">
                                {t('selectState')}
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedState}
                                    onChange={handleStateChange}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-4 pr-10 text-sm focus:ring-2 focus:ring-amber-700/20 appearance-none cursor-pointer"
                                >
                                    <option value="">{t('allStates')}</option>
                                    {Object.keys(INDIAN_LOCATIONS).map((st) => (
                                        <option key={st} value={st}>{st}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                            </div>
                        </div>

                        {/* District Select */}
                        <div className="w-full lg:w-48 shrink-0">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">
                                {t('selectDistrict')}
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedDistrict}
                                    onChange={handleDistrictChange}
                                    disabled={!selectedState}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-4 pr-10 text-sm focus:ring-2 focus:ring-amber-700/20 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">{t('allDistricts')}</option>
                                    {districts.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="flex-grow">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">
                                {t('searchCrop')}
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-amber-700/20"
                                    placeholder={t('searchPlaceholder')}
                                />
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Price List */}
                <PriceList
                    state={selectedState || undefined}
                    district={selectedDistrict || undefined}
                    mandi={searchQuery || undefined}
                />
            </main>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-12 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-amber-700 flex items-center justify-center rounded-lg">
                                <span className="material-symbols-outlined text-white text-sm">agriculture</span>
                            </div>
                            <span className="text-lg font-bold text-amber-700 dark:text-amber-600">Mera Mandi</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Connecting farmers with real-time market insights. Our platform aggregates data from APMC centers across India to provide transparent pricing.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">Quick Links</h4>
                        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                            <li><a className="hover:text-amber-700 transition-colors" href="#">Market Analysis</a></li>
                            <li><a className="hover:text-amber-700 transition-colors" href="#">Historical Data</a></li>
                            <li><a className="hover:text-amber-700 transition-colors" href="#">Commodity News</a></li>
                            <li><a className="hover:text-amber-700 transition-colors" href="#">Support Center</a></li>
                        </ul>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-2xl">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Subscribe to Daily Prices</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Get daily price updates for your favorite mandis directly on your WhatsApp or via SMS.</p>
                        <form className="flex gap-2">
                            <input
                                className="flex-1 bg-white dark:bg-slate-800 border-none rounded-xl text-sm px-4 focus:ring-2 focus:ring-amber-700/20"
                                placeholder="Mobile Number"
                                type="tel"
                            />
                            <button className="bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-800 transition-all">
                                Join
                            </button>
                        </form>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-400">© 2026 Mera Mandi - Empowering Agriculture with Data.</p>
                    <div className="flex gap-6 text-xs text-slate-400 font-medium">
                        <a className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors" href="#">Privacy Policy</a>
                        <a className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors" href="#">Terms of Service</a>
                        <a className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors" href="#">Government API Source</a>
                    </div>
                </div>
            </footer>
        </>
    );
}
