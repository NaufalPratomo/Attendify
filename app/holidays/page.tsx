"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
    CalendarPlus,
    Trash2,
    Globe,
    UserRound,
    Loader2,
    CalendarDays,
    Info,
    X,
    Briefcase,
    TrendingDown,
    Equal,
    Clock,
    Plus,
} from 'lucide-react';
import { format } from 'date-fns';

// Types
interface Holiday {
    _id: string;
    date: string;
    dateString: string;
    name: string;
    type: 'GLOBAL' | 'PERSONAL' | 'PIKET';
    isDeductible: boolean;
    userId: string | null;
}

interface UserInfo {
    name: string;
    email: string;
    avatar?: string;
}

interface Adjustment {
    _id: string;
    name: string;
    startDate: string;
    endDate: string;
    reductionMinutes: number;
}

// Helper: Create a timezone-safe date from "YYYY-MM-DD" without UTC shift
function parseDateString(ds: string): Date {
    const [y, m, d] = ds.split('-').map(Number);
    return new Date(y, m - 1, d);
}

// Helper: Format a Date to "YYYY-MM-DD" in local timezone
function toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export default function HolidaysPage() {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState<UserInfo | undefined>(undefined);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Calendar state
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [formName, setFormName] = useState('');
    const [formType, setFormType] = useState<'GLOBAL' | 'PERSONAL' | 'PIKET'>('GLOBAL');
    const [formDeductible, setFormDeductible] = useState(true);

    // Detail popover state
    const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

    // Adjustment state
    const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
    const [adjLoading, setAdjLoading] = useState(false);
    const [adjSubmitting, setAdjSubmitting] = useState(false);
    const [showAdjForm, setShowAdjForm] = useState(false);
    const [adjName, setAdjName] = useState('');
    const [adjStartDate, setAdjStartDate] = useState('');
    const [adjEndDate, setAdjEndDate] = useState('');
    const [adjReduction, setAdjReduction] = useState(30);

    // Fetch user info
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/dashboard/stats');
                if (res.status === 401) {
                    router.push('/auth/login');
                    return;
                }
                const data = await res.json();
                setUser({
                    name: data.userName,
                    email: data.userEmail,
                    avatar: data.userAvatar,
                });
            } catch (error) {
                console.error('Failed to fetch user', error);
            }
        };
        fetchUser();
    }, [router]);

    // Fetch holidays for current month
    const fetchHolidays = useCallback(async () => {
        try {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth() + 1;
            const res = await fetch(`/api/holidays?year=${year}&month=${month}`);
            if (res.ok) {
                const data = await res.json();
                setHolidays(data.holidays);
            }
        } catch (error) {
            console.error('Failed to fetch holidays', error);
        } finally {
            setLoading(false);
        }
    }, [currentMonth]);

    useEffect(() => {
        setLoading(true);
        fetchHolidays();
    }, [fetchHolidays]);

    // Fetch adjustments
    const fetchAdjustments = useCallback(async () => {
        try {
            setAdjLoading(true);
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth() + 1;
            const res = await fetch(`/api/adjustments?year=${year}&month=${month}`);
            if (res.ok) {
                const data = await res.json();
                setAdjustments(data.adjustments);
            }
        } catch (error) {
            console.error('Failed to fetch adjustments', error);
        } finally {
            setAdjLoading(false);
        }
    }, [currentMonth]);

    useEffect(() => {
        fetchAdjustments();
    }, [fetchAdjustments]);

    // Add adjustment
    const handleAddAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjName.trim() || !adjStartDate || !adjEndDate) {
            toast.error('Please fill in all fields.');
            return;
        }
        setAdjSubmitting(true);
        const toastId = toast.loading('Adding adjustment...');
        try {
            const res = await fetch('/api/adjustments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: adjName.trim(),
                    startDate: adjStartDate,
                    endDate: adjEndDate,
                    reductionMinutes: Number(adjReduction),
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Adjustment added!', { id: toastId });
                setShowAdjForm(false);
                setAdjName('');
                setAdjStartDate('');
                setAdjEndDate('');
                setAdjReduction(30);
                fetchAdjustments();
            } else {
                toast.error(data.message || 'Failed to add adjustment', { id: toastId });
            }
        } catch {
            toast.error('Network error.', { id: toastId });
        } finally {
            setAdjSubmitting(false);
        }
    };

    // Delete adjustment
    const handleDeleteAdjustment = async (id: string) => {
        const toastId = toast.loading('Deleting adjustment...');
        try {
            const res = await fetch(`/api/adjustments?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Adjustment deleted!', { id: toastId });
                fetchAdjustments();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to delete', { id: toastId });
            }
        } catch {
            toast.error('Network error.', { id: toastId });
        }
    };

    // Build maps for calendar modifiers
    const globalDates: Date[] = [];
    const personalDates: Date[] = [];
    const piketDates: Date[] = [];
    const holidayMap = new Map<string, Holiday[]>();

    holidays.forEach((h) => {
        const d = parseDateString(h.dateString);
        if (h.type === 'GLOBAL') {
            globalDates.push(d);
        } else if (h.type === 'PIKET') {
            piketDates.push(d);
        } else {
            personalDates.push(d);
        }
        const existing = holidayMap.get(h.dateString) || [];
        existing.push(h);
        holidayMap.set(h.dateString, existing);
    });

    // Helper: get color classes for a given type
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'GLOBAL': return { dot: 'bg-red-500', badge: 'bg-red-500/10 text-red-400', border: 'border-red-500/50 bg-red-500/10 text-red-400' };
            case 'PIKET': return { dot: 'bg-[#137fec]', badge: 'bg-[#137fec]/10 text-[#137fec]', border: 'border-[#137fec]/50 bg-[#137fec]/10 text-[#137fec]' };
            default: return { dot: 'bg-amber-400', badge: 'bg-amber-400/10 text-amber-400', border: 'border-amber-400/50 bg-amber-400/10 text-amber-400' };
        }
    };
    const getTypeLabel = (type: string) => type === 'GLOBAL' ? 'Libur Nasional' : type === 'PIKET' ? 'Piket' : 'Cuti/Sakit';
    const getTypeIcon = (type: string) => type === 'GLOBAL' ? <Globe className="size-3" /> : type === 'PIKET' ? <Briefcase className="size-3" /> : <UserRound className="size-3" />;

    // Handle calendar day click
    const handleDayClick = (day: Date) => {
        const ds = toLocalDateString(day);
        setSelectedDate(day);
        const dayHolidays = holidayMap.get(ds);

        if (dayHolidays && dayHolidays.length > 0) {
            // Show detail of existing holiday
            setSelectedHoliday(dayHolidays[0]);
            setShowForm(false);
        } else {
            // Open form with this date pre-selected
            setSelectedHoliday(null);
            setShowForm(true);
            setFormName('');
            setFormType('GLOBAL');
            setFormDeductible(true);
        }
    };

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !formName.trim()) {
            toast.error('Please fill in all fields.');
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading('Adding holiday...');

        try {
            // Send the date as an ISO string with the local date at noon to avoid timezone issues
            const ds = toLocalDateString(selectedDate);
            const [y, m, d] = ds.split('-').map(Number);
            const safeDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

            const res = await fetch('/api/holidays', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: safeDate.toISOString(),
                    name: formName.trim(),
                    type: formType,
                    isDeductible: formType === 'PIKET' ? false : formDeductible,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Holiday added successfully!', { id: toastId });
                setShowForm(false);
                setFormName('');
                setSelectedDate(undefined);
                fetchHolidays();
            } else {
                toast.error(data.message || 'Failed to add holiday', { id: toastId });
            }
        } catch (error) {
            toast.error('Network error. Please try again.', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete
    const handleDelete = async (id: string) => {
        const toastId = toast.loading('Deleting holiday...');
        try {
            const res = await fetch(`/api/holidays?id=${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (res.ok) {
                toast.success('Holiday deleted successfully!', { id: toastId });
                setSelectedHoliday(null);
                setSelectedDate(undefined);
                fetchHolidays();
            } else {
                toast.error(data.message || 'Failed to delete', { id: toastId });
            }
        } catch (error) {
            toast.error('Network error.', { id: toastId });
        }
    };

    return (
        <div className="bg-[#101922] font-sans text-white antialiased selection:bg-[#137fec]/30 min-h-screen">
            <div className="relative flex min-h-screen flex-col overflow-hidden">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} user={user} />
                <div className="flex-1 flex flex-col lg:mr-72 transition-all duration-300">
                    <Header onMenuClick={() => setIsSidebarOpen(true)} userName={user?.name} />

                    <main className="flex-1 flex flex-col relative overflow-y-auto bg-[#101922]">
                        <div className="flex flex-1 flex-col p-6 sm:p-10">

                            {/* Page Header */}
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-[#137fec]/10 text-[#137fec]">
                                        <CalendarDays className="size-5" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-white tracking-tight">Schedule Manager</h1>
                                        <p className="text-sm text-[#9dabb9]">Manage holidays, leaves, and piket days that affect your working days calculation.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Main Grid: Calendar + Side Panel */}
                            <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">

                                {/* === LEFT: Calendar Card === */}
                                <div className="bg-[#111418] rounded-xl border border-[#283039] shadow-2xl overflow-hidden">
                                    <div className="p-6">
                                        {/* Legend */}
                                        <div className="flex flex-wrap items-center gap-4 mb-5">
                                            <div className="flex items-center gap-2 text-xs text-[#9dabb9]">
                                                <span className="size-2.5 rounded-full bg-red-500"></span>
                                                National Holiday
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-[#9dabb9]">
                                                <span className="size-2.5 rounded-full bg-amber-400"></span>
                                                Personal Leave
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-[#9dabb9]">
                                                <span className="size-2.5 rounded-full bg-[#137fec]"></span>
                                                Piket
                                            </div>
                                        </div>

                                        {/* Calendar */}
                                        <div className="flex justify-center">
                                            <Calendar
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={(day) => day && handleDayClick(day)}
                                                month={currentMonth}
                                                onMonthChange={setCurrentMonth}
                                                modifiers={{
                                                    globalHoliday: globalDates,
                                                    personalLeave: personalDates,
                                                    piketDay: piketDates,
                                                }}
                                                modifiersClassNames={{
                                                    globalHoliday: 'holiday-global',
                                                    personalLeave: 'holiday-personal',
                                                    piketDay: 'holiday-piket',
                                                }}
                                                className="!bg-transparent"
                                                classNames={{
                                                    month_caption: "flex items-center justify-center h-10 w-full px-10 text-white font-semibold",
                                                    weekday: "text-[#9dabb9] text-[0.8rem] font-normal w-12 h-10",
                                                    day: "relative w-12 h-12 p-0 text-center group/day",
                                                    today: "bg-[#137fec]/20 text-[#137fec] rounded-lg font-bold",
                                                    selected: "bg-[#137fec] text-white rounded-lg font-bold",
                                                    outside: "text-[#3b4754] opacity-50",
                                                }}
                                                style={{
                                                    // @ts-ignore
                                                    '--cell-size': '3rem',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* === RIGHT: Side Panel === */}
                                <div className="flex flex-col gap-6">

                                    {/* Add Holiday Form (Shown when clicking empty date) */}
                                    {showForm && selectedDate && (
                                        <div className="bg-[#111418] rounded-xl border border-[#283039] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between px-6 pt-5 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <CalendarPlus className="size-4 text-[#137fec]" />
                                                    <h3 className="text-sm font-semibold text-white">Add Entry</h3>
                                                </div>
                                                <button
                                                    onClick={() => { setShowForm(false); setSelectedDate(undefined); }}
                                                    className="text-gray-500 hover:text-white transition-colors"
                                                >
                                                    <X className="size-4" />
                                                </button>
                                            </div>
                                            <form onSubmit={handleSubmit} className="px-6 pb-6 flex flex-col gap-4">
                                                {/* Selected Date Display */}
                                                <div className="flex items-center gap-3 px-3 py-2.5 bg-[#1c2127] rounded-lg border border-[#283039]">
                                                    <CalendarDays className="size-4 text-[#137fec]" />
                                                    <span className="text-sm text-white font-medium">
                                                        {format(selectedDate, 'EEEE, dd MMMM yyyy')}
                                                    </span>
                                                </div>

                                                {/* Name Input */}
                                                <div>
                                                    <label className="text-sm font-medium text-[#9dabb9] mb-1.5 block">Description</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Idul Fitri, Annual Leave..."
                                                        value={formName}
                                                        onChange={(e) => setFormName(e.target.value)}
                                                        className="w-full h-11 px-3 bg-[#1c2127] border border-[#3b4754] rounded-lg text-white text-sm placeholder:text-[#9dabb9]/50 focus:outline-none focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] transition-all"
                                                        required
                                                    />
                                                </div>

                                                {/* Type Select */}
                                                <div>
                                                    <label className="text-sm font-medium text-[#9dabb9] mb-1.5 block">Type</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setFormType('GLOBAL'); setFormName(''); setFormDeductible(true); }}
                                                            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg border text-xs font-medium transition-all ${formType === 'GLOBAL'
                                                                ? 'border-red-500/50 bg-red-500/10 text-red-400'
                                                                : 'border-[#3b4754] bg-[#1c2127] text-[#9dabb9] hover:border-[#4b5563]'
                                                                }`}
                                                        >
                                                            <Globe className="size-3.5" />
                                                            Libur Nasional
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setFormType('PERSONAL'); setFormName(''); }}
                                                            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg border text-xs font-medium transition-all ${formType === 'PERSONAL'
                                                                ? 'border-amber-400/50 bg-amber-400/10 text-amber-400'
                                                                : 'border-[#3b4754] bg-[#1c2127] text-[#9dabb9] hover:border-[#4b5563]'
                                                                }`}
                                                        >
                                                            <UserRound className="size-3.5" />
                                                            Cuti/Sakit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setFormType('PIKET'); setFormName('Piket'); setFormDeductible(false); }}
                                                            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg border text-xs font-medium transition-all ${formType === 'PIKET'
                                                                ? 'border-[#137fec]/50 bg-[#137fec]/10 text-[#137fec]'
                                                                : 'border-[#3b4754] bg-[#1c2127] text-[#9dabb9] hover:border-[#4b5563]'
                                                                }`}
                                                        >
                                                            <Briefcase className="size-3.5" />
                                                            Piket
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Deduct Target Checkbox (only for PERSONAL) */}
                                                {formType === 'PERSONAL' && (
                                                    <div>
                                                        <label
                                                            className="flex items-center gap-3 px-3 py-3 bg-[#1c2127] rounded-lg border border-[#283039] cursor-pointer group hover:border-[#3b4754] transition-colors"
                                                            htmlFor="deductCheckbox"
                                                        >
                                                            <div className="relative">
                                                                <input
                                                                    id="deductCheckbox"
                                                                    type="checkbox"
                                                                    checked={formDeductible}
                                                                    onChange={(e) => setFormDeductible(e.target.checked)}
                                                                    className="sr-only peer"
                                                                />
                                                                <div className="w-9 h-5 bg-[#3b4754] rounded-full peer-checked:bg-[#137fec] transition-colors"></div>
                                                                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform"></div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-sm text-white font-medium">Kurangi Target Bulanan</span>
                                                                {!formDeductible && (
                                                                    <p className="text-[10px] text-amber-400/80 mt-0.5">Target tetap. Anda perlu mengganti jam kerja di hari lain.</p>
                                                                )}
                                                            </div>
                                                        </label>
                                                    </div>
                                                )}

                                                {/* Submit */}
                                                <button
                                                    type="submit"
                                                    disabled={submitting || !formName.trim()}
                                                    className="flex items-center justify-center gap-2 h-11 bg-[#137fec] hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {submitting ? (
                                                        <><Loader2 className="size-4 animate-spin" /> Adding...</>
                                                    ) : (
                                                        <><CalendarPlus className="size-4" /> Add Entry</>
                                                    )}
                                                </button>
                                            </form>
                                        </div>
                                    )}

                                    {/* Holiday Detail (Shown when clicking a date with existing holiday) */}
                                    {selectedHoliday && (
                                        <div className="bg-[#111418] rounded-xl border border-[#283039] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between px-6 pt-5 pb-3">
                                                <h3 className="text-sm font-semibold text-white">Entry Detail</h3>
                                                <button
                                                    onClick={() => { setSelectedHoliday(null); setSelectedDate(undefined); }}
                                                    className="text-gray-500 hover:text-white transition-colors"
                                                >
                                                    <X className="size-4" />
                                                </button>
                                            </div>
                                            <div className="px-6 pb-6 space-y-4">
                                                <div className="flex items-center gap-3 px-3 py-2.5 bg-[#1c2127] rounded-lg border border-[#283039]">
                                                    <CalendarDays className="size-4 text-[#137fec]" />
                                                    <span className="text-sm text-white font-medium">
                                                        {format(parseDateString(selectedHoliday.dateString), 'EEEE, dd MMMM yyyy')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-white font-semibold">{selectedHoliday.name}</p>
                                                        <span className={`inline-flex items-center gap-1.5 mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${getTypeColor(selectedHoliday.type).badge}`}>
                                                            {getTypeIcon(selectedHoliday.type)}
                                                            {getTypeLabel(selectedHoliday.type)}
                                                        </span>
                                                        {selectedHoliday.type !== 'PIKET' && (
                                                            <span className={`inline-flex items-center gap-1 mt-1 ml-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${selectedHoliday.isDeductible ? 'bg-orange-500/10 text-orange-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                                {selectedHoliday.isDeductible ? <TrendingDown className="size-2.5" /> : <Equal className="size-2.5" />}
                                                                {selectedHoliday.isDeductible ? 'Deduct' : 'No Deduct'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleDelete(selectedHoliday._id)}
                                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                        Delete
                                                    </button>
                                                </div>

                                                {/* Show all holidays on same date */}
                                                {selectedDate && (holidayMap.get(toLocalDateString(selectedDate))?.length ?? 0) > 1 && (
                                                    <div className="mt-2 pt-3 border-t border-[#283039]">
                                                        <p className="text-xs text-[#9dabb9] mb-2">Other holidays on this date:</p>
                                                        {holidayMap.get(toLocalDateString(selectedDate))?.filter(h => h._id !== selectedHoliday._id).map(h => (
                                                            <div key={h._id} className="flex items-center justify-between py-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`size-2 rounded-full ${getTypeColor(h.type).dot}`}></span>
                                                                    <span className="text-sm text-white">{h.name}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDelete(h._id)}
                                                                    className="text-red-400 hover:text-red-300 transition-colors"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Holiday List for this Month */}
                                    <div className="bg-[#111418] rounded-xl border border-[#283039] shadow-2xl overflow-hidden">
                                        <div className="flex items-center justify-between px-6 pt-5 pb-3">
                                            <h3 className="text-sm font-semibold text-white">
                                                {format(currentMonth, 'MMMM yyyy')} Schedule
                                            </h3>
                                            <span className="text-xs text-[#9dabb9] bg-[#1c2127] px-2 py-1 rounded-md">
                                                {holidays.length} {holidays.length === 1 ? 'entry' : 'entries'}
                                            </span>
                                        </div>

                                        <div className="px-6 pb-6">
                                            {loading ? (
                                                <div className="space-y-3">
                                                    {[1, 2, 3].map(i => (
                                                        <Skeleton key={i} className="h-14 w-full rounded-lg bg-[#283039]" />
                                                    ))}
                                                </div>
                                            ) : holidays.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                                    <div className="size-12 rounded-full bg-[#1c2127] flex items-center justify-center mb-3">
                                                        <CalendarDays className="size-5 text-[#3b4754]" />
                                                    </div>
                                                    <p className="text-sm text-[#9dabb9]">No entries this month.</p>
                                                    <p className="text-xs text-[#3b4754] mt-1">Click a date on the calendar to add one.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {holidays.map((h) => (
                                                        <div
                                                            key={h._id}
                                                            className="flex items-center justify-between px-3 py-3 bg-[#1c2127] rounded-lg border border-[#283039] hover:border-[#3b4754] transition-colors group cursor-pointer"
                                                            onClick={() => {
                                                                setSelectedDate(parseDateString(h.dateString));
                                                                setSelectedHoliday(h);
                                                                setShowForm(false);
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className={`size-2 rounded-full shrink-0 ${getTypeColor(h.type).dot}`}></div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium text-white truncate">{h.name}</p>
                                                                    <p className="text-xs text-[#9dabb9]">
                                                                        {format(parseDateString(h.dateString), 'EEE, dd MMM')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getTypeColor(h.type).badge}`}>
                                                                    {getTypeLabel(h.type)}
                                                                </span>
                                                                {h.type !== 'PIKET' && (
                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${h.isDeductible ? 'bg-orange-500/10 text-orange-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                                        {h.isDeductible ? '↓' : '='}
                                                                    </span>
                                                                )}
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(h._id); }}
                                                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-1"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* === Seasonal Adjustments Section === */}
                                    <div className="bg-[#111418] rounded-xl border border-[#283039] shadow-2xl overflow-hidden">
                                        <div className="flex items-center justify-between px-6 pt-5 pb-3">
                                            <div className="flex items-center gap-2">
                                                <Clock className="size-4 text-purple-400" />
                                                <h3 className="text-sm font-semibold text-white">Seasonal Adjustments (Global)</h3>
                                            </div>
                                            <button
                                                onClick={() => setShowAdjForm(!showAdjForm)}
                                                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                                            >
                                                <Plus className="size-3.5" />
                                                Add
                                            </button>
                                        </div>

                                        {/* Add Adjustment Form */}
                                        {showAdjForm && (
                                            <form onSubmit={handleAddAdjustment} className="px-6 pb-4 flex flex-col gap-3 border-b border-[#283039] animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div>
                                                    <label className="text-xs font-medium text-[#9dabb9] mb-1 block">Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Ramadhan 2026"
                                                        value={adjName}
                                                        onChange={(e) => setAdjName(e.target.value)}
                                                        className="w-full h-10 px-3 bg-[#1c2127] border border-[#3b4754] rounded-lg text-white text-sm placeholder:text-[#9dabb9]/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                                                        required
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs font-medium text-[#9dabb9] mb-1 block">Start Date</label>
                                                        <input
                                                            type="date"
                                                            value={adjStartDate}
                                                            onChange={(e) => setAdjStartDate(e.target.value)}
                                                            className="w-full h-10 px-3 bg-[#1c2127] border border-[#3b4754] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all [color-scheme:dark]"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-[#9dabb9] mb-1 block">End Date</label>
                                                        <input
                                                            type="date"
                                                            value={adjEndDate}
                                                            onChange={(e) => setAdjEndDate(e.target.value)}
                                                            className="w-full h-10 px-3 bg-[#1c2127] border border-[#3b4754] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all [color-scheme:dark]"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-[#9dabb9] mb-1 block">Reduction (minutes/day)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={adjReduction}
                                                        onChange={(e) => setAdjReduction(Number(e.target.value))}
                                                        className="w-full h-10 px-3 bg-[#1c2127] border border-[#3b4754] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                                                        required
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAdjForm(false)}
                                                        className="flex-1 h-9 text-xs text-[#9dabb9] hover:text-white border border-[#3b4754] rounded-lg transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={adjSubmitting}
                                                        className="flex-1 h-9 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                                    >
                                                        {adjSubmitting ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                                                        Add Adjustment
                                                    </button>
                                                </div>
                                            </form>
                                        )}

                                        {/* Adjustment List */}
                                        <div className="px-6 pb-6 pt-3">
                                            {adjLoading ? (
                                                <div className="space-y-2">
                                                    {[1, 2].map(i => (
                                                        <Skeleton key={i} className="h-14 w-full rounded-lg bg-[#283039]" />
                                                    ))}
                                                </div>
                                            ) : adjustments.length === 0 ? (
                                                <div className="text-center py-6">
                                                    <Clock className="size-5 text-[#3b4754] mx-auto mb-2" />
                                                    <p className="text-xs text-[#9dabb9]">No adjustments active.</p>
                                                    <p className="text-xs text-[#3b4754] mt-0.5">Add one during Ramadhan to reduce daily targets.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {adjustments.map((adj) => (
                                                        <div
                                                            key={adj._id}
                                                            className="flex items-center justify-between px-3 py-3 bg-[#1c2127] rounded-lg border border-[#283039] hover:border-[#3b4754] transition-colors group"
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="size-2 rounded-full shrink-0 bg-purple-500"></div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium text-white truncate">{adj.name}</p>
                                                                    <p className="text-xs text-[#9dabb9]">
                                                                        {format(parseDateString(adj.startDate), 'dd MMM')} — {format(parseDateString(adj.endDate), 'dd MMM yyyy')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                                                                    -{adj.reductionMinutes}m/day
                                                                </span>
                                                                <button
                                                                    onClick={() => handleDeleteAdjustment(adj._id)}
                                                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-1"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info box */}
                                    <div className="bg-[#1c2127] rounded-lg p-4 border border-[#283039] flex gap-3 items-start">
                                        <Info className="size-4 text-[#137fec] mt-0.5 shrink-0" />
                                        <p className="text-[#9dabb9] text-xs leading-relaxed">
                                            Holidays reduce working days, lowering your monthly target. <strong className="text-white">Piket</strong> converts a Sunday/holiday into a working day, <em>increasing</em> your target. <strong className="text-white">Seasonal Adjustments</strong> (e.g. Ramadhan) reduce your daily target for the period, applied globally to all users.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Custom CSS for calendar holiday indicators */}
            <style jsx global>{`
                .holiday-global button,
                .holiday-global > div,
                .holiday-personal button,
                .holiday-personal > div,
                .holiday-piket button,
                .holiday-piket > div {
                    position: relative;
                }
                .holiday-global button::after,
                td:has(.holiday-global) button::after {
                    content: '';
                    position: absolute;
                    bottom: 2px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background-color: #ef4444;
                }
                .holiday-personal button::after,
                td:has(.holiday-personal) button::after {
                    content: '';
                    position: absolute;
                    bottom: 2px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background-color: #fbbf24;
                }
                .holiday-piket button::after,
                td:has(.holiday-piket) button::after {
                    content: '';
                    position: absolute;
                    bottom: 2px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background-color: #137fec;
                }
            `}</style>
        </div>
    );
}
