'use client'

import { useActionState, useState, useEffect, useRef } from 'react';
import { createAlert } from '@/app/actions';
import { Sprout, Bell, MapPin, Trash2, Plus } from 'lucide-react';
import clsx from 'clsx';
import { useFormStatus } from 'react-dom';
import { INDIAN_LOCATIONS } from '@/constants/locations';
import { useRouter, useSearchParams } from 'next/navigation';

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
                "w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors",
                pending && "opacity-50 cursor-not-allowed"
            )}
        >
            {pending ? 'Saving...' : 'Set Alert'}
        </button>
    );
}

// ... imports

interface AlertFormProps {
    onSuccess?: () => void;
}

export default function AlertForm({ onSuccess }: AlertFormProps) {
    const [state, formAction] = useActionState(createAlert, initialState);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Trigger onSuccess when alert is created successfully
    useEffect(() => {
        if (state?.success && onSuccess) {
            const timer = setTimeout(() => {
                onSuccess();
            }, 2000); // Close after 2 seconds so user sees success message
            return () => clearTimeout(timer);
        }
    }, [state?.success, onSuccess]);

    // Initialize from URL or default
    const [selectedState, setSelectedState] = useState(searchParams.get('state') || 'Haryana');
    const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get('district') || 'Hisar');
    const [mandiInput, setMandiInput] = useState(searchParams.get('mandi') || '');

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

    // Debounce timer ref for mandi search
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newState = e.target.value;
        setSelectedState(newState);
        setSelectedDistrict(''); // Reset district when state changes

        // Convert to URL params for Server Component to see
        const params = new URLSearchParams(searchParams);
        params.set('state', newState);
        params.delete('district');
        router.replace(`/prices?${params.toString()}`);
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDistrict = e.target.value;
        setSelectedDistrict(newDistrict);

        const params = new URLSearchParams(searchParams);
        params.set('district', newDistrict);
        router.replace(`/prices?${params.toString()}`);
    }

    // Debounced mandi search - waits 500ms after user stops typing
    const handleMandiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMandi = e.target.value;
        setMandiInput(newMandi);

        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer - URL updates after 500ms of no typing
        debounceTimerRef.current = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (newMandi) {
                params.set('mandi', newMandi);
            } else {
                params.delete('mandi');
            }
            router.replace(`/prices?${params.toString()}`);
        }, 500);
    }

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const districts = INDIAN_LOCATIONS[selectedState] || [];

    return (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-2xl overflow-hidden mb-8">
            {/* Header */}
            <div className="bg-green-600 p-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-white p-3 rounded-full">
                        <Sprout className="h-8 w-8 text-green-600" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-white">Kisan Alert</h1>
                <p className="text-green-100 mt-2">get notified when crop prices rise</p>
            </div>

            {/* Form */}
            <div className="p-8">
                <form action={formAction} className="space-y-6">

                    {state?.success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Success! </strong>
                            <span className="block sm:inline">{state.message}</span>
                        </div>
                    )}
                    {state?.message && !state?.success && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{state.message}</span>
                        </div>
                    )}

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">+91</span>
                            </div>
                            <input
                                type="tel"
                                name="phone"
                                id="phone"
                                required
                                className="text-gray-900 placeholder:text-gray-400 focus:ring-green-500 focus:border-green-500 block w-full pl-12 sm:text-sm border-gray-300 rounded-md py-3 border"
                                placeholder="9876543210"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Your Name</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            className="text-gray-900 placeholder:text-gray-400 mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-3 border px-3"
                            placeholder="Ram Kumar"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (Optional - for confirmation)</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            className="text-gray-900 placeholder:text-gray-400 mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-3 border px-3"
                            placeholder="farmer@example.com"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
                            <select
                                name="state"
                                id="state"
                                value={selectedState}
                                onChange={handleStateChange}
                                className="text-gray-900 mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-3 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            >
                                <option value="">Select State</option>
                                {Object.keys(INDIAN_LOCATIONS).map((st) => (
                                    <option key={st} value={st}>{st}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="district" className="block text-sm font-medium text-gray-700">District</label>
                            <select
                                name="district"
                                id="district"
                                value={selectedDistrict}
                                onChange={handleDistrictChange}
                                disabled={!selectedState}
                                className="text-gray-900 mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-3 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:bg-gray-100"
                            >
                                <option value="">Select District</option>
                                {districts.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="mandi" className="block text-sm font-medium text-gray-700">Mandi (Market)</label>
                            <input
                                type="text"
                                name="mandi"
                                id="mandi"
                                value={mandiInput}
                                onChange={handleMandiChange}
                                placeholder="e.g. Adampur"
                                className="text-gray-900 placeholder:text-gray-400 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="commodity" className="block text-sm font-medium text-gray-700">Crop</label>
                            <input
                                type="text"
                                name="commodity"
                                id="commodity"
                                defaultValue="Cotton"
                                className="text-gray-900 placeholder:text-gray-400 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    {/* Advanced Schedule Builder */}
                    <div className="border-t border-gray-200 pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notification Schedule</label>

                        {/* List of Schedules */}
                        <div className="space-y-2 mb-3">
                            {schedules.map((sch, index) => (
                                <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-md border border-gray-200">
                                    <span className="text-gray-800 text-sm font-medium">
                                        {sch.day} at {sch.time}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeSchedule(index)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {schedules.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No schedules added. Add one below.</p>
                            )}
                        </div>

                        {/* Add New Schedule */}
                        <div className="flex gap-2 items-end">
                            <div className="w-1/2">
                                <label htmlFor="tempDay" className="block text-xs text-gray-500 mb-1">Day</label>
                                <select
                                    id="tempDay"
                                    value={tempDay}
                                    onChange={(e) => setTempDay(e.target.value)}
                                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-gray-900 border py-2 px-2"
                                >
                                    <option value="Everyday">Everyday</option>
                                    <option value="Monday">Monday</option>
                                    <option value="Tuesday">Tuesday</option>
                                    <option value="Wednesday">Wednesday</option>
                                    <option value="Thursday">Thursday</option>
                                    <option value="Friday">Friday</option>
                                    <option value="Saturday">Saturday</option>
                                    <option value="Sunday">Sunday</option>
                                </select>
                            </div>
                            <div className="w-1/3">
                                <label htmlFor="tempTime" className="block text-xs text-gray-500 mb-1">Time</label>
                                <input
                                    type="time"
                                    id="tempTime"
                                    value={tempTime}
                                    onChange={(e) => setTempTime(e.target.value)}
                                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-gray-900 border py-2 px-2"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={addSchedule}
                                className="bg-green-100 text-green-700 p-2 rounded-md hover:bg-green-200 mb-[1px]"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        </div>
                        <input type="hidden" name="schedules" value={JSON.stringify(schedules)} />
                        <p className="mt-2 text-xs text-gray-500">We'll also send an immediate confirmation SMS.</p>
                    </div>

                    {/* Hidden target price (0) ensures alerts trigger for any positive market price */}
                    <input type="hidden" name="targetPrice" value="0" />

                    <SubmitButton />

                </form>
            </div>

            <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="flex items-center justify-center text-sm text-gray-500">
                    <Bell className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    <span>Alerts sent via SMS daily at 11:30 AM</span>
                </div>
            </div>
        </div>
    );
}
