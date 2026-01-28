'use client'

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const router = useRouter();
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
      router.push('/home');
    }, 3500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="splash-screen">
      <div className={`gradient-overlay ${animationComplete ? 'fade-out' : ''}`} />

      <div className="logo-container">
        <Image
          src="/logo.png"
          alt="MeraMandi"
          width={180}
          height={180}
          className="logo-image"
          priority
        />
      </div>

      <h1 className="brand-title">MeraMandi</h1>

      <div className="loading-dots">
        <span />
        <span />
        <span />
      </div>

      {/* ✅ See Prices Button */}
      {animationComplete && (
        <button
          className="see-prices-btn"
          onClick={() => router.push('/home')}
        >
          See Prices
        </button>
      )}

      <style jsx>{`
        .splash-screen {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #ffffff, #ecfdf5, #dcfce7);
          overflow: hidden;
        }

        .gradient-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #0a0a0a, #1a1a2e, #16213e);
          animation: revealBackground 2.5s ease-out forwards;
          z-index: 1;
        }

        .fade-out {
          animation: fadeOut 0.5s ease-out forwards !important;
        }

        @keyframes revealBackground {
          from { clip-path: circle(150% at 50% 50%); }
          to { clip-path: circle(0% at 50% 50%); opacity: 0; }
        }

        @keyframes fadeOut {
          to { opacity: 0; }
        }

        .logo-container {
          z-index: 10;
          animation: logoEntrance 1s ease-out forwards, pulse 2s ease-in-out 1s infinite;
        }

        @keyframes logoEntrance {
          0% { opacity: 0; transform: scale(0.3) rotate(-10deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }

        @keyframes pulse {
          50% { transform: scale(1.08); }
        }

        .brand-title {
          z-index: 10;
          font-size: 2.5rem;
          font-weight: 800;
          color: #166534;
          margin-top: 1.5rem;
          opacity: 0;
          animation: slideUp 0.8s ease-out 0.5s forwards;
        }

        .loading-dots {
          z-index: 10;
          display: flex;
          gap: 8px;
          margin-top: 2rem;
          opacity: 0;
          animation: slideUp 0.8s ease-out 0.8s forwards;
        }

        .loading-dots span {
          width: 12px;
          height: 12px;
          background: #22c55e;
          border-radius: 50%;
          animation: bounce 1.4s infinite;
        }

        .see-prices-btn {
          z-index: 10;
          margin-top: 2.5rem;
          padding: 12px 28px;
          font-size: 1.1rem;
          font-weight: 600;
          background: #16a34a;
          color: white;
          border: none;
          border-radius: 999px;
          cursor: pointer;
          animation: fadeIn 0.6s ease-out forwards;
        }

        .see-prices-btn:hover {
          background: #15803d;
          transform: scale(1.05);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes bounce {
          40% { transform: translateY(-12px); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
