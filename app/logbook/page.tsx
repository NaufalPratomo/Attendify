'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { toast } from 'sonner';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface LogEntry {
    _id: string;
    activity: string;
    createdAt: string;
    date: string;
}

interface UserInfo {
    name: string;
    email: string;
    avatar: string;
}

const LogbookPage = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState<UserInfo>({ name: '', email: '', avatar: '' });

    // Date state: Date object
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [newLog, setNewLog] = useState('');
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Fetch user info on mount
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/dashboard/stats');
                if (res.status === 401) {
                    window.location.href = '/auth/login';
                    return;
                }
                if (res.ok) {
                    const data = await res.json();
                    setUser({
                        name: data.userName,
                        email: data.userEmail,
                        avatar: data.userAvatar
                    });
                }
            } catch (e) {
                console.error("Failed to fetch user info", e);
            }
        };
        fetchUser();
    }, []);

    // Fetch logs when date changes
    useEffect(() => {
        fetchLogs();
    }, [selectedDate]);

    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const res = await fetch(`/api/logbook?date=${dateStr}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
            } else {
                setLogs([]);
            }
        } catch (error) {
            console.error("Failed to fetch logs", error);
            toast.error("Failed to load logs");
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLog.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/logbook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: format(selectedDate, 'yyyy-MM-dd'),
                    activity: newLog
                })
            });

            if (res.ok) {
                toast.success("Activity logged");
                setNewLog('');
                fetchLogs();
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to save log");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error saving log");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this log?")) return;
        try {
            const res = await fetch(`/api/logbook?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Log deleted");
                fetchLogs();
            } else {
                toast.error("Failed to delete");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error deleting log");
        }
    };

    return (
        <div className="bg-[#101922] font-sans text-white antialiased selection:bg-[#137fec]/30 min-h-screen">
            <div className="relative flex min-h-screen flex-col overflow-hidden">
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    user={user}
                />

                <div className="flex-1 flex flex-col lg:ml-72 transition-all duration-300">
                    <Header
                        onMenuClick={() => setIsSidebarOpen(true)}
                        userName={user.name}
                    />

                    <main className="flex-1 p-6 lg:p-10">
                        <div className="max-w-4xl mx-auto space-y-8">

                            {/* Page Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight">Log Book</h1>
                                    <p className="text-gray-400 mt-1">Record your daily activities and progress.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-[240px] justify-start text-left font-normal",
                                                    !selectedDate && "text-muted-foreground",
                                                    "bg-[#1c2632] border-[#283039] text-white hover:bg-[#232d3b] hover:text-white"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 border-[#283039]" align="end">
                                            <Calendar
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={(date) => date && setSelectedDate(date)}
                                                initialFocus
                                                className="bg-[#1c2632] text-white"
                                                classNames={{
                                                    day_selected: "bg-[#137fec] text-white hover:bg-[#137fec] hover:text-white focus:bg-[#137fec] focus:text-white",
                                                    day_today: "bg-[#283039] text-white",
                                                    day: "text-white hover:bg-[#283039] hover:text-white",
                                                    caption: "text-white",
                                                    nav_button: "text-white hover:bg-[#283039] border border-[#283039]",
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            {/* Input Area */}
                            <div className="bg-[#1c2632] rounded-2xl border border-[#283039] p-6 shadow-xl">
                                <form onSubmit={handleAddLog}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            New Activity
                                        </label>
                                        <textarea
                                            value={newLog}
                                            onChange={(e) => setNewLog(e.target.value)}
                                            placeholder="Examples:\n- Fixed bug on login page\n- Deployed v1.2 to production\n- Meeting with design team"
                                            className="w-full bg-[#101922] border border-[#283039] rounded-xl p-4 text-white min-h-[120px] outline-none focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] transition-all resize-none placeholder:text-gray-600"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={submitting || !newLog.trim()}
                                            className="flex items-center gap-2 bg-[#137fec] hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/20"
                                        >
                                            {submitting ? <Loader2 className="animate-spin size-5" /> : <span className="material-symbols-outlined text-[20px]">send</span>}
                                            <span>Save Log</span>
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Logs List */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#137fec]">history_edu</span>
                                    Activities
                                </h2>

                                {loadingLogs ? (
                                    <div className="flex justify-center py-10">
                                        <Loader2 className="animate-spin text-[#137fec] size-8" />
                                    </div>
                                ) : logs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-[#283039] rounded-2xl bg-[#1c2632]/30">
                                        <span className="material-symbols-outlined text-gray-600 text-5xl mb-3">note_add</span>
                                        <h3 className="text-lg font-medium text-gray-300">No logs for this day</h3>
                                        <p className="text-gray-500 text-sm">Start writing to track your work.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {logs.map((log) => (
                                            <div key={log._id} className="group relative bg-[#1c2632] p-5 rounded-xl border border-[#283039] hover:border-[#3e4856] transition-all duration-200 shadow-md">
                                                <div className="pr-10">
                                                    <p className="whitespace-pre-wrap text-gray-200 leading-relaxed text-[15px]">{log.activity}</p>
                                                </div>
                                                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#283039]">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-[#101922] px-2 py-1 rounded-md">
                                                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleDelete(log._id)}
                                                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    title="Delete Log"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default LogbookPage;
