import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Link from 'next/link';
import { User as UserIcon, MapPin, Phone, Mail, Calendar, ArrowLeft, LogOut, Sprout } from 'lucide-react';
import { Suspense } from 'react';

async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) return null;

    await dbConnect();
    const user = await User.findOne({
        authToken: token.value,
        authTokenExpiry: { $gt: new Date() }
    });

    return user;
}

export default async function ProfilePage() {
    const user = await getUser();

    if (!user) {
        redirect('/home?login=true');
    }

    const initials = user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 transition-colors">
            <div className="max-w-md mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/prices" className="flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-1" />
                        <span className="font-semibold">Back to Mandi</span>
                    </Link>
                </div>

                {/* Profile Card */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">

                    {/* Cover Gradient */}
                    <div className="h-32 bg-gradient-to-r from-green-500 to-emerald-600 relative">
                        <div className="absolute -bottom-10 left-8">
                            <div className="h-24 w-24 rounded-full bg-white dark:bg-slate-800 p-1.5 shadow-lg">
                                <div className="h-full w-full rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                    <span className="text-3xl font-bold text-slate-500 dark:text-slate-300">{initials}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 pb-8 px-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    {user.name}
                                    {user.isPhoneVerified && <span className="text-blue-500 text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800">Verified</span>}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Farmer</p>
                            </div>
                        </div>

                        <div className="space-y-6">

                            {/* Contact Info */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Contact Details</h3>

                                <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                    <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm">
                                        <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Phone Number</p>
                                        <p className="text-slate-800 dark:text-white font-semibold flex items-center gap-2">
                                            +91 {user.phone}
                                        </p>
                                    </div>
                                </div>

                                {user.email && (
                                    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                        <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm">
                                            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Email Address</p>
                                            <p className="text-slate-800 dark:text-white font-semibold">{user.email}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Location & Crop */}
                            <div className="space-y-4 pt-2">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Farm Details</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <div className="text-orange-500 mb-2">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
                                        <p className="font-semibold text-slate-800 dark:text-white text-sm">
                                            {user.location?.district || 'Not Set'}, {user.location?.state || 'India'}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <div className="text-green-500 mb-2">
                                            <Sprout className="w-5 h-5" />
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Primary Crop</p>
                                        <p className="font-semibold text-slate-800 dark:text-white text-sm">
                                            {user.preferredCrop || 'Not Set'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="flex items-center gap-2 pt-6 border-t border-slate-100 dark:border-slate-700">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    Member since {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-8 text-center">
                    <form action="/api/auth/logout" method="POST">
                        <button type="submit" className="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center justify-center gap-2 w-full py-4 border border-dashed border-red-200 dark:border-red-900/30 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                            <LogOut className="w-4 h-4" />
                            Log Out Securely
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
}
