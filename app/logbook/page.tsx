'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { toast } from 'sonner';
import { Loader2, Calendar as CalendarIcon, Upload, FileText, Download, X, Eye } from 'lucide-react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface LogEntry {
    _id: string;
    activity: string;
    createdAt: string;
    date: string;
    attachmentUrl?: string;
    attachmentName?: string;
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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteTrigger, setDeleteTrigger] = useState(0);

    // Monthly view state
    const [viewMonth, setViewMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [viewYear, setViewYear] = useState<string>(new Date().getFullYear().toString());
    const [monthlyLogs, setMonthlyLogs] = useState<LogEntry[]>([]);
    const [loadingMonthly, setLoadingMonthly] = useState(false);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLog.trim()) return;

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('date', format(selectedDate, 'yyyy-MM-dd'));
            formData.append('activity', newLog);
            if (selectedFile) {
                if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
                    toast.error("File size too large (max 5MB)");
                    setSubmitting(false);
                    return;
                }
                formData.append('file', selectedFile, selectedFile.name);
            }

            const res = await fetch('/api/logbook', {
                method: 'POST',
                body: formData // Auto sets content-type to multipart/form-data
            });

            if (res.ok) {
                toast.success("Activity logged");
                setNewLog('');
                setSelectedFile(null);
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

    // Monthly view state


    // Fetch monthly logs
    useEffect(() => {
        const fetchMonthlyLogs = async () => {
            setLoadingMonthly(true);
            try {
                const res = await fetch(`/api/logbook?month=${viewMonth}&year=${viewYear}`);
                if (res.ok) {
                    const data = await res.json();
                    setMonthlyLogs(data.logs);
                } else {
                    setMonthlyLogs([]);
                }
            } catch (error) {
                console.error("Failed to fetch monthly logs", error);
            } finally {
                setLoadingMonthly(false);
            }
        };

        fetchMonthlyLogs();
    }, [viewMonth, viewYear]);

    // Refresh monthly logs when a new log is added or deleted
    useEffect(() => {
        if (!submitting) {
            // Re-fetch monthly logs if the added log is in the viewed month/year
            // Simplest approach: just re-fetch always or check dates.
            // For now, let's just trigger a re-fetch if the current view matches the selectedDate's month/year
            const logDate = selectedDate;
            if ((logDate.getMonth() + 1).toString() === viewMonth && logDate.getFullYear().toString() === viewYear) {
                const fetchMonthlyLogs = async () => {
                    const res = await fetch(`/api/logbook?month=${viewMonth}&year=${viewYear}`);
                    if (res.ok) {
                        const data = await res.json();
                        setMonthlyLogs(data.logs);
                    }
                };
                fetchMonthlyLogs();
            }
        }
    }, [submitting, deleteTrigger]); // We need a trigger for delete too.

    // Allow manual refresh of monthly logs
    const refreshMonthlyLogs = async () => {
        setLoadingMonthly(true);
        try {
            const res = await fetch(`/api/logbook?month=${viewMonth}&year=${viewYear}`);
            if (res.ok) {
                const data = await res.json();
                setMonthlyLogs(data.logs);
            }
        } finally {
            setLoadingMonthly(false);
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Add Title
        doc.setFontSize(18);
        doc.text(`Logbook - ${months.find(m => m.value === viewMonth)?.label} ${viewYear}`, 14, 22);

        doc.setFontSize(11);
        doc.text(`User: ${user.name}`, 14, 30);
        doc.text(`Email: ${user.email}`, 14, 36);

        const tableColumn = ["Date", "Activity", "Attachment"];
        const tableRows = monthlyLogs.map(log => [
            format(new Date(log.date), "MMM d, yyyy"),
            log.activity,
            log.attachmentName || "-"
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 44,
            styles: {
                fontSize: 10,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [19, 127, 236], // #137fec
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 'auto' }, // Activity takes remaining space
                2: { cellWidth: 40 }
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            }
        });

        doc.save(`logbook-${viewMonth}-${viewYear}.pdf`);
    };



    const handleDelete = async (id: string) => {
        if (!confirm("Delete this log?")) return;
        try {
            const res = await fetch(`/api/logbook?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Log deleted");
                fetchLogs();
                setDeleteTrigger(prev => prev + 1); // Trigger monthly refresh
            } else {
                toast.error("Failed to delete");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error deleting log");
        }
    };

    const months = [
        { value: "1", label: "January" },
        { value: "2", label: "February" },
        { value: "3", label: "March" },
        { value: "4", label: "April" },
        { value: "5", label: "May" },
        { value: "6", label: "June" },
        { value: "7", label: "July" },
        { value: "8", label: "August" },
        { value: "9", label: "September" },
        { value: "10", label: "October" },
        { value: "11", label: "November" },
        { value: "12", label: "December" },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

    // Edit state
    const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
    const [editActivity, setEditActivity] = useState('');
    const [editFile, setEditFile] = useState<File | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);

    const handleEditClick = (log: LogEntry) => {
        setEditingLog(log);
        setEditActivity(log.activity);
        setEditFile(null); // Reset file input
        setIsEditModalOpen(true);
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLog || !editActivity.trim()) return;

        setSavingEdit(true);
        try {
            const formData = new FormData();
            formData.append('id', editingLog._id);
            formData.append('activity', editActivity);
            if (editFile) {
                if (editFile.size > 5 * 1024 * 1024) { // 5MB limit
                    toast.error("File size too large (max 5MB)");
                    setSavingEdit(false);
                    return;
                }
                formData.append('file', editFile, editFile.name);
            }

            const res = await fetch('/api/logbook', {
                method: 'PUT',
                body: formData
            });

            if (res.ok) {
                toast.success("Log updated");
                setIsEditModalOpen(false);
                setEditingLog(null);
                setEditActivity('');
                setEditFile(null);
                fetchLogs(); // Refresh daily logs
                setDeleteTrigger(prev => prev + 1); // Trigger monthly refresh (reusing this trigger basically means "refresh data")
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to update log");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error updating log");
        } finally {
            setSavingEdit(false);
        }
    };

    // View Modal state
    const [viewingFile, setViewingFile] = useState<{ url: string; name: string; type: string } | null>(null);

    const handleViewClick = (log: LogEntry) => {
        if (!log.attachmentUrl) return;

        // Determine type roughly (not perfect but works for common extensions)
        const lowerName = (log.attachmentName || "").toLowerCase();
        let type = 'unknown';
        if (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.gif')) {
            type = 'image';
        } else if (lowerName.endsWith('.pdf')) {
            type = 'pdf';
        }

        setViewingFile({
            url: log.attachmentUrl,
            name: log.attachmentName || "File",
            type
        });
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

                                    {/* File Input */}
                                    <div className="mb-6 flex items-center gap-4">
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="file-upload"
                                                className="hidden"
                                                onChange={handleFileChange}
                                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                            />
                                            <label
                                                htmlFor="file-upload"
                                                className="flex items-center gap-2 cursor-pointer bg-[#101922] border border-[#283039] hover:border-[#137fec] text-gray-300 px-4 py-2 rounded-lg transition-all text-sm"
                                            >
                                                <Upload className="w-4 h-4" />
                                                Attach File
                                            </label>
                                        </div>
                                        {selectedFile && (
                                            <div className="flex items-center gap-2 bg-[#137fec]/10 border border-[#137fec]/20 px-3 py-1.5 rounded-lg text-sm text-[#137fec]">
                                                <span className="max-w-[150px] truncate">{selectedFile.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedFile(null)}
                                                    className="hover:text-red-400 transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
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
                                    Activities for {format(selectedDate, "MMM d, yyyy")}
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

                                                    {log.attachmentUrl && (
                                                        <div className="mt-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleViewClick(log)}
                                                                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#137fec] bg-[#137fec]/10 border border-[#137fec]/20 rounded-lg hover:bg-[#137fec]/20 transition-colors"
                                                                title="Download/View Attachment"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                                View {log.attachmentName ? log.attachmentName : "File"}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#283039]">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-[#101922] px-2 py-1 rounded-md">
                                                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>

                                                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => handleEditClick(log)}
                                                        className="p-2 text-gray-500 hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-lg transition-all"
                                                        title="Edit Log"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(log._id)}
                                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                        title="Delete Log"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Monthly Overview Table */}
                            <div className="space-y-4 pt-8 border-t border-[#283039] mt-12">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#137fec]">calendar_month</span>
                                        Monthly Overview
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            onClick={handleExportPDF}
                                            variant="outline"
                                            className="bg-[#1c2632] border-[#283039] text-white hover:bg-[#232d3b] hover:text-white mr-2"
                                            disabled={monthlyLogs.length === 0}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Export PDF
                                        </Button>

                                        <Select value={viewMonth} onValueChange={setViewMonth}>
                                            <SelectTrigger className="w-[140px] bg-[#1c2632] border-[#283039] text-white">
                                                <SelectValue placeholder="Month" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#1c2632] border-[#283039] text-white">
                                                {months.map((m) => (
                                                    <SelectItem key={m.value} value={m.value} className="focus:bg-[#137fec] focus:text-white">
                                                        {m.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select value={viewYear} onValueChange={setViewYear}>
                                            <SelectTrigger className="w-[100px] bg-[#1c2632] border-[#283039] text-white">
                                                <SelectValue placeholder="Year" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#1c2632] border-[#283039] text-white">
                                                {years.map((y) => (
                                                    <SelectItem key={y} value={y} className="focus:bg-[#137fec] focus:text-white">
                                                        {y}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-[#283039] overflow-hidden bg-[#1c2632] shadow-lg">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs uppercase bg-[#101922] text-gray-400 border-b border-[#283039]">
                                                <tr>
                                                    <th className="px-6 py-4 font-semibold w-[150px]">Date</th>
                                                    <th className="px-6 py-4 font-semibold">Activity</th>
                                                    <th className="px-6 py-4 font-semibold w-[40px]">File</th>
                                                    <th className="px-6 py-4 font-semibold w-[100px] text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#283039]">
                                                {loadingMonthly ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                            <Loader2 className="animate-spin inline-block size-6 text-[#137fec]" />
                                                            <span className="ml-2">Loading logs...</span>
                                                        </td>
                                                    </tr>
                                                ) : monthlyLogs.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                            No logs found for this month.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    monthlyLogs.map((log) => (
                                                        <tr key={log._id} className="hover:bg-[#232d3b] transition-colors group">
                                                            <td className="px-6 py-4 text-gray-300 align-top whitespace-nowrap">
                                                                {format(new Date(log.date), "MMM d, yyyy")}
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-200 align-top whitespace-pre-wrap leading-relaxed">
                                                                {log.activity}
                                                            </td>
                                                            <td className="px-6 py-4 align-top">
                                                                {log.attachmentUrl && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleViewClick(log)}
                                                                        title={log.attachmentName || "View File"}
                                                                        className="inline-flex items-center justify-center w-8 h-8 text-[#137fec] bg-[#137fec]/10 rounded-lg hover:bg-[#137fec] hover:text-white transition-all"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-right align-top group">
                                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => handleEditClick(log)}
                                                                        className="p-1.5 text-gray-500 hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-lg transition-all"
                                                                        title="Edit Log"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(log._id)}
                                                                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                                        title="Delete Log"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </main>

                    {/* Edit Modal */}
                    {isEditModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-[#1c2632] border border-[#283039] rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <h2 className="text-xl font-bold mb-4">Edit Log</h2>
                                <form onSubmit={handleEditSave}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Activity
                                        </label>
                                        <textarea
                                            value={editActivity}
                                            onChange={(e) => setEditActivity(e.target.value)}
                                            placeholder="Update your activity..."
                                            className="w-full bg-[#101922] border border-[#283039] rounded-xl p-4 text-white min-h-[120px] outline-none focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] transition-all resize-none placeholder:text-gray-600"
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Update Attachment (Optional)
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    id="edit-file-upload"
                                                    className="hidden"
                                                    onChange={(e) => e.target.files && setEditFile(e.target.files[0])}
                                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                                />
                                                <label
                                                    htmlFor="edit-file-upload"
                                                    className="flex items-center gap-2 cursor-pointer bg-[#101922] border border-[#283039] hover:border-[#137fec] text-gray-300 px-4 py-2 rounded-lg transition-all text-sm"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                    Replace File
                                                </label>
                                            </div>
                                            {editFile && (
                                                <div className="flex items-center gap-2 bg-[#137fec]/10 border border-[#137fec]/20 px-3 py-1.5 rounded-lg text-sm text-[#137fec]">
                                                    <span className="max-w-[150px] truncate">{editFile.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditFile(null)}
                                                        className="hover:text-red-400 transition-colors"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setIsEditModalOpen(false)}
                                            className="text-gray-400 hover:text-white hover:bg-[#283039]"
                                        >
                                            Cancel
                                        </Button>
                                        <button
                                            type="submit"
                                            disabled={savingEdit || !editActivity.trim()}
                                            className="bg-[#137fec] hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                                        >
                                            {savingEdit && <Loader2 className="animate-spin size-4" />}
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* View File Modal */}
                    {viewingFile && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-[#1c2632] border border-[#283039] rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl relative">
                                <div className="p-4 border-b border-[#283039] flex items-center justify-between">
                                    <h3 className="font-semibold text-white truncate max-w-[80%]">{viewingFile.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={viewingFile.url}
                                            download={viewingFile.name}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-[#283039] rounded-lg transition-colors"
                                            title="Download"
                                        >
                                            <Download className="w-5 h-5" />
                                        </a>
                                        <button
                                            onClick={() => setViewingFile(null)}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-[#283039] rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 bg-[#101922] p-4 overflow-auto flex items-center justify-center">
                                    {viewingFile.type === 'image' ? (
                                        <img src={viewingFile.url} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-md" />
                                    ) : (
                                        <iframe
                                            src={viewingFile.url}
                                            className="w-full h-full rounded-lg bg-white"
                                            title="File Preview"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );


};

export default LogbookPage;
