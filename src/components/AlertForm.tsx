'use client'

import { useActionState, useState, useEffect } from 'react';
import { createAlert } from '@/app/actions';
import { Bell, Trash2, Plus, Clock, Info } from 'lucide-react';
import clsx from 'clsx';
import { useFormStatus } from 'react-dom';

const initialState = {
    message: '',
    success: false,
}

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className={clsx(
                "w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold tracking-wide text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all",
                pending && "opacity-70 cursor-not-allowed"
            )}
        >
            {pending ? 'Saving...' : 'Save Schedule'}
        </button>
    );
}

interface AlertFormProps {
    onSuccess?: () => void;
    user?: any; // Passed from parent
    state?: string;
    district?: string;
}

export default function AlertForm({ onSuccess, user, state: propState, district: propDistrict }: AlertFormProps) {
    const [state, formAction] = useActionState(createAlert, initialState);

    // Trigger onSuccess when alert is created successfully
    useEffect(() => {
        if (state?.success && onSuccess) {
            const timer = setTimeout(() => {
                onSuccess();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [state?.success, onSuccess]);

    // Schedule State
    const [schedules, setSchedules] = useState<{ day: string; time: string }[]>([
        { day: 'Everyday', time: '09:00' }
    ]);
    const [tempDay, setTempDay] = useState('Everyday');
    const [tempTime, setTempTime] = useState('09:00');

    const addSchedule = () => {
        if (!tempDay || !tempTime) return;
        setSchedules([...schedules, { day: tempDay, time: tempTime }]);
    };

    const removeSchedule = (index: number) => {
        setSchedules(schedules.filter((_, i) => i !== index));
    };

    return (
        <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Bell className="w-5 h-5 text-green-100" />
                        SMS Alerts
                    </h2>
                    <p className="text-green-100 text-xs mt-0.5 opacity-90">Customize your price notifications</p>
                </div>
            </div>

            {/* Form */}
            <div className="p-6">
                <form action={formAction} className="space-y-6">

                    {state?.success && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center gap-2" role="alert">
                            <span className="bg-green-100 dark:bg-green-800 p-1 rounded-full"><Info className="w-4 h-4" /></span>
                            <span className="text-sm font-medium">{state.message}</span>
                        </div>
                    )}
                    {state?.message && !state?.success && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg" role="alert">
                            <span className="text-sm font-medium">{state.message}</span>
                        </div>
                    )}

                    {/* Pre-filled Location Display */}
                    {(propState || propDistrict) && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">📍 Alert Location</p>
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-xs text-blue-500 dark:text-blue-300">State</p>
                                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{propState || 'Not set'}</p>
                                </div>
                                <div className="text-blue-300 dark:text-blue-600">→</div>
                                <div>
                                    <p className="text-xs text-blue-500 dark:text-blue-300">District</p>
                                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{propDistrict || 'Not set'}</p>
                                </div>
                            </div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 opacity-80">✓ Using your registered location from profile</p>
                        </div>
                    )}

                    {/* Pre-filled Crop Display */}
                    {user?.preferredCrop && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">🌾 Crop</p>
                            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{user.preferredCrop}</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 opacity-80">✓ From your registration profile</p>
                        </div>
                    )}

                    {/* Hidden Context Fields (Simplifying the UX) */}
                    <input type="hidden" name="name" value={user?.name || 'Guest'} />
                    <input type="hidden" name="phone" value={user?.phone || ''} />
                    <input type="hidden" name="email" value={user?.email || ''} />
                    <input type="hidden" name="state" value={propState || 'Haryana'} />
                    <input type="hidden" name="district" value={propDistrict || 'Hisar'} />
                    <input type="hidden" name="mandi" value="" /> {/* Default to general district alerts */}
                    <input type="hidden" name="commodity" value={user?.preferredCrop || 'All Crops'} />
                    <input type="hidden" name="targetPrice" value="0" />

                    {/* Advanced Schedule Builder */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">
                            <Clock className="w-4 h-4 text-orange-500" />
                            Notification Schedule
                        </label>

                        {/* List of Schedules */}
                        <div className="space-y-2 mb-4">
                            {schedules.map((sch, index) => (
                                <div key={index} className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <span className="text-slate-800 dark:text-slate-200 text-sm font-medium">
                                        <span className="text-slate-400 font-normal mr-1">Every</span>
                                        {sch.day}
                                        <span className="text-slate-300 mx-2">|</span>
                                        {sch.time}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeSchedule(index)}
                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-full transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {schedules.length === 0 && (
                                <div className="text-center py-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                                    <p className="text-xs text-slate-400">No schedules set.</p>
                                </div>
                            )}
                        </div>

                        {/* Add New Schedule */}
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-3">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase">Add Another Schedule</p>
                            <div className="flex gap-2 items-end bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="flex-1">
                                    <label htmlFor="tempDay" className="sr-only">Day</label>
                                    <select
                                        id="tempDay"
                                        value={tempDay}
                                        onChange={(e) => setTempDay(e.target.value)}
                                        className="block w-full text-sm border-0 bg-transparent text-slate-800 dark:text-white focus:ring-0 px-0 font-medium"
                                    >
                                        <option value="Everyday" className="dark:bg-slate-800">Everyday</option>
                                        <option value="Monday" className="dark:bg-slate-800">Monday</option>
                                        <option value="Tuesday" className="dark:bg-slate-800">Tuesday</option>
                                        <option value="Wednesday" className="dark:bg-slate-800">Wednesday</option>
                                        <option value="Thursday" className="dark:bg-slate-800">Thursday</option>
                                        <option value="Friday" className="dark:bg-slate-800">Friday</option>
                                        <option value="Saturday" className="dark:bg-slate-800">Saturday</option>
                                        <option value="Sunday" className="dark:bg-slate-800">Sunday</option>
                                    </select>
                                </div>
                                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                <div className="w-24">
                                    <label htmlFor="tempTime" className="sr-only">Time</label>
                                    <input
                                        type="time"
                                        id="tempTime"
                                        value={tempTime}
                                        onChange={(e) => setTempTime(e.target.value)}
                                        className="block w-full text-sm border-0 bg-transparent text-slate-800 dark:text-white focus:ring-0 px-0 text-right font-medium"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={addSchedule}
                                    className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm ml-2"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <input type="hidden" name="schedules" value={JSON.stringify(schedules)} />

                        <p className="mt-3 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
                            <Info className="w-3 h-3" />
                            We'll send an immediate confirmation SMS.
                        </p>
                    </div>

                    {!user?.phone && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 p-3 rounded-lg text-xs">
                            ⚠️ You are not logged in. SMS features may require account setup.
                        </div>
                    )}

                    <SubmitButton />

                </form>
            </div>
        </div>
    );
}
