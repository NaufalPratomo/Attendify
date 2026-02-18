"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Calendar, Download, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { toast } from "sonner";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

interface HolidayEntry {
  _id: string;
  dateString: string;
  name: string;
  type: 'GLOBAL' | 'PERSONAL' | 'PIKET';
  isDeductible?: boolean;
}

type ApiAttendanceRecord = Omit<AttendanceRecord, '_id'> & { _id?: unknown };

const MonthlyAttendanceReport: React.FC = () => {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [user, setUser] = useState<{ name: string, email: string, avatar?: string } | undefined>(undefined);
  const [targetBase, setTargetBase] = useState(11240);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<HolidayEntry[]>([]);

  // Manual Entry State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualForm, setManualForm] = useState<{
    checkIn: Date | undefined;
    checkOut: Date | undefined;
    notes: string;
  }>({
    checkIn: new Date(new Date().setHours(9, 0, 0, 0)),
    checkOut: new Date(new Date().setHours(17, 0, 0, 0)),
    notes: ''
  });

  // Edit/Delete State (manual records only)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editRecordId, setEditRecordId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    checkIn: Date | undefined;
    checkOut: Date | undefined;
    notes: string;
  }>({
    checkIn: new Date(),
    checkOut: new Date(),
    notes: ''
  });
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<AttendanceRecord | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  // PDF Export state
  const [isExporting, setIsExporting] = useState(false);

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
      setUser({
        name: statsData.userName,
        email: statsData.userEmail,
        avatar: statsData.userAvatar
      });

      const settingsRes = await fetch('/api/settings/target');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setTargetBase(settingsData.monthlyTargetBase);
      }

      const historyRes = await fetch(`/api/attendance/history?month=${selectedMonth}&year=${selectedYear}`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        const normalized: AttendanceRecord[] = (historyData.records || [])
          .map((r: ApiAttendanceRecord) => ({
            ...r,
            _id: normalizeRecordId(r._id),
          }))
          .filter((r: AttendanceRecord) => r._id);

        setAllRecords(normalized);
        setFilteredRecords(normalized); // Initially show all
      }

      // Fetch holidays for this month
      const holidayRes = await fetch(`/api/holidays?year=${selectedYear}&month=${selectedMonth + 1}`);
      if (holidayRes.ok) {
        const holidayData = await holidayRes.json();
        setHolidays(holidayData.holidays || []);
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
    let result = [...allRecords];

    // Filter by Status
    if (filterStatus !== 'All') {
      result = result.filter(r => r.status === filterStatus);
    }

    // Filter by Type
    if (filterType !== 'All') {
      const isManual = filterType === 'Manual';
      const isAuto = filterType === 'Auto';
      if (isManual) result = result.filter(r => r.isManual === true);
      if (isAuto) result = result.filter(r => !r.isManual);
    }

    // Safety check: ensure filtering happened
    if (result.length === 0 && allRecords.length > 0) {
      // Optional: could alert "No records match" but empty table is fine
    }

    setFilteredRecords(result);
  };

  useEffect(() => {
    // When fresh data arrives (e.g. month change), reset filters
    setFilteredRecords(allRecords);
    setFilterStatus('All');
    setFilterType('All');
  }, [allRecords]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualLoading(true);
    const toastId = toast.loading("Adding manual entry...");
    try {
      const res = await fetch('/api/attendance/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: manualForm.checkIn ? format(manualForm.checkIn, 'yyyy-MM-dd') : '',
          checkInTime: manualForm.checkIn ? format(manualForm.checkIn, 'HH:mm') : '',
          checkOutTime: manualForm.checkOut ? format(manualForm.checkOut, 'HH:mm') : '',
          notes: manualForm.notes,
          tzOffsetMinutes: new Date().getTimezoneOffset(),
        })
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || "Failed to add entry", { id: toastId });
        return;
      }

      toast.success("Manual entry added successfully", { id: toastId });
      setIsManualModalOpen(false);
      fetchData(); // Refresh list
    } catch (error) {
      console.error(error);
      toast.error("Error adding entry", { id: toastId });
    } finally {
      setManualLoading(false);
    }
  };

  // Calculate Stats
  const totalMinutes = allRecords.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
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

  // PDF Export Handler — Full month with Keterangan
  const handleExportPDF = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Generating PDF...");

    try {
      // Build holiday lookup maps for keterangan + deductible tracking
      const globalHolidayMap = new Map<string, string>();
      const personalHolidayMap = new Map<string, string>();
      const holidayDeductibleMap = new Map<string, boolean>();
      holidays.forEach(h => {
        if (h.type === 'GLOBAL') {
          globalHolidayMap.set(h.dateString, h.name);
        } else if (h.type === 'PERSONAL') {
          personalHolidayMap.set(h.dateString, h.name);
        }
        if (h.type === 'GLOBAL' || h.type === 'PERSONAL') {
          const existing = holidayDeductibleMap.get(h.dateString);
          const isDeductible = h.isDeductible !== false;
          holidayDeductibleMap.set(h.dateString, existing === true || isDeductible);
        }
      });

      // Fetch adjustments for this month (Ramadhan etc.)
      const adjRes = await fetch(`/api/adjustments?year=${selectedYear}&month=${selectedMonth + 1}`);
      const adjData = adjRes.ok ? await adjRes.json() : { adjustments: [] };
      const adjustments: { startDate: string; endDate: string; reductionMinutes: number }[] = adjData.adjustments || [];

      // Build attendance lookup: dateString → record
      const attendanceMap = new Map<string, AttendanceRecord>();
      allRecords.forEach(r => {
        const d = new Date(r.checkIn);
        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        // Keep the latest record if multiple per day
        if (!attendanceMap.has(ds) || (r.durationMinutes || 0) > (attendanceMap.get(ds)!.durationMinutes || 0)) {
          attendanceMap.set(ds, r);
        }
      });

      // 2. Indonesian day names
      const hariIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const bulanIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

      // 3. Iterate every day of the month
      const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const dailyTarget = 480; // 8 hours

      // Target calculation accumulators (synced with dashboard)
      let totalActualMinutes = 0;
      let totalDeduction = 0;
      let totalPiketBonus = 0;
      let totalAdjDeduction = 0;

      // Row shape: [Tanggal, Jam Masuk, Jam Keluar, Durasi, Keterangan]
      // Plus metadata for styling
      type RowMeta = { row: string[]; style: 'hadir' | 'piket' | 'cuti' | 'libur' | 'alpha' };
      const tableData: RowMeta[] = [];

      for (let day = 1; day <= totalDays; day++) {
        const date = new Date(selectedYear, selectedMonth, day);
        const dayOfWeek = date.getDay();
        const ds = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const dayLabel = `${hariIndo[dayOfWeek]}, ${String(day).padStart(2, '0')} ${bulanIndo[selectedMonth].substring(0, 3)} ${selectedYear}`;

        const att = attendanceMap.get(ds);
        const isGlobalHoliday = globalHolidayMap.has(ds);
        const isPersonalHoliday = personalHolidayMap.has(ds);
        const isSunday = dayOfWeek === 0;
        const holidayDeductible = holidayDeductibleMap.get(ds);
        const isPiketDay = holidays.some(h => h.type === 'PIKET' && h.dateString === ds);

        let checkIn = '-';
        let checkOut = '-';
        let duration = '-';
        let keterangan = '';
        let style: RowMeta['style'] = 'hadir';

        if (att) {
          // Case A: Ada data absensi
          checkIn = formatTime(att.checkIn);
          checkOut = formatTime(att.checkOut);
          duration = formatDuration(att.durationMinutes);

          if (isSunday || isGlobalHoliday) {
            keterangan = 'Piket';
            style = 'piket';
          } else {
            keterangan = 'Hadir';
            style = 'hadir';
          }
        } else {
          // Case B: Tidak ada absensi
          if (isPersonalHoliday) {
            const rawName = personalHolidayMap.get(ds) || '';
            const lower = rawName.toLowerCase();
            if (lower.includes('sakit') || lower.includes('izin') || lower.includes('cuti')) {
              keterangan = rawName;
            } else {
              keterangan = `Cuti (${rawName})`;
            }
            style = 'cuti';
          } else if (isGlobalHoliday) {
            keterangan = globalHolidayMap.get(ds)!;
            style = 'libur';
          } else if (isSunday) {
            keterangan = 'Libur Mingguan';
            style = 'libur';
          } else {
            keterangan = 'Tanpa Keterangan';
            style = 'alpha';
          }
        }

        tableData.push({ row: [dayLabel, checkIn, checkOut, duration, keterangan], style });

        // Accumulate actual minutes from attendance
        if (att && att.durationMinutes) {
          totalActualMinutes += att.durationMinutes;
        }

        // Target calculation (same priority as dashboard stats)
        if (isPiketDay) {
          totalPiketBonus += dailyTarget;
        } else if (isSunday) {
          // skip
        } else if (holidayDeductible !== undefined) {
          if (holidayDeductible === true) {
            totalDeduction += dailyTarget;
          }
        } else {
          // Normal work day — check adjustments
          for (const adj of adjustments) {
            if (ds >= adj.startDate && ds <= adj.endDate) {
              totalAdjDeduction += (adj.reductionMinutes || 0);
              break;
            }
          }
        }
      }

      // Calculate dynamic target (synced with dashboard)
      const dynamicTarget = targetBase - totalDeduction + totalPiketBonus - totalAdjDeduction;
      const surplusMins = totalActualMinutes - dynamicTarget;
      const realizationPct = dynamicTarget > 0 ? Math.round((totalActualMinutes / dynamicTarget) * 100) : 0;
      const targetReached = totalActualMinutes >= dynamicTarget;

      // 4. Generate PDF
      const doc = new jsPDF();

      // Title
      doc.setFontSize(16);
      doc.text(`Laporan Kehadiran - ${bulanIndo[selectedMonth]} ${selectedYear}`, 14, 20);

      // User Info
      doc.setFontSize(10);
      doc.text(`Nama: ${user?.name || 'N/A'}`, 14, 28);
      doc.text(`Email: ${user?.email || 'N/A'}`, 14, 33);
      doc.text(`Dicetak: ${format(new Date(), "dd MMMM yyyy, HH:mm")}`, 14, 38);

      // Color map for row styling
      const styleColors: Record<RowMeta['style'], [number, number, number] | null> = {
        hadir: null, // default / white
        piket: [220, 252, 231],   // #dcfce7 green
        cuti: [254, 249, 195],    // #fef9c3 yellow
        libur: [243, 244, 246],   // #787878ff grey
        alpha: null,              // white with red text
      };

      autoTable(doc, {
        head: [['Tanggal', 'Jam Masuk', 'Jam Keluar', 'Durasi', 'Keterangan']],
        body: tableData.map(d => d.row),
        theme: 'grid',
        startY: 44,
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [19, 127, 236],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 28, halign: 'center' },
          2: { cellWidth: 28, halign: 'center' },
          3: { cellWidth: 28, halign: 'center' },
          4: { cellWidth: 46 },
        },
        didParseCell: (data) => {
          if (data.section !== 'body') return;
          const meta = tableData[data.row.index];
          if (!meta) return;

          const bg = styleColors[meta.style];
          if (bg) {
            data.cell.styles.fillColor = bg;
          }
          // Red text for alpha rows
          if (meta.style === 'alpha') {
            data.cell.styles.textColor = [200, 50, 50];
            data.cell.styles.fontStyle = 'bold';
          }
          // Bold keterangan column for piket
          if (meta.style === 'piket' && data.column.index === 4) {
            data.cell.styles.textColor = [30, 100, 200];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });

      // Summary Section
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = (doc as any).lastAutoTable?.finalY || 150;
      const summaryY = finalY + 12;

      doc.setFontSize(11);
      doc.setFont(undefined as unknown as string, 'bold');
      doc.text("Ringkasan", 14, summaryY);

      doc.setFontSize(9);
      doc.setFont(undefined as unknown as string, 'normal');
      doc.text(`Target Bulanan: ${formatDuration(dynamicTarget)}`, 14, summaryY + 7);
      doc.text(`Total Kerja: ${formatDuration(totalActualMinutes)}`, 14, summaryY + 12);
      doc.text(`${targetReached ? 'Bonus' : 'Koreksi'}: ${formatSurplus(surplusMins)}`, 14, summaryY + 17);

      // Realisasi with color
      const pctLabel = `Realisasi: ${realizationPct}%`;
      if (targetReached) {
        doc.setTextColor(34, 139, 34); // green
      } else {
        doc.setTextColor(220, 50, 50); // red
      }
      doc.setFont(undefined as unknown as string, 'bold');
      doc.text(pctLabel, 14, summaryY + 22);
      doc.setTextColor(0, 0, 0); // reset
      doc.setFont(undefined as unknown as string, 'normal');

      // Breakdown detail
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text(`Base: ${formatDuration(targetBase)}  |  Potongan Libur: -${formatDuration(totalDeduction)}  |  Piket Bonus: +${formatDuration(totalPiketBonus)}  |  Adj: -${formatDuration(totalAdjDeduction)}`, 14, summaryY + 28);
      doc.setTextColor(0, 0, 0);

      // Legend
      const legendY = summaryY + 36;
      doc.setFontSize(8);
      doc.setFont(undefined as unknown as string, 'bold');
      doc.text("Keterangan Warna:", 14, legendY);
      doc.setFont(undefined as unknown as string, 'normal');

      const legends = [
        { label: 'Piket (hijau)', color: [220, 252, 231] as [number, number, number] },
        { label: 'Cuti/Sakit (kuning)', color: [254, 249, 195] as [number, number, number] },
        { label: 'Libur (abu-abu)', color: [243, 244, 246] as [number, number, number] },
        { label: 'Tanpa Keterangan (teks merah)', color: null },
      ];
      legends.forEach((l, i) => {
        const x = 14 + i * 45;
        if (l.color) {
          doc.setFillColor(l.color[0], l.color[1], l.color[2]);
          doc.rect(x, legendY + 2, 6, 3, 'F');
        }
        doc.text(l.label, x + (l.color ? 8 : 0), legendY + 4.5);
      });

      // Save
      doc.save(`laporan-kehadiran-${bulanIndo[selectedMonth].toLowerCase()}-${selectedYear}.pdf`);
      toast.success("PDF berhasil diekspor!", { id: toastId });
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Gagal mengekspor PDF", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const openEditModal = (record: AttendanceRecord) => {
    const id = normalizeRecordId(record._id);
    if (!id) {
      alert('Invalid record id');
      return;
    }

    setEditRecordId(id);
    // Parse existing strings to Date objects
    const [y, m, d] = record.checkIn.split('T')[0].split('-').map(Number);

    const checkInDate = new Date(record.checkIn);
    const checkOutDate = record.checkOut ? new Date(record.checkOut) : new Date(record.checkIn);
    if (!record.checkOut) {
      checkOutDate.setHours(17, 0, 0, 0); // Default if missing
    }

    setEditForm({
      checkIn: checkInDate,
      checkOut: checkOutDate,
      notes: record.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecordId) return;
    setEditLoading(true);
    const toastId = toast.loading("Updating entry...");
    try {
      const res = await fetch(`/api/attendance/record/${editRecordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editForm.checkIn ? format(editForm.checkIn, 'yyyy-MM-dd') : '',
          checkInTime: editForm.checkIn ? format(editForm.checkIn, 'HH:mm') : '',
          checkOutTime: editForm.checkOut ? format(editForm.checkOut, 'HH:mm') : '',
          notes: editForm.notes,
          tzOffsetMinutes: new Date().getTimezoneOffset(),
        })
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || 'Failed to update entry', { id: toastId });
        return;
      }

      toast.success("Entry updated successfully", { id: toastId });
      setIsEditModalOpen(false);
      setEditRecordId(null);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Error updating entry', { id: toastId });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (record: AttendanceRecord) => {
    const id = normalizeRecordId(record._id);
    if (!id) {
      toast.error('Invalid record id');
      return;
    }

    setDeleteLoadingId(id);
    const toastId = toast.loading("Deleting entry...");
    try {
      const res = await fetch(`/api/attendance/record/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || 'Failed to delete entry', { id: toastId });
        return;
      }
      toast.success("Entry deleted successfully", { id: toastId });
      setDeleteConfirmRecord(null);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Error deleting entry', { id: toastId });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <div className="bg-[#101922] font-sans text-white antialiased selection:bg-[#137fec]/30 min-h-screen">
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} user={user} />

        <div className="flex-1 flex flex-col transition-all duration-300">
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

                  <div className="flex flex-col min-w-35">
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

                  {/* Export PDF Button */}
                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="bg-[#1c2127] hover:bg-[#2d3642] text-emerald-400 border border-emerald-500/50 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2 h-10.5 mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Download size={18} />
                    )}
                    Export PDF
                  </button>

                  {/* Filter Button & Popover */}
                  <div className="relative mt-auto">
                    <button
                      onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                      className="bg-[#137fec] hover:bg-blue-600 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2 h-10.5 shadow-md shadow-blue-900/20"
                    >
                      <span className="material-symbols-outlined text-[20px]">filter_list</span>
                      Filter
                    </button>

                    {isFilterMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-[#1c2127] border border-[#3b4754] rounded-xl shadow-2xl p-4 z-50 flex flex-col gap-4">
                        {/* Status Filter */}
                        <div className="flex flex-col">
                          <label className="text-white text-xs font-semibold uppercase tracking-wider mb-1.5 ml-1">Status</label>
                          <div className="relative">
                            <select
                              value={filterStatus}
                              onChange={(e) => setFilterStatus(e.target.value)}
                              className="w-full appearance-none rounded-lg border border-[#3b4754] bg-[#111418] text-white py-2.5 px-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="All">All Statuses</option>
                              <option value="Valid">Valid</option>
                              <option value="Short">Short</option>
                              <option value="Present">Present</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#637588] pointer-events-none text-lg">filter_alt</span>
                          </div>
                        </div>

                        {/* Type Filter */}
                        <div className="flex flex-col">
                          <label className="text-white text-xs font-semibold uppercase tracking-wider mb-1.5 ml-1">Type</label>
                          <div className="relative">
                            <select
                              value={filterType}
                              onChange={(e) => setFilterType(e.target.value)}
                              className="w-full appearance-none rounded-lg border border-[#3b4754] bg-[#111418] text-white py-2.5 px-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="All">All Types</option>
                              <option value="Auto">Auto Check-in</option>
                              <option value="Manual">Manual Entry</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#637588] pointer-events-none text-lg">category</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#3b4754]">
                          <button
                            onClick={() => {
                              handleFilterApply();
                              setIsFilterMenuOpen(false);
                            }}
                            className="w-full bg-[#137fec] hover:bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold transition-colors"
                          >
                            Apply Filters
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
                      {isLoading ? (
                        // Skeleton Rows
                        [1, 2, 3, 4, 5].map((i) => (
                          <tr key={i}>
                            <td className="py-4 px-6"><div className="space-y-2"><Skeleton className="h-4 w-24 bg-[#283039]" /><Skeleton className="h-3 w-16 bg-[#283039]" /></div></td>
                            <td className="py-4 px-6"><Skeleton className="h-4 w-16 bg-[#283039]" /></td>
                            <td className="py-4 px-6"><Skeleton className="h-4 w-16 bg-[#283039]" /></td>
                            <td className="py-4 px-6"><Skeleton className="h-4 w-32 bg-[#283039]" /></td>
                            <td className="py-4 px-6"><Skeleton className="h-4 w-16 ml-auto bg-[#283039]" /></td>
                            <td className="py-4 px-6"><Skeleton className="h-6 w-20 mx-auto rounded-full bg-[#283039]" /></td>
                            <td className="py-4 px-6"><div className="flex justify-end gap-2"><Skeleton className="h-9 w-9 rounded-lg bg-[#283039]" /><Skeleton className="h-9 w-9 rounded-lg bg-[#283039]" /></div></td>
                          </tr>
                        ))
                      ) : filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-500">No attendance records found for this period.</td>
                        </tr>
                      ) : (
                        filteredRecords.map((record) => {
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
                                <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(record)}
                                    className="inline-flex items-center justify-center rounded-lg border border-[#3b4754] bg-[#111418] hover:bg-[#2d3642] text-white w-9 h-9 transition-colors"
                                    title="Edit entry"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmRecord(record)}
                                    disabled={deleteLoadingId === record._id}
                                    className="inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 w-9 h-9 transition-colors disabled:opacity-60"
                                    title="Delete entry"
                                  >
                                    {deleteLoadingId === record._id ? (
                                      <Loader2 className="animate-spin" size={16} />
                                    ) : (
                                      <Trash2 size={16} />
                                    )}
                                  </button>
                                </div>
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
          <div className="bg-[#1c2127] border border-[#3b4754] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-white text-xs font-semibold uppercase tracking-wider ml-1">Check In</label>
                  <DateTimePicker
                    value={manualForm.checkIn}
                    onChange={(date) => setManualForm(prev => ({ ...prev, checkIn: date }))}
                    className="w-full bg-[#111418] border-[#3b4754] text-white hover:bg-[#161b22] hover:text-white"
                    displayFormat={{ hour24: "PPP HH:mm" }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-white text-xs font-semibold uppercase tracking-wider ml-1">Check Out</label>
                  <DateTimePicker
                    value={manualForm.checkOut}
                    onChange={(date) => setManualForm(prev => ({ ...prev, checkOut: date }))}
                    className="w-full bg-[#111418] border-[#3b4754] text-white hover:bg-[#161b22] hover:text-white"
                    displayFormat={{ hour24: "PPP HH:mm" }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Notes</label>
                <textarea
                  rows={3}
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  placeholder="Reason for manual entry..."
                  className="bg-[#111418] border border-[#3b4754] text-white rounded-xl px-4 py-3 focus:border-[#137fec] outline-none transition-all resize-none"
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
                  {manualLoading ? (
                    <>
                      <Loader2 className="animate-spin size-5 mr-2" />
                      Saving...
                    </>
                  ) : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Manual Entry Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm reports-datetime-white-icons">
          <div className="bg-[#1c2127] border border-[#3b4754] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#3b4754] bg-[#20262e]">
              <h3 className="text-white font-bold text-lg">Edit Attendance</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#9dabb9] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-white text-xs font-semibold uppercase tracking-wider ml-1">Check In</label>
                  <DateTimePicker
                    value={editForm.checkIn}
                    onChange={(date) => setEditForm(prev => ({ ...prev, checkIn: date }))}
                    className="w-full bg-[#111418] border-[#3b4754] text-white hover:bg-[#161b22] hover:text-white"
                    displayFormat={{ hour24: "PPP HH:mm" }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-white text-xs font-semibold uppercase tracking-wider ml-1">Check Out</label>
                  <DateTimePicker
                    value={editForm.checkOut}
                    onChange={(date) => setEditForm(prev => ({ ...prev, checkOut: date }))}
                    className="w-full bg-[#111418] border-[#3b4754] text-white hover:bg-[#161b22] hover:text-white"
                    displayFormat={{ hour24: "PPP HH:mm" }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Notes</label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Reason for entry..."
                  className="bg-[#111418] border border-[#3b4754] text-white rounded-xl px-4 py-3 focus:border-[#137fec] outline-none transition-all resize-none"
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
                  {editLoading ? (
                    <>
                      <Loader2 className="animate-spin size-5 mr-2" />
                      Saving...
                    </>
                  ) : "Save Changes"}
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
              <h3 className="text-white font-bold text-lg">Delete Entry</h3>
              <button
                onClick={() => setDeleteConfirmRecord(null)}
                className="text-[#9dabb9] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-[#cfd8e3] text-sm">
                This will permanently delete the selected attendance entry. This action cannot be undone.
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
                  {deleteLoadingId === deleteConfirmRecord._id ? (
                    <>
                      <Loader2 className="animate-spin size-5 mr-2" />
                      Deleting...
                    </>
                  ) : "Delete"}
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
