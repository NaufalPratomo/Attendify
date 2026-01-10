"use client";

import React from 'react';
import Link from 'next/link';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-10 flex w-full items-center justify-between border-b border-[#283039] bg-[#101922]/80 px-6 py-4 backdrop-blur-md lg:px-12">
      <div className="flex items-center gap-4">
        {/* Tombol Burger */}
        <button 
          onClick={onMenuClick}
          className="flex size-12 items-center justify-center rounded-lg text-gray-400 hover:bg-[#1c2632] hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-3xl">menu</span>
        </button>
        <Link href="/dashboard">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight text-white">Attendify</h2>
        </div>
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 pl-6 border-l border-[#283039]">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold leading-none">Alex Morgan</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;