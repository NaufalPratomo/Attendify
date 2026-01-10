"use client";

import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* 1. Overlay Gelap */}
      <div 
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose} 
      />

      {/* 2. Sidebar Panel */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-[#101922] border-r border-[#283039] transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header & Close Button */}
        <div className="flex items-start justify-between p-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Attendify</h2>
            <p className="text-xs text-gray-400 mt-1">Productivity Tool</p>
          </div>
          <button 
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-[#283039] transition-colors"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>

        {/* Menu Links */}
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <a href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-[#1c2632] rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[22px]">grid_view</span>
            <span className="font-medium">Dashboard</span>
          </a>
          <a href="/reports" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-[#1c2632] rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[22px]">description</span>
            <span className="font-medium">Reports</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-[#137fec] bg-[#1c2632] rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[22px]">settings</span>
            <span className="font-medium">Settings</span>
          </a>
        </nav>

        {/* Footer (User Profile) */}
        <div className="p-4 border-t border-[#283039]">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1c2632] cursor-pointer transition-colors">
            <div className="size-10 rounded-full bg-[#6366f1] flex items-center justify-center text-white font-bold text-sm">
              JD
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">Jane Doe</p>
              <p className="text-xs text-gray-400 truncate">jane@attendify.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;