"use client";

import React, { useState, useEffect } from "react";
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MonthSummaryCard from '@/components/MonthSummaryCard';
import DailyStatsCard from '@/components/DailyStatsCard';
import { Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

interface RecentActivity {
  _id: string;
  checkIn: string;
  checkOut?: string;
  status: string;
}

interface DashboardStats {
  currentMinutes: number;
  yearlyMinutes: number;
  todayStatus: 'none' | 'checked-in' | 'checked-out';
  recentActivity: RecentActivity[];
  userName: string;
  userEmail: string;
  userAvatar?: string;
  monthlyTargetMinutes: number;
  yearlyTargetMinutes: number;
  todayMinutes: number;
  dailyTargetMinutes: number;
}

const AttendifyDashboard: React.FC = () => {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'checkIn' | 'checkOut' | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    currentMinutes: 0,
    yearlyMinutes: 0,
    todayStatus: 'none',
    recentActivity: [],
    userName: '',
    userEmail: '',
    monthlyTargetMinutes: 0,
    yearlyTargetMinutes: 0,
    todayMinutes: 0,
    dailyTargetMinutes: 0
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }
      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
          console.error("Stats API Error JSON:", errorData);
        } catch (e) {
          const text = await res.text();
          console.error("Stats API Error Text:", text);
          errorData = { message: `Server error (${res.status}): ${text}` };
        }

        // Only alert if it's not a 401 (handled above)
        if (res.status !== 401) {
          alert(`Failed to load dashboard data: ${errorData?.details || errorData?.message || res.statusText}`);
        }
        return;
      }
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats (Network/Client Error):", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCheckIn = async () => {
    const toastId = toast.loading("Processing Check In...");
    try {
      setActionLoading('checkIn');
      const res = await fetch('/api/attendance/check-in', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message, { id: toastId });
      } else {
        toast.success("Check In Successful!", { id: toastId });
        await fetchStats();
      }
    } catch (error) {
      toast.error("Check-in failed", { id: toastId });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async () => {
    const toastId = toast.loading("Processing Check Out...");
    try {
      setActionLoading('checkOut');
      const res = await fetch('/api/attendance/check-out', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message, { id: toastId });
      } else {
        toast.success("Check Out Successful!", { id: toastId });
        await fetchStats();
      }
    } catch (error) {
      toast.error("Check-out failed", { id: toastId });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !stats.userName) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#101922] text-white">
        <Loader2 className="animate-spin size-10 text-[#137fec]" />
      </div>
    )
  }

  return (
    <div className="bg-[#101922] font-sans text-white antialiased selection:bg-[#137fec]/30 min-h-screen">
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          user={{
            name: stats.userName,
            email: stats.userEmail,
            avatar: stats.userAvatar
          }}
        />

        <div className="flex-1 flex flex-col lg:ml-72 transition-all duration-300">
          <Header
            onMenuClick={() => setIsSidebarOpen(true)}
            userName={stats.userName}
          />

          {/* Main Content Area */}
          <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 lg:px-8">
            <div className="w-full max-w-4xl space-y-12">
              {/* Clock Section */}
              <div className="flex flex-col items-center text-center animate-fade-in-up">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#283039] bg-[#1c2632] px-3 py-1 text-xs font-medium text-gray-400 shadow-sm">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex size-2 rounded-full bg-green-500"></span>
                  </span>
                  Live Time
                </div>
                <h1 className="mt-8 font-mono text-6xl font-bold tracking-tighter text-white sm:text-7xl md:text-8xl lg:text-[7rem] leading-none variant-numeric:tabular-nums">
                  {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                  <span className="text-3xl sm:text-4xl md:text-5xl text-gray-400 font-normal align-top mt-2 sm:mt-4 inline-block ml-4">
                    {currentTime.getHours() >= 12 ? 'PM' : 'AM'}
                  </span>
                </h1>
                <h2 className="mt-4 text-lg font-medium text-gray-400">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h2>
                <p className="text-sm text-[#137fec] mt-2">Welcome, {stats.userName}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 lg:flex-row lg:justify-center w-full max-w-2xl mx-auto">
                {/* Check In Button */}
                <button
                  onClick={handleCheckIn}
                  disabled={stats.todayStatus !== 'none' || actionLoading === 'checkIn'}
                  className={`group relative flex h-24 sm:h-20 w-full flex-1 items-center justify-center gap-5 sm:gap-4 overflow-hidden rounded-2xl px-10 sm:px-8 shadow-xl transition-all active:scale-95 ${stats.todayStatus === 'none' && actionLoading !== 'checkIn'
                    ? 'bg-[#137fec] shadow-[#137fec]/20 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#137fec]/30'
                    : 'bg-gray-700 cursor-not-allowed opacity-50'
                    }`}
                >
                  <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity group-hover:opacity-100"></div>
                  {actionLoading === 'checkIn' ? (
                    <>
                      <Loader2 className="animate-spin size-8 text-white" />
                      <span className="text-xl pb-2 pt-2 sm:text-2xl font-bold text-white">Processing...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-5xl sm:text-4xl text-white">
                        login
                      </span>
                      <span className="text-xl pb-2 pt-2 sm:text-2xl font-bold text-white">Check In</span>
                    </>
                  )}
                </button>

                {/* Check Out Button */}
                <button
                  onClick={handleCheckOut}
                  disabled={stats.todayStatus !== 'checked-in' || actionLoading === 'checkOut'}
                  className={`group relative flex h-24 sm:h-20 w-full flex-1 items-center justify-center gap-5 sm:gap-4 overflow-hidden rounded-2xl border border-[#283039] px-10 sm:px-8 transition-all active:scale-95 ${stats.todayStatus === 'checked-in' && actionLoading !== 'checkOut'
                    ? 'bg-[#1c2632] hover:bg-[#232d3b] hover:border-gray-600 cursor-pointer'
                    : 'bg-gray-800 border-gray-700 cursor-not-allowed opacity-50'
                    }`}
                >
                  {actionLoading === 'checkOut' ? (
                    <>
                      <Loader2 className="animate-spin size-8 text-gray-400" />
                      <span className="text-xl pb-2 pt-2 sm:text-2xl font-bold text-gray-200">Processing...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-5xl sm:text-4xl text-gray-500">
                        logout
                      </span>
                      <span className="text-xl pb-2 pt-2 sm:text-2xl font-bold text-gray-200">
                        Check Out
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
                {/* Daily Status Card (Formerly Monthly) */}
                <DailyStatsCard
                  todayMinutes={stats.todayMinutes || 0}
                  dailyTargetMinutes={stats.dailyTargetMinutes || 0}
                />

                {/* Monthly Summary Card (Formerly Yearly) */}
                <MonthSummaryCard
                  currentMinutes={stats.currentMinutes || 0}
                  monthlyTargetMinutes={stats.monthlyTargetMinutes || 0}
                />
              </div>

              {/* Recent Activity (Dynamic) */}
              <div className="rounded-2xl border border-[#283039] bg-[#1c2632]/50 p-6 backdrop-blur-sm">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {stats.recentActivity.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No recent activity found.</p>
                  ) : (
                    stats.recentActivity.map((activity) => (
                      <div key={activity._id} className="flex items-center justify-between border-b border-gray-800 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className={`size-2 rounded-full ${activity.checkOut ? 'bg-gray-400' : 'bg-green-500'}`}></div>
                          <span className="text-sm font-medium text-gray-300">
                            {activity.checkOut ? 'Checked Out' : 'Checked In'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400">
                          {activity.checkOut
                            ? new Date(activity.checkOut).toLocaleString()
                            : new Date(activity.checkIn).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AttendifyDashboard;
