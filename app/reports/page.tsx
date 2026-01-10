"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

const MonthlyAttendanceReport: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="bg-[#101922] font-sans text-white antialiased selection:bg-[#137fec]/30 min-h-screen">
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Main Content Area */}
        <main className="flex flex-1 flex-col overflow-y-auto">
          <div className="w-full max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col flex-1">
              
              {/* Breadcrumbs */}
              <div className="flex flex-wrap gap-2 mb-6">
                <a className="text-[#637588] dark:text-[#9dabb9] text-sm font-medium hover:text-primary transition-colors" href="#">Dashboard</a>
                <span className="text-[#637588] dark:text-[#9dabb9] text-sm font-medium">/</span>
                <a className="text-[#637588] dark:text-[#9dabb9] text-sm font-medium hover:text-primary transition-colors" href="#">Reports</a>
                <span className="text-[#637588] dark:text-[#9dabb9] text-sm font-medium">/</span>
                <span className="text-[#111418] dark:text-white text-sm font-medium">Monthly Attendance</span>
              </div>

              {/* Page Heading & Filters */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                <div className="flex flex-col gap-2">
                  <h2 className="text-[#111418] dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Monthly Report</h2>
                  <p className="text-[#637588] dark:text-[#9dabb9] text-base font-normal">Track daily attendance, overtime, and target realization.</p>
                </div>
                {/* Filter Bar */}
                <div className="flex flex-wrap items-end gap-3 bg-white dark:bg-[#1c2127] p-4 rounded-xl border border-[#e5e7eb] dark:border-[#3b4754] shadow-sm">
                  <div className="flex flex-col min-w-35">
                    <label className="text-[#111418] dark:text-white text-xs font-semibold uppercase tracking-wider mb-1.5 ml-1">Month</label>
                    <div className="relative">
                      <select className="w-full appearance-none rounded-lg border border-[#e5e7eb] dark:border-[#3b4754] bg-[#f9fafb] dark:bg-[#111418] text-[#111418] dark:text-white py-2.5 px-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                        <option value="oct">October</option>
                        <option value="sep">September</option>
                        <option value="aug">August</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#637588] pointer-events-none text-lg">expand_more</span>
                    </div>
                  </div>
                  <div className="flex flex-col min-w-25">
                    <label className="text-[#111418] dark:text-white text-xs font-semibold uppercase tracking-wider mb-1.5 ml-1">Year</label>
                    <div className="relative">
                      <select className="w-full appearance-none rounded-lg border border-[#e5e7eb] dark:border-[#3b4754] bg-[#f9fafb] dark:bg-[#111418] text-[#111418] dark:text-white py-2.5 px-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#637588] pointer-events-none text-lg">expand_more</span>
                    </div>
                  </div>
                  <button className="bg-primary hover:bg-blue-600 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2 h-10.5 mt-auto shadow-md shadow-blue-900/20">
                    <span className="material-symbols-outlined text-[20px]">filter_list</span>
                    Apply Filter
                  </button>
                </div>
              </div>

              {/* Main Data Card */}
              <div className="flex flex-col bg-white dark:bg-[#1c2127] rounded-xl border border-[#e5e7eb] dark:border-[#3b4754] shadow-sm overflow-hidden flex-1">
                {/* Table Header */}
                <div className="px-6 py-4 border-b border-[#e5e7eb] dark:border-[#3b4754] flex justify-between items-center bg-[#f9fafb] dark:bg-[#20262e]">
                  <h3 className="text-[#111418] dark:text-white font-bold text-lg">October 2023 Attendance</h3>
                  <div className="flex gap-2">
                    <button className="text-[#637588] dark:text-[#9dabb9] hover:text-primary p-2 rounded hover:bg-[#e5e7eb] dark:hover:bg-[#2d3642] transition-colors" title="Download PDF">
                      <span className="material-symbols-outlined">picture_as_pdf</span>
                    </button>
                    <button className="text-[#637588] dark:text-[#9dabb9] hover:text-primary p-2 rounded hover:bg-[#e5e7eb] dark:hover:bg-[#2d3642] transition-colors" title="Export CSV">
                      <span className="material-symbols-outlined">csv</span>
                    </button>
                  </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto grow">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#f3f4f6] dark:bg-[#252b33] sticky top-0 z-10">
                      <tr>
                        <th className="py-3 px-6 text-xs font-semibold text-[#637588] dark:text-[#9dabb9] uppercase tracking-wider border-b border-[#e5e7eb] dark:border-[#3b4754]">Date</th>
                        <th className="py-3 px-6 text-xs font-semibold text-[#637588] dark:text-[#9dabb9] uppercase tracking-wider border-b border-[#e5e7eb] dark:border-[#3b4754]">Check In</th>
                        <th className="py-3 px-6 text-xs font-semibold text-[#637588] dark:text-[#9dabb9] uppercase tracking-wider border-b border-[#e5e7eb] dark:border-[#3b4754]">Check Out</th>
                        <th className="py-3 px-6 text-xs font-semibold text-[#637588] dark:text-[#9dabb9] uppercase tracking-wider border-b border-[#e5e7eb] dark:border-[#3b4754]">Breaks</th>
                        <th className="py-3 px-6 text-xs font-semibold text-[#637588] dark:text-[#9dabb9] uppercase tracking-wider border-b border-[#e5e7eb] dark:border-[#3b4754] text-right">Total Hours</th>
                        <th className="py-3 px-6 text-xs font-semibold text-[#637588] dark:text-[#9dabb9] uppercase tracking-wider border-b border-[#e5e7eb] dark:border-[#3b4754] text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d3642]">
                      {/* Row 1 */}
                      <tr className="hover:bg-[#f9fafb] dark:hover:bg-[#232930] transition-colors group">
                        <td className="py-4 px-6 text-sm font-medium text-[#111418] dark:text-white">
                          <div className="flex flex-col">
                            <span>Oct 01</span>
                            <span className="text-xs text-[#637588] dark:text-[#9dabb9] font-normal">Monday</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-[#111418] dark:text-[#cfd8e3] font-mono">08:58 AM</td>
                        <td className="py-4 px-6 text-sm text-[#111418] dark:text-[#cfd8e3] font-mono">05:05 PM</td>
                        <td className="py-4 px-6 text-sm text-[#637588] dark:text-[#9dabb9]">45 min</td>
                        <td className="py-4 px-6 text-sm font-bold text-[#111418] dark:text-white text-right font-mono">8h 07m</td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Valid
                          </span>
                        </td>
                      </tr>
                      {/* Row 2 */}
                      <tr className="hover:bg-[#f9fafb] dark:hover:bg-[#232930] transition-colors group">
                        <td className="py-4 px-6 text-sm font-medium text-[#111418] dark:text-white">
                          <div className="flex flex-col">
                            <span>Oct 02</span>
                            <span className="text-xs text-[#637588] dark:text-[#9dabb9] font-normal">Tuesday</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-[#111418] dark:text-[#cfd8e3] font-mono">09:15 AM</td>
                        <td className="py-4 px-6 text-sm text-[#111418] dark:text-[#cfd8e3] font-mono">06:15 PM</td>
                        <td className="py-4 px-6 text-sm text-[#637588] dark:text-[#9dabb9]">45 min</td>
                        <td className="py-4 px-6 text-sm font-bold text-[#111418] dark:text-white text-right font-mono">8h 15m</td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 dark:bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20">
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                            Late
                          </span>
                        </td>
                      </tr>
                      {/* Row 3 */}
                      <tr className="hover:bg-[#f9fafb] dark:hover:bg-[#232930] transition-colors group">
                        <td className="py-4 px-6 text-sm font-medium text-[#111418] dark:text-white">
                          <div className="flex flex-col">
                            <span>Oct 03</span>
                            <span className="text-xs text-[#637588] dark:text-[#9dabb9] font-normal">Wednesday</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-[#111418] dark:text-[#cfd8e3] font-mono">08:50 AM</td>
                        <td className="py-4 px-6 text-sm text-[#111418] dark:text-[#cfd8e3] font-mono">05:00 PM</td>
                        <td className="py-4 px-6 text-sm text-[#637588] dark:text-[#9dabb9]">45 min</td>
                        <td className="py-4 px-6 text-sm font-bold text-[#111418] dark:text-white text-right font-mono">8h 10m</td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Valid
                          </span>
                        </td>
                      </tr>
                      {/* Row 4 */}
                      <tr className="hover:bg-[#f9fafb] dark:hover:bg-[#232930] transition-colors group">
                        <td className="py-4 px-6 text-sm font-medium text-[#111418] dark:text-white">
                          <div className="flex flex-col">
                            <span>Oct 04</span>
                            <span className="text-xs text-[#637588] dark:text-[#9dabb9] font-normal">Thursday</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-[#111418] dark:text-[#cfd8e3] font-mono">09:00 AM</td>
                        <td className="py-4 px-6 text-sm text-[#111418] dark:text-[#cfd8e3] font-mono">05:30 PM</td>
                        <td className="py-4 px-6 text-sm text-[#637588] dark:text-[#9dabb9]">60 min</td>
                        <td className="py-4 px-6 text-sm font-bold text-[#111418] dark:text-white text-right font-mono">7h 30m</td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                            Short
                          </span>
                        </td>
                      </tr>
                      {/* Row 5 */}
                      <tr className="hover:bg-[#f9fafb] dark:hover:bg-[#232930] transition-colors group">
                        <td className="py-4 px-6 text-sm font-medium text-[#111418] dark:text-white">
                          <div className="flex flex-col">
                            <span>Oct 05</span>
                            <span className="text-xs text-[#637588] dark:text-[#9dabb9] font-normal">Friday</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-[#111418] dark:text-[#cfd8e3] font-mono">08:45 AM</td>
                        <td className="py-4 px-6 text-sm text-[#111418] dark:text-[#cfd8e3] font-mono">04:45 PM</td>
                        <td className="py-4 px-6 text-sm text-[#637588] dark:text-[#9dabb9]">45 min</td>
                        <td className="py-4 px-6 text-sm font-bold text-[#111418] dark:text-white text-right font-mono">8h 00m</td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Valid
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Summary Footer */}
                <div className="bg-[#f9fafb] dark:bg-[#1a1f25] border-t border-[#e5e7eb] dark:border-[#3b4754] px-6 py-6 md:py-8">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex flex-wrap justify-center md:justify-start gap-8 md:gap-12 w-full md:w-auto">
                      <div className="flex flex-col items-center md:items-start gap-1">
                        <p className="text-[#637588] dark:text-[#9dabb9] text-xs font-semibold uppercase tracking-wider">Total Realization</p>
                        <p className="text-[#111418] dark:text-white text-2xl font-black">165h <span className="text-lg font-medium text-[#637588] dark:text-[#9dabb9]">15m</span></p>
                      </div>
                      <div className="w-px h-12 bg-[#e5e7eb] dark:bg-[#3b4754] hidden md:block"></div>
                      <div className="flex flex-col items-center md:items-start gap-1">
                        <p className="text-[#637588] dark:text-[#9dabb9] text-xs font-semibold uppercase tracking-wider">Monthly Target</p>
                        <p className="text-[#111418] dark:text-white text-2xl font-black">160h <span className="text-lg font-medium text-[#637588] dark:text-[#9dabb9]">00m</span></p>
                      </div>
                      <div className="w-px h-12 bg-[#e5e7eb] dark:bg-[#3b4754] hidden md:block"></div>
                      <div className="flex flex-col items-center md:items-start gap-1">
                        <p className="text-[#637588] dark:text-[#9dabb9] text-xs font-semibold uppercase tracking-wider">Remaining</p>
                        <p className="text-emerald-600 dark:text-emerald-400 text-2xl font-black">+5h <span className="text-lg font-medium opacity-80">15m</span></p>
                      </div>
                    </div>
                    {/* Achievement Badge */}
                    <div className="flex items-center gap-3 bg-white dark:bg-[#283039] py-3 px-5 rounded-lg border border-[#e5e7eb] dark:border-[#3b4754] shadow-sm">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        <span className="material-symbols-outlined text-2xl">emoji_events</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[#111418] dark:text-white text-sm font-bold">Target Reached</span>
                        <span className="text-[#637588] dark:text-[#9dabb9] text-xs">103% Completion</span>
                      </div>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-6 w-full bg-[#e5e7eb] dark:bg-[#2d3642] rounded-full h-2.5 overflow-hidden">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MonthlyAttendanceReport;