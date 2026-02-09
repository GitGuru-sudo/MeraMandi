export const INDIAN_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'bn', name: 'Bengali' },
    { code: 'te', name: 'Telugu' },
    { code: 'mr', name: 'Marathi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'ur', name: 'Urdu' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'or', name: 'Odia' },
    { code: 'as', name: 'Assamese' },
    { code: 'mai', name: 'Maithili' },
    { code: 'sat', name: 'Santali' },
    { code: 'ks', name: 'Kashmiri' },
    { code: 'ne', name: 'Nepali' },
    { code: 'sd', name: 'Sindhi' },
    { code: 'do', name: 'Dogri' },
    { code: 'kok', name: 'Konkani' },
    { code: 'mni', name: 'Manipuri' },
    { code: 'brx', name: 'Bodo' },
    { code: 'sa', name: 'Sanskrit' }
];

const en = {
    appTitle: 'Meri Mandi',
    liveData: 'Live Data',
    mainTitle: 'Live Mandi Prices',
    subTitle: 'Real-time commodity prices tracked across government-regulated Indian markets.',
    lastUpdated: 'Last Updated',
    language: 'Language',
    settings: 'SMS Alerts',
    selectState: 'Select State',
    selectDistrict: 'Select District',
    allStates: 'All States',
    allDistricts: 'All Districts',
    searchPlaceholder: 'Search commodity (e.g. Potato, Onion...)',
    mandiPrices: 'Mandi Prices',
    resultsFound: 'results found',
    noData: 'No Data Found',
    noDataDesc: 'No recent price data found for selected location.',
    tryDemo: 'Select a state and district to view live prices.',
    crop: 'Crop',
    min: 'Min',
    max: 'Max',
    modal: 'Market Rate',
    date: 'Date',
    details: 'Details',
    loading: 'Loading prices...',
    steady: 'STEADY',
    rising: 'RISING',
    stable: 'STABLE',
    falling: 'FALLING',
    logout: 'Logout',
    profile: 'Profile',
    welcome: 'Welcome',
    login: 'Login',
    states: {} // English uses original names
};

const hi = {
    appTitle: 'मेरी मंडी',
    liveData: 'लाइव डेटा',
    mainTitle: 'मंडी भाव लाइव',
    subTitle: 'सरकारी मंडियों के ताजा भाव।',
    lastUpdated: 'अंतिम अपडेट',
    language: 'भाषा',
    settings: 'एसएमएस अलर्ट',
    selectState: 'राज्य चुनें',
    selectDistrict: 'ज़िला चुनें',
    allStates: 'सभी राज्य',
    allDistricts: 'सभी ज़िले',
    searchPlaceholder: 'फसल खोजें (जैसे आलू, प्याज...)',
    mandiPrices: 'मंडी भाव',
    resultsFound: 'परिणाम मिले',
    noData: 'कोई डेटा नहीं मिला',
    noDataDesc: 'चयनित स्थान के लिए कोई ताज़ा भाव नहीं मिला।',
    tryDemo: 'लाइव भाव देखने के लिए राज्य और ज़िला चुनें।',
    crop: 'फसल',
    min: 'न्यूनतम',
    max: 'अधिकतम',
    modal: 'बाज़ार भाव',
    date: 'दिनांक',
    details: 'विवरण',
    loading: 'भाव लोड हो रहे हैं...',
    steady: 'स्थिर',
    rising: 'बढ़ रहा है',
    stable: 'मजबूत',
    falling: 'गिर रहा है',
    logout: 'लॉग आउट',
    profile: 'प्रोफ़ाइल',
    welcome: 'स्वागत है',
    login: 'लॉग इन',
    states: {
        "Andhra Pradesh": "आंध्र प्रदेश",
        "Arunachal Pradesh": "अरुणाचल प्रदेश",
        "Assam": "असम",
        "Bihar": "बिहार",
        "Chhattisgarh": "छत्तीसगढ़",
        "Goa": "गोवा",
        "Gujarat": "गुजरात",
        "Haryana": "हरियाणा",
        "Himachal Pradesh": "हिमाचल प्रदेश",
        "Jharkhand": "झारखंड",
        "Karnataka": "कर्नाटक",
        "Kerala": "केरल",
        "Madhya Pradesh": "मध्य प्रदेश",
        "Maharashtra": "महाराष्ट्र",
        "Manipur": "मणिपुर",
        "Meghalaya": "मेघालय",
        "Mizoram": "मिजोरम",
        "Nagaland": "नागालैंड",
        "Odisha": "ओडिशा",
        "Punjab": "पंजाब",
        "Rajasthan": "राजस्थान",
        "Sikkim": "सिक्किम",
        "Tamil Nadu": "तमिलनाडु",
        "Telangana": "तेलंगाना",
        "Tripura": "त्रिपुरा",
        "Uttar Pradesh": "उत्तर प्रदेश",
        "Uttarakhand": "उत्तराखंड",
        "West Bengal": "पश्चिम बंगाल"
    }
};

