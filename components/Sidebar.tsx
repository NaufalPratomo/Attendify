"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link'; // Import Link untuk routing Next.js
import { usePathname } from 'next/navigation'; // Opsional: untuk active state styling

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  // State untuk dropdown menu user
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Ref untuk mendeteksi klik di luar komponen menu
  const menuRef = useRef<HTMLDivElement>(null);

  // Function untuk menutup menu saat klik di luar area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* 1. Overlay Gelap (Backdrop) */}
      <div 
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
        aria-hidden="true" 
      />

      {/* 2. Sidebar Panel */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-[#101922] border-r border-[#283039] transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header & Close Button */}
        <div className="flex items-start justify-between p-6 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Attendify</h2>
            <p className="text-xs text-gray-400 mt-1">Productivity Tool</p>
          </div>
          <button 
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-[#283039] transition-colors"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>

        {/* Menu Links */}
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {/* Note: Menggunakan Link Next.js untuk performa SPA */}
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-[#1c2632] rounded-lg transition-colors group">
            <span className="material-symbols-outlined text-[22px] group-hover:text-white transition-colors">grid_view</span>
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/reports" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-[#1c2632] rounded-lg transition-colors group">
            <span className="material-symbols-outlined text-[22px] group-hover:text-white transition-colors">description</span>
            <span className="font-medium">Reports</span>
          </Link>
          <Link href="/setting" className="flex items-center gap-3 px-4 py-3 text-[#137fec] bg-[#1c2632] rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[22px]">settings</span>
            <span className="font-medium">Settings</span>
          </Link>
        </nav>

        {/* Footer (User Profile & Drop Up Menu) */}
        {/* Kita tambahkan 'relative' di sini agar menu popup absolute posisinya relatif terhadap footer ini */}
        <div className="p-4 border-t border-[#283039] relative" ref={menuRef}>
          
          {/* === POP UP MENU (Drop Up) === */}
          {/* Kondisional rendering berdasarkan state */}
          <div 
            className={`absolute bottom-[calc(100%+8px)] left-4 right-4 bg-[#1c2632] border border-[#283039] rounded-xl shadow-xl overflow-hidden transition-all duration-200 origin-bottom ${
              isUserMenuOpen 
                ? 'opacity-100 scale-100 translate-y-0 visible' 
                : 'opacity-0 scale-95 translate-y-2 invisible pointer-events-none'
            }`}
          >
             <div className="flex flex-col py-1">
                {/* Menu: Profile */}
                <Link 
                  href="/profile" 
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-[#283039] transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">person</span>
                  Profile
                </Link>
                
                {/* Divider Tipis */}
                <div className="h-[1px] bg-[#283039] mx-2 my-1"></div>

                {/* Menu: Logout */}
                <Link 
                  href="/" 
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-[#283039] transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  Logout
                </Link>
             </div>
          </div>

          {/* === TRIGGER BUTTON (User Card) === */}
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 text-left ${
              isUserMenuOpen ? 'bg-[#1c2632]' : 'hover:bg-[#1c2632]'
            }`}
          >
            <div className="size-10 rounded-full bg-[#6366f1] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-indigo-500/20">
              JD
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold text-white truncate">Jane Doe</p>
              <p className="text-xs text-gray-400 truncate">jane@attendify.com</p>
            </div>
            
            {/* Indikator Panah Kecil (Opsional tapi bagus untuk UX) */}
            <span className={`material-symbols-outlined text-gray-500 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`}>
              expand_less
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;