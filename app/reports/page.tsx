"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AttendanceRecord {
  _id: string;
  checkIn: string;
  checkOut?: string;
  durationMinutes?: number;
  status: string;
  date: string;
  isManual?: boolean;
  notes?: string;
}

const MonthlyAttendanceReport: React.FC = () => {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [user, setUser] = useState<{ name: string, email: string } | undefined>(undefined);
  const [targetBase, setTargetBase] = useState(11240);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Manual Entry State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualForm, setManualForm] = useState({
    date: new Date().toISOString().split('T')[0],
    checkInTime: '09:00',
    checkOutTime: '17:00',
    notes: ''
  });

  // Edit/Delete State (manual records only)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editRecordId, setEditRecordId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    date: new Date().toISOString().split('T')[0],
    checkInTime: '09:00',
    checkOutTime: '17:00',
    notes: ''
  });
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<AttendanceRecord | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const normalizeRecordId = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      const maybeOid = (value as { $oid?: unknown }).$oid;
      if (typeof maybeOid === 'string') return maybeOid;

      const maybeToString = (value as { toString?: unknown }).toString;
      if (typeof maybeToString === 'function') return String(maybeToString.call(value));
    }
    return '';
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const statsRes = await fetch('/api/dashboard/stats');
      if (statsRes.status === 401) {
        router.push('/auth/login');
        return;
      }
      const statsData = await statsRes.json();
      setUser({ name: statsData.userName, email: statsData.userEmail });

      const settingsRes = await fetch('/api/settings/target');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setTargetBase(settingsData.monthlyTargetBase);
      }

      const historyRes = await fetch(`/api/attendance/history?month=${selectedMonth}&year=${selectedYear}`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        const normalized: AttendanceRecord[] = (historyData.records || [])
          .map((r: any) => ({
            ...r,
            _id: normalizeRecordId(r?._id),
          }))
          .filter((r: AttendanceRecord) => r._id);

        setRecords(normalized);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  }, [router, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterApply = () => {
    fetchData();
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualLoading(true);
    try {
      const res = await fetch('/api/attendance/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualForm)
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to add entry");
        return;
      }

      setIsManualModalOpen(false);
      fetchData(); // Refresh list
    } catch (error) {
      console.error(error);
      alert("Error adding entry");
    } finally {
      setManualLoading(false);
    }
  };

  // Calculate Stats
  const totalMinutes = records.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const dailyTarget = targetBase / 31;

  // Dynamic Target Logic
  let targetDays = daysInMonth;
  const today = new Date();
  const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === today.getMonth();
  const isFutureMonth = new Date(selectedYear, selectedMonth, 1) > today;

  if (isCurrentMonth) {
    targetDays = today.getDate();
  } else if (isFutureMonth) {
    targetDays = 0;
  }

  const monthlyTargetMinutes = Math.round(dailyTarget * targetDays);
  const surplusMinutes = totalMinutes - monthlyTargetMinutes;
  const isTargetReached = surplusMinutes >= 0;
  // Prevent division by zero
  const percentComplete = monthlyTargetMinutes > 0
    ? Math.min(100, Math.round((totalMinutes / monthlyTargetMinutes) * 100))
    : 0;


  // Format Helpers
  const formatTime = (isoString?: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const toDateInputValue = (isoString: string) => {
    const d = new Date(isoString);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const toTimeInputValue = (isoString: string) => {
    const d = new Date(isoString);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
      day: date.toLocaleDateString('en-US', { weekday: 'long' })
    };
  };

  const formatDuration = (minutes?: number) => {
    if (minutes === undefined || minutes === null) return "0h 00m";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  };

  const formatSurplus = (mins: number) => {
    const absMins = Math.abs(mins);
    const h = Math.floor(absMins / 60);
    const m = absMins % 60;
    return `${mins >= 0 ? '+' : '-'}${h}h ${m.toString().padStart(2, '0')}m`;
  };

  const openEditModal = (record: AttendanceRecord) => {
    const id = normalizeRecordId((record as any)?._id);
    if (!id) {
      alert('Invalid record id');
      return;
    }

    setEditRecordId(id);
    setEditForm({
      date: toDateInputValue(record.checkIn),
      checkInTime: toTimeInputValue(record.checkIn),
      checkOutTime: record.checkOut ? toTimeInputValue(record.checkOut) : '17:00',
      notes: record.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecordId) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/attendance/record/${editRecordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Failed to update entry');
        return;
      }

      setIsEditModalOpen(false);
      setEditRecordId(null);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error updating entry');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (record: AttendanceRecord) => {
    const id = normalizeRecordId((record as any)?._id);
    if (!id) {
      alert('Invalid record id');
      return;
    }

    setDeleteLoadingId(id);
    try {
      const res = await fetch(`/api/attendance/record/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Failed to delete entry');
        return;
      }
      setDeleteConfirmRecord(null);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error deleting entry');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <div className="bg-[#101922] font-sans text-white antialiased selection:bg-[#137fec]/30 min-h-screen">
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} user={user} />

        <div className="flex-1 flex flex-col lg:ml-72 transition-all duration-300">
          <Header onMenuClick={() => setIsSidebarOpen(true)} userName={user?.name} />

          <main className="flex flex-1 flex-col overflow-y-auto">
            <div className="w-full max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col flex-1">

              {/* Heading & Controls */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                <div className="flex flex-col gap-2">
                  <h2 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Monthly Report</h2>
                  <p className="text-[#9dabb9] text-base font-normal">Track daily attendance, overtime, and target realization.</p>
                </div>

                <div className="flex flex-wrap items-end gap-3 bg-[#1c2127] p-4 rounded-xl border border-[#3b4754] shadow-sm">
                  <div className="flex flex-col min-w-35">
                    <label className="text-white text-xs font-semibold uppercase tracking-wider mb-1.5 ml-1">Month</label>
                    <div className="relative">
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="w-full appearance-none rounded-lg border border-[#3b4754] bg-[#111418] text-white py-2.5 px-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {months.map((m, i) => (
                          <option key={i} value={i}>{m}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#637588] pointer-events-none text-lg">expand_more</span>
                    </div>
                  </div>

                  <div className="flex flex-col min-w-25">
                    <label className="text-white text-xs font-semibold uppercase tracking-wider mb-1.5 ml-1">Year</label>
                    <div className="relative">
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="w-full appearance-none rounded-lg border border-[#3b4754] bg-[#111418] text-white py-2.5 px-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {years.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#637588] pointer-events-none text-lg">expand_more</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsManualModalOpen(true)}
                    className="bg-[#1c2127] hover:bg-[#2d3642] text-[#137fec] border border-[#137fec] rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2 h-10.5 mt-auto"
                  >
                    <Plus size={18} />
                    Add Manual
                  </button>

                  <button
                    onClick={handleFilterApply}
                    disabled={isLoading}
                    className="bg-[#137fec] hover:bg-blue-600 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2 h-10.5 mt-auto shadow-md shadow-blue-900/20 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin text-white size-5" /> : <span className="material-symbols-outlined text-[20px]">filter_list</span>}
                    {isLoading ? "Loading..." : "Filter"}
                  </button>
                </div>
              </div>

              {/* Main Data Table */}
              <div className="flex flex-col bg-[#1c2127] rounded-xl border border-[#3b4754] shadow-sm overflow-hidden flex-1">
                <div className="px-6 py-4 border-b border-[#3b4754] flex justify-between items-center bg-[#20262e]">
                  <h3 className="text-white font-bold text-lg">{months[selectedMonth]} {selectedYear} Attendance</h3>
                </div>

                <div className="overflow-x-auto grow">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#252b33] sticky top-0 z-10">
                      <tr>
                        <th className="py-3 px-6 text-xs font-semibold text-[#9dabb9] uppercase tracking-wider border-b border-[#3b4754]">Date</th>
                        <th className="py-3 px-6 text-xs font-semibold text-[#9dabb9] uppercase tracking-wider border-b border-[#3b4754]">Check In</th>
                        <th className="py-3 px-6 text-xs font-semibold text-[#9dabb9] uppercase tracking-wider border-b border-[#3b4754]">Check Out</th>
                        <th className="py-3 px-6 text-xs font-semibold text-[#9dabb9] uppercase tracking-wider border-b border-[#3b4754]">Notes</th>
                        <th className="py-3 px-6 text-xs font-semibold text-[#9dabb9] uppercase tracking-wider border-b border-[#3b4754] text-right">Total Hours</th>
                        <th className="py-3 px-6 text-xs font-semibold text-[#9dabb9] uppercase tracking-wider border-b border-[#3b4754] text-center">Status</th>
                        <th className="py-3 px-6 text-xs font-semibold text-[#9dabb9] uppercase tracking-wider border-b border-[#3b4754] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2d3642]">
                      {records.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-500">No attendance records found for this period.</td>
                        </tr>
                      ) : (
                        records.map((record) => {
                          const { date, day } = formatDate(record.checkIn);
                          return (
                            <tr key={record._id} className="hover:bg-[#232930] transition-colors group">
                              <td className="py-4 px-6 text-sm font-medium text-white">
                                <div className="flex flex-col">
                                  <span>{date}</span>
                                  <span className="text-xs text-[#9dabb9] font-normal">{day}</span>
                                  {record.isManual && <span className="text-[10px] text-yellow-500 bg-yellow-500/10 px-1.5 rounded-full w-fit mt-1">Manual</span>}
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm text-[#cfd8e3] font-mono">
                                {formatTime(record.checkIn)}
                              </td>
                              <td className="py-4 px-6 text-sm text-[#cfd8e3] font-mono">
                                {formatTime(record.checkOut)}
                              </td>
                              <td className="py-4 px-6 text-sm text-[#9dabb9] italic">
                                {record.notes || "-"}
                              </td>
                              <td className="py-4 px-6 text-sm font-bold text-white text-right font-mono">
                                {formatDuration(record.durationMinutes)}
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${record.status === 'Valid' || record.status === 'Present'
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                  }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${record.status === 'Valid' || record.status === 'Present' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                  {record.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                {record.isManual ? (
                                  <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => openEditModal(record)}
                                      className="inline-flex items-center justify-center rounded-lg border border-[#3b4754] bg-[#111418] hover:bg-[#2d3642] text-white w-9 h-9 transition-colors"
                                      title="Edit manual entry"
                                    >
                                      <Pencil size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteConfirmRecord(record)}
                                      disabled={deleteLoadingId === record._id}
                                      className="inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 w-9 h-9 transition-colors disabled:opacity-60"
                                      title="Delete manual entry"
                                    >
                                      {deleteLoadingId === record._id ? (
                                        <Loader2 className="animate-spin" size={16} />
                                      ) : (
                                        <Trash2 size={16} />
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[#637588] text-sm">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#1a1f25] border-t border-[#3b4754] px-6 py-6 md:py-8">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex flex-wrap justify-center md:justify-start gap-8 md:gap-12 w-full md:w-auto">
                      <div className="flex flex-col items-center md:items-start gap-1">
                        <p className="text-[#9dabb9] text-xs font-semibold uppercase tracking-wider">Realization</p>
                        <p className="text-white text-2xl font-black">{formatDuration(totalMinutes)}</p>
                      </div>
                      <div className="w-px h-12 bg-[#3b4754] hidden md:block"></div>
                      <div className="flex flex-col items-center md:items-start gap-1">
                        <p className="text-[#9dabb9] text-xs font-semibold uppercase tracking-wider">
                          {isCurrentMonth ? "Target (To Date)" : "Monthly Target"}
                        </p>
                        <p className="text-white text-2xl font-black">{formatDuration(monthlyTargetMinutes)}</p>
                      </div>
                      <div className="w-px h-12 bg-[#3b4754] hidden md:block"></div>
                      <div className="flex flex-col items-center md:items-start gap-1">
                        <p className="text-[#9dabb9] text-xs font-semibold uppercase tracking-wider">{isTargetReached ? "Bonus" : "Correction"}</p>
                        <p className={`${isTargetReached ? 'text-emerald-400' : 'text-red-400'} text-2xl font-black`}>
                          {formatSurplus(surplusMinutes)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-[#283039] py-3 px-5 rounded-lg border border-[#3b4754] shadow-sm">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${isTargetReached ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        <span className="material-symbols-outlined text-2xl">{isTargetReached ? 'emoji_events' : 'trending_down'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white text-sm font-bold">{isTargetReached ? 'Target Reached' : 'Target Missed'}</span>
                        <span className="text-[#9dabb9] text-xs">{percentComplete}% Completion</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 w-full bg-[#2d3642] rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${isTargetReached ? 'bg-green-500' : 'bg-[#137fec]'}`}
                      style={{ width: `${percentComplete}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm reports-datetime-white-icons">
          <div className="bg-[#1c2127] border border-[#3b4754] rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#3b4754] bg-[#20262e]">
              <h3 className="text-white font-bold text-lg">Add Manual Attendance</h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-[#9dabb9] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#9dabb9]">Date</label>
                <input
                  type="date"
                  required
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                  className="bg-[#111418] border border-[#3b4754] text-white rounded-lg px-3 py-2.5 focus:border-[#137fec] outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#9dabb9]">Check In</label>
                  <input
                    type="time"
                    required
                    value={manualForm.checkInTime}
                    onChange={(e) => setManualForm({ ...manualForm, checkInTime: e.target.value })}
                    className="bg-[#111418] border border-[#3b4754] text-white rounded-lg px-3 py-2.5 focus:border-[#137fec] outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#9dabb9]">Check Out</label>
                  <input
                    type="time"
                    required
                    value={manualForm.checkOutTime}
                    onChange={(e) => setManualForm({ ...manualForm, checkOutTime: e.target.value })}
                    className="bg-[#111418] border border-[#3b4754] text-white rounded-lg px-3 py-2.5 focus:border-[#137fec] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#9dabb9]">Notes</label>
                <textarea
                  rows={3}
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  placeholder="Reason for manual entry..."
                  className="bg-[#111418] border border-[#3b4754] text-white rounded-lg px-3 py-2.5 focus:border-[#137fec] outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="flex-1 bg-transparent border border-[#3b4754] text-[#9dabb9] hover:text-white hover:bg-[#2d3642] py-2.5 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualLoading}
                  className="flex-1 bg-[#137fec] hover:bg-blue-600 text-white py-2.5 rounded-lg font-semibold transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-70 flex justify-center items-center"
                >
                  {manualLoading ? <Loader2 className="animate-spin size-5" /> : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Manual Entry Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm reports-datetime-white-icons">
          <div className="bg-[#1c2127] border border-[#3b4754] rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#3b4754] bg-[#20262e]">
              <h3 className="text-white font-bold text-lg">Edit Manual Attendance</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#9dabb9] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#9dabb9]">Date</label>
                <input
                  type="date"
                  required
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="bg-[#111418] border border-[#3b4754] text-white rounded-lg px-3 py-2.5 focus:border-[#137fec] outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#9dabb9]">Check In</label>
                  <input
                    type="time"
                    required
                    value={editForm.checkInTime}
                    onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })}
                    className="bg-[#111418] border border-[#3b4754] text-white rounded-lg px-3 py-2.5 focus:border-[#137fec] outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#9dabb9]">Check Out</label>
                  <input
                    type="time"
                    required
                    value={editForm.checkOutTime}
                    onChange={(e) => setEditForm({ ...editForm, checkOutTime: e.target.value })}
                    className="bg-[#111418] border border-[#3b4754] text-white rounded-lg px-3 py-2.5 focus:border-[#137fec] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#9dabb9]">Notes</label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Reason for manual entry..."
                  className="bg-[#111418] border border-[#3b4754] text-white rounded-lg px-3 py-2.5 focus:border-[#137fec] outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-transparent border border-[#3b4754] text-[#9dabb9] hover:text-white hover:bg-[#2d3642] py-2.5 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 bg-[#137fec] hover:bg-blue-600 text-white py-2.5 rounded-lg font-semibold transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-70 flex justify-center items-center"
                >
                  {editLoading ? <Loader2 className="animate-spin size-5" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1c2127] border border-[#3b4754] rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#3b4754] bg-[#20262e]">
              <h3 className="text-white font-bold text-lg">Delete Manual Entry</h3>
              <button
                onClick={() => setDeleteConfirmRecord(null)}
                className="text-[#9dabb9] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-[#cfd8e3] text-sm">
                This will permanently delete the selected manual attendance entry. This action cannot be undone.
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmRecord(null)}
                  className="flex-1 bg-transparent border border-[#3b4754] text-[#9dabb9] hover:text-white hover:bg-[#2d3642] py-2.5 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirmRecord)}
                  disabled={deleteLoadingId === deleteConfirmRecord._id}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold transition-colors shadow-lg shadow-red-900/20 disabled:opacity-70 flex justify-center items-center"
                >
                  {deleteLoadingId === deleteConfirmRecord._id ? <Loader2 className="animate-spin size-5" /> : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Make the native calendar/clock indicator icons white (Chromium/WebKit). Scoped to Reports modals only. */
        .reports-datetime-white-icons input[type='date']::-webkit-calendar-picker-indicator,
        .reports-datetime-white-icons input[type='time']::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default MonthlyAttendanceReport;