const mr = {
    ...en,
    appTitle: 'मेरी मंडी',
    liveData: 'थेट डेटा',
    mainTitle: 'मंडी भाव लाइव',
    language: 'भाषा',
    selectState: 'राज्य निवडा',
    selectDistrict: 'जिल्हा निवडा',
    allStates: 'सर्व राज्ये',
    allDistricts: 'सर्व जिल्हे',
    searchPlaceholder: 'पीक शोधा (उदा. बटाटा, कांदा...)',
    crop: 'पीक',
    min: 'किमान',
    max: 'कमाल',
    modal: 'बाजार भाव',
    date: 'तारीख',
    loading: 'भाव लोड होत आहेत...',
    logout: 'लॉग आउट',
    profile: 'प्रोफाइल',
    states: hi.states // Marathi uses similar names usually, sharing for simplicity or can override
};

const pa = {
    ...en,
    appTitle: 'ਮੇਰੀ ਮੰਡੀ',
    liveData: 'ਲਾਈਵ',
    mainTitle: 'ਮੰਡੀ ਭਾਅ',
    language: 'ਭਾਸ਼ਾ',
    selectState: 'ਰਾਜ ਚੁਣੋ',
    selectDistrict: 'ਜ਼ਿਲ੍ਹਾ ਚੁਣੋ',
    allStates: 'ਸਾਰੇ ਰਾਜ',
    crop: 'ਫਸਲ',
    min: 'ਘੱਟੋ-ਘੱਟ',
    max: 'ਵੱਧ ਤੋਂ ਵੱਧ',
    modal: 'ਬਾਜ਼ਾਰ ਭਾਅ',
    date: 'ਮਿਤੀ',
    states: {
        "Punjab": "ਪੰਜਾਬ",
        "Haryana": "ਹਰਿਆਣਾ",
        "Rajasthan": "ਰਾਜਸਥਾਨ"
    }
};

const gu = {
    ...en,
    appTitle: 'મેરી મંડી',
    liveData: 'લાઈવ ડેટા',
    mainTitle: 'મંડી ભાવ',
    language: 'ભાષા',
    selectState: 'રાજ્ય પસંદ કરો',
    selectDistrict: 'જિલ્લો પસંદ કરો',
    crop: 'પાક',
    min: 'લઘુત્તમ',
    max: 'મહત્તમ',
    modal: 'બજાર ભાવ',
    states: {
        "Gujarat": "ગુજરાત"
    }
};

const bn = {
    ...en,
    appTitle: 'মেরি মান্ডি',
    liveData: 'লাইভ ডেটা',
    mainTitle: 'মান্ডি বাজার',
    language: 'ভাষা',
    crop: 'ফসল',
    min: 'সর্বনিম্ন',
    max: 'সর্বোচ্চ',
    modal: 'বাজার দর'
};

const te = {
    ...en,
    appTitle: 'మేరీ మండి',
    liveData: 'లైవ్ డేటా',
    language: 'భాష',
    selectState: 'రాష్ట్రం ఎంచుకోండి',
    crop: 'పంట',
    min: 'కనిష్ట',
    max: 'గరిష్ట',
    modal: 'మార్కెట్ ధర'
};

const ta = {
    ...en,
    appTitle: 'மேரி மண்டி',
    liveData: 'நிகழ்நேரம்',
    language: 'மொழி',
    crop: 'பயிர்',
    min: 'குறைந்தபட்ச',
    max: 'அதிகபட்ச',
    modal: 'சந்தை விலை'
};

const kn = {
    ...en,
    appTitle: 'ಮೇರಿ ಮಂಡಿ',
    language: 'ಭಾಷೆ',
    crop: 'ಬೆಳೆ',
    min: 'ಕನಿಷ್ಠ',
    max: 'ಗರಿಷ್ಠ',
    modal: 'ಮಾರುಕಟ್ಟೆ ದರ'
};

const ml = {
    ...en,
    appTitle: 'മേരി മണ്ഡി',
    language: 'ഭാഷ',
    crop: 'വിള',
    min: 'കുറഞ്ഞ',
    max: 'കൂടിയ',
    modal: 'വിപണി നിരക്ക്'
};

export const TRANSLATIONS: Record<string, any> = {
    en,
    hi,
    mr,
    pa,
    gu,
    bn,
    te,
    ta,
    kn,
    ml,
    // Fallbacks for others
    ur: { ...en, language: 'اردو' },
    or: { ...en, language: 'ଓଡ଼ିଆ' },
    as: { ...en, language: 'অসমীয়া' },
    mai: { ...en, language: 'मैथिली' },
    sat: { ...en, language: 'संताली' },
    ks: { ...en, language: 'कश्मीरी' },
    ne: { ...en, language: 'नेपाली' },
    sd: { ...en, language: 'सिंधी' },
    do: { ...en, language: 'डोगरी' },
    kok: { ...en, language: 'कोंकणी' },
    mni: { ...en, language: 'মণিপুরী' },
    brx: { ...en, language: 'बड़ो' },
    sa: { ...en, language: 'संस्कृतम्' }
};
