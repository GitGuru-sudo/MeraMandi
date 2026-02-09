'use client'

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Loader2, Leaf, ArrowRight } from 'lucide-react';
import { INDIAN_LOCATIONS } from '@/constants/locations';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: any) => void;
}

type AuthMode = 'login' | 'register';

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
    const [mode, setMode] = useState<AuthMode>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPhoneError, setShowPhoneError] = useState(false);
    const [showForgotError, setShowForgotError] = useState(false);

    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [state, setState] = useState('');
    const [district, setDistrict] = useState('');
    const [mandi, setMandi] = useState('');

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setError('');
            setLoading(false);
            setShowPhoneError(false);
        }
    }, [isOpen]);

    const districts = state ? INDIAN_LOCATIONS[state] || [] : [];

    const handlePhoneLogin = () => {
        // Show graceful JSON error for phone login
        setShowPhoneError(true);
        setShowForgotError(false);
        setError('');
    };

    const handleForgotPassword = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowForgotError(true);
        setShowPhoneError(false);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setShowPhoneError(false);
        setLoading(true);

        try {
            if (mode === 'login') {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email, password }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Login failed');
                }

                onSuccess(data.user);
            } else {
                // Validate required fields for registration
                if (!phone || !name || !email || !password || !state || !district || !mandi) {
                    throw new Error('Please fill in all fields');
                }

                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        phone,
                        name,
                        email,
                        password,
                        state,
                        district,
                        mandi,
                    }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Registration failed');
                }

                onSuccess(data.user);
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="auth-overlay">
            {/* Background Image */}
            <div className="auth-bg">
                <div className="auth-bg-gradient"></div>
            </div>

            {/* Content Container - Centered */}
            <div className="auth-container">
                {/* Language Toggle */}
                <div className="lang-toggle">
                    <button className="lang-btn active">English</button>
                    <button className="lang-btn">Hindi</button>
                </div>

                {/* Logo & Brand */}
                <div className="brand-section">
                    <div className="logo-icon">
                        <Leaf className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="brand-title">
                        Meri<span className="text-green-400">Mandi</span>
                    </h1>
                    <p className="brand-tagline">Your digital gateway to fresh produce</p>
                </div>

                {/* Glass Card */}
                <div className="glass-card" onClick={(e) => e.stopPropagation()}>
                    {/* Error Message */}
                    {error && (
                        <div className="error-box">
                            {error}
                        </div>
                    )}

                    {/* Phone Login JSON Error */}
                    {showPhoneError && (
                        <div className="json-error">
                            <pre>{JSON.stringify({
                                status: "coming_soon",
                                code: "PHONE_LOGIN_NOT_AVAILABLE",
                                message: "Phone login is coming soon!",
                                suggestion: "Please use email to login for now.",
                                eta: "Q2 2026"
                            }, null, 2)}</pre>
                        </div>
                    )}

                    {/* Forgot Password JSON Error */}
                    {showForgotError && (
                        <div className="json-error">
                            <pre>{JSON.stringify({
                                status: "coming_soon",
                                code: "FORGOT_PASSWORD_NOT_AVAILABLE",
                                message: "Password reset is under maintenance.",
                                suggestion: "Please contact support if urgent.",
                                eta: "Q2 2026"
                            }, null, 2)}</pre>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        {/* Registration Fields */}
                        {mode === 'register' && (
                            <>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <div className="input-box">
                                        <User className="input-icon" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Ram Kumar"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <div className="input-box">
                                        <Phone className="input-icon" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ''))}
                                            placeholder="+91 98765 43210"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Email */}
                        <div className="form-group">
                            <label>Email</label>
                            <div className="input-box">
                                <Mail className="input-icon" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="farmer@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label>Password</label>
                            <div className="input-box">
                                <Lock className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    minLength={8}
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-pass"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Location fields for registration */}
                        {mode === 'register' && (
                            <>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>State</label>
                                        <div className="input-box">
                                            <MapPin className="input-icon" />
                                            <select
                                                value={state}
                                                onChange={(e) => {
                                                    setState(e.target.value);
                                                    setDistrict('');
                                                }}
                                                required
                                            >
                                                <option value="">Select</option>
                                                {Object.keys(INDIAN_LOCATIONS).map((s) => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>District</label>
                                        <div className="input-box">
                                            <select
                                                value={district}
                                                onChange={(e) => setDistrict(e.target.value)}
                                                required
                                                disabled={!state}
                                            >
                                                <option value="">Select</option>
                                                {districts.map((d: string) => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Mandi (Market)</label>
                                    <div className="input-box">
                                        <MapPin className="input-icon" />
                                        <input
                                            type="text"
                                            value={mandi}
                                            onChange={(e) => setMandi(e.target.value)}
                                            placeholder="e.g., Adampur"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {mode === 'login' && (
                            <div className="forgot-link">
                                <a href="#" onClick={handleForgotPassword}>Forgot password?</a>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                                </>
                            ) : (
                                <>
                                    <span>{mode === 'login' ? 'Login' : 'Create Account'}</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        {/* Phone Login Option - LOGIN MODE ONLY, AT BOTTOM */}
                        {mode === 'login' && (
                            <>
                                <div className="divider">
                                    <span>or sign in with</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handlePhoneLogin}
                                    className="phone-btn"
                                >
                                    <Phone className="w-5 h-5" />
                                    <span>phone number</span>
                                </button>
                            </>
                        )}
                    </form>
                </div>

                {/* Mode Toggle */}
                <div className="mode-switch">
                    {mode === 'login' ? (
                        <p>
                            Don&apos;t have an account?{' '}
                            <button onClick={() => setMode('register')}>Sign Up</button>
                        </p>
                    ) : (
                        <p>
                            Already have an account?{' '}
                            <button onClick={() => setMode('login')}>Login</button>
                        </p>
                    )}
                </div>

                {/* Close button */}
                <button className="close-modal" onClick={onClose}>
                    ✕ Close
                </button>
            </div>

            <style jsx>{`
                .auth-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 100;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow-y: auto;
                }

                .auth-bg {
                    position: absolute;
                    inset: 0;
                    background-image: url('/Background.webp');
                    background-size: cover;
                    background-position: center;
                }

                .auth-bg-gradient {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.8));
                }

                .auth-container {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    max-width: 420px;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 2rem 1.5rem;
                }

                .lang-toggle {
                    display: flex;
                    padding: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    border-radius: 9999px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    margin-bottom: 2rem;
                }

                .lang-btn {
                    padding: 0.375rem 1.25rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    border-radius: 9999px;
                    color: rgba(255, 255, 255, 0.9);
                    transition: all 0.2s;
                }

                .lang-btn.active {
                    background: #dcfce7;
                    color: #166534;
                }

                .brand-section {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .logo-icon {
                    width: 80px;
                    height: 80px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    border-radius: 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .brand-title {
                    font-size: 3rem;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.9);
                    letter-spacing: -0.025em;
                }

                .brand-tagline {
                    color: rgba(255, 255, 255, 0.8);
                    margin-top: 0.75rem;
                    font-size: 1.125rem;
                    font-weight: 500;
                }

                .glass-card {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-radius: 2.5rem;
                    padding: 2rem;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                }

                .error-box {
                    background: rgba(239, 68, 68, 0.2);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #fca5a5;
                    padding: 0.75rem 1rem;
                    border-radius: 1rem;
                    margin-bottom: 1rem;
                    font-size: 0.875rem;
                }

                .json-error {
                    background: rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(34, 197, 94, 0.3);
                    border-radius: 1rem;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    overflow-x: auto;
                }

                .json-error pre {
                    color: #4ade80;
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 0.75rem;
                    white-space: pre-wrap;
                    word-break: break-word;
                    margin: 0;
                }

                .auth-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .form-group label {
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 0.875rem;
                    font-weight: 600;
                    margin-left: 0.25rem;
                }

                .input-box {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-icon {
                    position: absolute;
                    left: 1rem;
                    width: 1.25rem;
                    height: 1.25rem;
                    color: rgba(255, 255, 255, 0.4);
                    z-index: 10;
                    pointer-events: none;
                }



                .input-box input,
                .input-box select {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.15);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 1rem;
                    padding: 0.875rem 1rem 0.875rem 4rem;
                    color: rgba(255, 255, 255, 0.95);
                    font-size: 1rem;
                    outline: none;
                    transition: all 0.2s;
                }

                /* Autofill fix - prevent white background over icons */
                .input-box input:-webkit-autofill,
                .input-box input:-webkit-autofill:hover, 
                .input-box input:-webkit-autofill:focus, 
                .input-box input:-webkit-autofill:active {
                    -webkit-text-fill-color: white;
                    -webkit-box-shadow: 0 0 0px 1000px #334155 inset; /* Use slate-700 color match */
                    transition: background-color 5000s ease-in-out 0s;
                }

                .input-box input::placeholder {
                    color: rgba(255, 255, 255, 0.3);
                }

                .input-box input:focus,
                .input-box select:focus {
                    box-shadow: 0 0 0 2px #22c55e;
                }

                .input-box select {
                    cursor: pointer;
                    appearance: none;
                }

                .input-box select option {
                    background: #1e293b;
                    color: white;
                }

                .toggle-pass {
                    position: absolute;
                    right: 1rem;
                    color: rgba(255, 255, 255, 0.7); /* Improved visibility */
                    background: none;
                    border: none;
                    cursor: pointer;
                    z-index: 10;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.75rem;
                }

                .forgot-link {
                    text-align: right;
                }

                .forgot-link a {
                    color: #22c55e;
                    font-size: 0.875rem;
                    font-weight: 700;
                    text-decoration: none;
                }

                .forgot-link a:hover {
                    text-decoration: underline;
                }

                .submit-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    width: 100%;
                    padding: 1rem;
                    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                    color: white;
                    font-size: 1.125rem;
                    font-weight: 700;
                    border: none;
                    border-radius: 1rem;
                    cursor: pointer;
                    box-shadow: 0 10px 15px -3px rgba(34, 197, 94, 0.4);
                    transition: all 0.2s;
                }

                .submit-btn:hover:not(:disabled) {
                    transform: scale(0.98);
                }

                .submit-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .divider {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.5rem 0;
                }

                .divider::before,
                .divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.1);
                }

                .divider span {
                    color: #6b7280;
                    font-size: 0.875rem;
                }

                .phone-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    width: 100%;
                    padding: 0.875rem;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 1rem;
                    color: white;
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .phone-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .mode-switch {
                    margin-top: 2rem;
                    text-align: center;
                }

                .mode-switch p {
                    color: #6b7280;
                    font-size: 1rem;
                    font-weight: 500;
                }

                .mode-switch button {
                    color: #22c55e;
                    font-weight: 700;
                    background: none;
                    border: none;
                    cursor: pointer;
                }

                .mode-switch button:hover {
                    text-decoration: underline;
                }

                .close-modal {
                    position: fixed;
                    top: 1rem;
                    right: 1rem;
                    padding: 0.5rem 1rem;
                    background: rgba(0, 0, 0, 0.5);
                    color: white;
                    border: none;
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                    cursor: pointer;
                    z-index: 20;
                }

                .close-modal:hover {
                    background: rgba(0, 0, 0, 0.7);
                }

                @media (max-width: 480px) {
                    .auth-container {
                        padding: 1rem;
                    }

                    .glass-card {
                        padding: 1.5rem;
                        border-radius: 2rem;
                    }

                    .brand-title {
                        font-size: 2.5rem;
                    }

                    .form-row {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
