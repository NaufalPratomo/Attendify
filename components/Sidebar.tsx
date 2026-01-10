"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Wajib ada untuk mendeteksi URL aktif

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name: string;
    email: string;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, user }) => {
  // 1. Ambil path URL saat ini (misal: "/dashboard" atau "/profile")
  const pathname = usePathname();

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

  // 2. Helper function untuk menentukan class active/inactive
  const getLinkClass = (path: string) => {
    // Cek apakah pathname saat ini sama dengan path menu
    const isActive = pathname === path || pathname?.startsWith(`${path}/`);

    const baseClass = "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group";

    // Style Active (Seperti Settings di gambar: Teks Biru + Background Gelap)
    const activeClass = "text-[#137fec] bg-[#1c2632] font-semibold";

    // Style Inactive (Abu-abu, hover jadi putih)
    const inactiveClass = "text-gray-400 hover:text-white hover:bg-[#1c2632] font-medium";

    return `${baseClass} ${isActive ? activeClass : inactiveClass}`;
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* 1. Overlay Gelap (Backdrop) */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Sidebar Panel */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-[#101922] border-r border-[#283039] transform transition-transform duration-300 ease-in-out flex flex-col lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
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
            className="flex size-10 items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-[#283039] transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>

        {/* Menu Links */}
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {/* Dashboard Link */}
          <Link href="/dashboard" className={getLinkClass('/dashboard')}>
            <span className={`material-symbols-outlined text-[22px] transition-colors ${pathname === '/dashboard' ? 'text-[#137fec]' : 'group-hover:text-white'}`}>
              grid_view
            </span>
            <span>Dashboard</span>
          </Link>

          {/* Reports Link */}
          <Link href="/reports" className={getLinkClass('/reports')}>
            <span className={`material-symbols-outlined text-[22px] transition-colors ${pathname === '/reports' ? 'text-[#137fec]' : 'group-hover:text-white'}`}>
              description
            </span>
            <span>Reports</span>
          </Link>

          {/* Settings Link */}
          {/* Perhatikan href disini saya samakan dengan pathname yang dicek */}
          <Link href="/settings" className={getLinkClass('/settings')}>
            <span className={`material-symbols-outlined text-[22px] transition-colors ${pathname === '/settings' ? 'text-[#137fec]' : 'group-hover:text-white'}`}>
              settings
            </span>
            <span>Settings</span>
          </Link>
        </nav>

        {/* Footer (User Profile & Drop Up Menu) */}
        <div className="p-4 border-t border-[#283039] relative" ref={menuRef}>

          {/* === POP UP MENU (Drop Up) === */}
          <div
            className={`absolute bottom-[calc(100%+8px)] left-4 right-4 bg-[#1c2632] border border-[#283039] rounded-xl shadow-xl overflow-hidden transition-all duration-200 origin-bottom ${isUserMenuOpen
              ? 'opacity-100 scale-100 translate-y-0 visible'
              : 'opacity-0 scale-95 translate-y-2 invisible pointer-events-none'
              }`}
          >
            <div className="flex flex-col py-1">
              {/* Menu: Profile */}
              <Link
                href="/profile"
                onClick={() => setIsUserMenuOpen(false)}
                // Profile juga bisa dikasih active state jika mau
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${pathname === '/profile' ? 'text-[#137fec] bg-[#283039]' : 'text-gray-300 hover:text-white hover:bg-[#283039]'}`}
              >
                <span className="material-symbols-outlined text-[20px]">person</span>
                Profile
              </Link>

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
            className={`w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 text-left ${isUserMenuOpen ? 'bg-[#1c2632]' : 'hover:bg-[#1c2632]'
              }`}
          >
            <div className="size-10 rounded-full bg-[#6366f1] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-indigo-500/20">
              {getInitials(user?.name)}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Loading...'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || 'Loading...'}</p>
            </div>

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