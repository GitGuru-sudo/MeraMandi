'use client'

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, Globe, TrendingUp } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
];

const translations: Record<string, { tagline: string; seePrice: string; welcome: string }> = {
  en: { tagline: 'Get notified when crop prices rise', seePrice: 'See Prices', welcome: 'Welcome to' },
  hi: { tagline: 'जब फसल की कीमतें बढ़ें तो सूचना पाएं', seePrice: 'भाव देखें', welcome: 'आपका स्वागत है' },
  pa: { tagline: 'ਜਦੋਂ ਫ਼ਸਲ ਦੀਆਂ ਕੀਮਤਾਂ ਵਧਣ ਤਾਂ ਸੂਚਨਾ ਪ੍ਰਾਪਤ ਕਰੋ', seePrice: 'ਭਾਅ ਵੇਖੋ', welcome: 'ਜੀ ਆਇਆਂ ਨੂੰ' },
  mr: { tagline: 'पीक किमती वाढल्यावर सूचना मिळवा', seePrice: 'भाव पहा', welcome: 'स्वागत आहे' },
  gu: { tagline: 'જ્યારે પાકના ભાવ વધે ત્યારે સૂચના મેળવો', seePrice: 'ભાવ જુઓ', welcome: 'સ્વાગત છે' },
  bn: { tagline: 'ফসলের দাম বাড়লে বিজ্ঞপ্তি পান', seePrice: 'দাম দেখুন', welcome: 'স্বাগতম' },
  ta: { tagline: 'பயிர் விலை உயரும்போது அறிவிப்பு பெறுங்கள்', seePrice: 'விலை பார்க்க', welcome: 'வரவேற்கிறோம்' },
  te: { tagline: 'పంట ధరలు పెరిగినప్పుడు నోటిఫికేషన్ పొందండి', seePrice: 'ధరలు చూడండి', welcome: 'స్వాగతం' },
  kn: { tagline: 'ಬೆಳೆ ಬೆಲೆಗಳು ಏರಿದಾಗ ಅಧಿಸೂಚನೆ ಪಡೆಯಿರಿ', seePrice: 'ಬೆಲೆ ನೋಡಿ', welcome: 'ಸ್ವಾಗತ' },
};

export default function HomePage() {
  const [selectedLang, setSelectedLang] = useState('en');
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const t = translations[selectedLang];
  const currentLangData = languages.find(l => l.code === selectedLang);

  return (
    <main className="home-page">
      {/* Background Image */}
      <div className="bg-image">
        <Image
          src="/Background.webp"
          alt="Farm background"
          fill
          className="object-cover"
          priority
        />
        <div className="bg-overlay"></div>
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-brand">
            <Image src="/logo.png" alt="MeraMandi" width={45} height={45} className="rounded-lg" />
            <span className="brand-name">MeraMandi</span>
          </div>

          {/* Language Selector */}
          <div className="lang-selector">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="lang-button"
            >
              <Globe className="w-5 h-5" />
              <span>{currentLangData?.native}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {langMenuOpen && (
              <div className="lang-dropdown">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLang(lang.code);
                      setLangMenuOpen(false);
                    }}
                    className={`lang-option ${selectedLang === lang.code ? 'active' : ''}`}
                  >
                    <span className="lang-native">{lang.native}</span>
                    <span className="lang-name">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="hero-content">
        <p className="welcome-text">{t.welcome}</p>
        <h1 className="hero-title">MeraMandi</h1>
        <p className="hero-tagline">{t.tagline}</p>

        <Link href="/prices" className="cta-button">
          <span className="btn-bg"></span>
          <span className="btn-content">
            <TrendingUp className="w-6 h-6" />
            <span>{t.seePrice}</span>
          </span>
          <span className="btn-shine"></span>
        </Link>
      </div>

      <style jsx>{`
        .home-page {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .bg-image {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        .bg-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.3) 0%,
            rgba(0, 0, 0, 0.5) 50%,
            rgba(0, 0, 0, 0.7) 100%
          );
        }

        .navbar {
          position: relative;
          z-index: 50;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .nav-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .brand-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .lang-selector {
          position: relative;
        }

        .lang-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 0.5rem;
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .lang-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .lang-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          min-width: 180px;
          animation: dropIn 0.2s ease-out;
        }

        @keyframes dropIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .lang-option {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background 0.2s;
        }

        .lang-option:hover {
          background: #f0fdf4;
        }

        .lang-option.active {
          background: #dcfce7;
        }

        .lang-native {
          font-weight: 600;
          color: #166534;
        }

        .lang-name {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .hero-content {
          position: relative;
          z-index: 10;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
        }

        .welcome-text {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.125rem;
          margin-bottom: 0.5rem;
          animation: fadeInUp 0.8s ease-out;
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 800;
          color: white;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          margin-bottom: 1rem;
          animation: fadeInUp 0.8s ease-out 0.2s backwards;
        }

        .hero-tagline {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.9);
          max-width: 500px;
          margin-bottom: 2.5rem;
          animation: fadeInUp 0.8s ease-out 0.4s backwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .cta-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 1.25rem 2.5rem;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border-radius: 9999px;
          overflow: hidden;
          animation: fadeInUp 0.8s ease-out 0.6s backwards;
          transition: all 0.3s ease;
          text-decoration: none;
          box-shadow: 0 10px 40px rgba(34, 197, 94, 0.4);
        }

        .btn-bg {
          display: none;
        }

        .btn-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: white;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .btn-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          animation: shine 3s ease-in-out infinite;
        }

        @keyframes shine {
          0% { left: -100%; }
          50%, 100% { left: 100%; }
        }

        .cta-button:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 15px 50px rgba(34, 197, 94, 0.5);
        }

        .cta-button:active {
          transform: translateY(-2px) scale(1.02);
        }

        @media (max-width: 640px) {
          .hero-title {
            font-size: 2.5rem;
          }
          .hero-tagline {
            font-size: 1rem;
          }
          .brand-name {
            display: none;
          }
          .lang-button span {
            display: none;
          }
          .cta-button {
            padding: 1rem 2rem;
          }
          .btn-content {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </main>
  );
}
