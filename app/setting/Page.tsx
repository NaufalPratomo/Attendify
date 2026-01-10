"use client";
import React, { useState } from 'react';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

const TargetConfiguration: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="bg-[#101922] font-sans text-white antialiased selection:bg-[#137fec]/30 min-h-screen">
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

    <div className="bg-[#101922] text-white font-sans overflow-hidden h-screen w-full flex flex-row">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-y-auto bg-[#101922]">
        {/* Content Container */}
        <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
          
          {/* Centered Configuration Card */}
          <div className="w-full max-w-145 flex flex-col bg-[#111418] rounded-xl border border-[#283039] shadow-2xl overflow-hidden">
            
            {/* Card Header / Hero */}
            <div 
              className="relative h-48 w-full bg-cover bg-center" 
              style={{ backgroundImage: "linear-gradient(135deg, rgba(19, 127, 236, 0.4) 0%, rgba(16, 25, 34, 1) 100%)" }}
            >
              <div className="absolute inset-0 bg-linear-to-t from-[#111418] to-transparent"></div>
              <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
                <h2 className="text-white tracking-tight text-3xl font-bold leading-tight">Configure Targets</h2>
                <p className="text-[#9dabb9] text-base font-medium leading-normal mt-1">Define your productivity goals for the upcoming period.</p>
              </div>
              {/* Decorative abstract shape */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#137fec]/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
            </div>

            {/* Form Content */}
            <div className="p-6 pt-2 flex flex-col gap-6">
              
              {/* Input Fields */}
              <div className="flex flex-col gap-5">
                <label className="flex flex-col flex-1">
                  <p className="text-white text-base font-medium leading-normal pb-2">Monthly Target (minutes)</p>
                  <div className="relative">
                    <input 
                      className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#3b4754] bg-[#1c2127] focus:border-[#137fec] h-14 placeholder:text-[#9dabb9] p-3.75 pl-12 text-base font-normal leading-normal transition-all" 
                      placeholder="e.g. 9600" 
                      type="number" 
                      defaultValue="9600" // Menggunakan defaultValue untuk uncontrolled component
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9dabb9]">
                      <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                    </div>
                  </div>
                </label>
                
                <label className="flex flex-col flex-1">
                  <p className="text-white text-base font-medium leading-normal pb-2">Yearly Target (minutes)</p>
                  <div className="relative">
                    <input 
                      className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec]/50 border border-[#3b4754] bg-[#1c2127] focus:border-[#137fec] h-14 placeholder:text-[#9dabb9] p-3.75 pl-12 text-base font-normal leading-normal transition-all" 
                      placeholder="e.g. 115200" 
                      type="number" 
                      defaultValue="115200" 
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9dabb9]">
                      <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                    </div>
                  </div>
                </label>
              </div>

              {/* Helper Text */}
              <div className="bg-[#1c2127] rounded-lg p-4 border border-[#283039] flex gap-3 items-start">
                <span className="material-symbols-outlined text-[#137fec] text-[20px] mt-0.5">info</span>
                <p className="text-[#9dabb9] text-sm font-normal leading-relaxed">
                  Targets represent the 100% mark on your dashboard progress circulars. We recommend basing this on your contract hours or personal goals.
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-[#137fec] hover:bg-blue-600 text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors shadow-lg shadow-blue-900/20">
                  <span className="truncate">Save Target Configuration</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
      </div>
  );
};

export default TargetConfiguration;