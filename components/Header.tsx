"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  onMenuClick: () => void;
  userName?: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, userName }) => {
  return (
    <header className="sticky top-0 z-10 flex w-full items-center justify-between border-b border-[#283039] bg-[#101922]/80 px-6 py-4 backdrop-blur-md lg:px-12">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <div className="flex items-center gap-1">
            <Image src="/main_logo.png" alt="Attendify Logo" width={300} height={150} className="h-12 w-auto object-contain" />
          </div>
        </Link>
      </div>

      {/* Tombol Burger (kanan, mobile only) */}
      <button
        onClick={onMenuClick}
        className="flex size-12 items-center justify-center rounded-lg text-gray-400 hover:bg-[#1c2632] hover:text-white transition-colors lg:hidden"
      >
        <span className="material-symbols-outlined text-3xl">menu</span>
      </button>
    </header>
  );
};

export default Header;