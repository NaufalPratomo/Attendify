'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import TextType from '@/components/TextType';
import { Info, Sparkles, Heart, ChevronRight } from 'lucide-react';

const AttendifyLanding: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="dark">
      <div className="bg-background-light dark:bg-background-dark text-[#111218] dark:text-white transition-colors duration-300 font-sans min-h-screen w-full">
        <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">

          {/* Top Navigation */}
          <header className="sticky top-0 z-50 flex items-center justify-center border-b border-black/20 bg-[#101322]/95 backdrop-blur-md px-4 md:px-10 py-3 md:py-4 transition-colors duration-300 after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-10 after:h-10 after:bg-linear-to-b after:from-[#111218] after:to-transparent after:pointer-events-none">
            <div className="flex w-full items-center justify-between">
              <Image src="/main_logo.png" alt="Attendify Logo" width={200} height={100} className="h-8 md:h-12 w-auto object-contain" />
              {/* Desktop buttons */}
              <div className="hidden md:flex items-center gap-1">
                <Link href="/development">
                  <button className="relative flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-300 group">
                    <Info className="size-4 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                    About
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-blue-500 group-hover:w-3/4 transition-all duration-300 rounded-full" />
                  </button>
                </Link>
                <Link href="/development">
                  <button className="relative flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-300 group">
                    <Sparkles className="size-4 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                    Features
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-blue-500 group-hover:w-3/4 transition-all duration-300 rounded-full" />
                  </button>
                </Link>
                <Link href="/development">
                  <button className="relative flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-300 group">
                    <Heart className="size-4 text-blue-400 group-hover:text-blue-300 group-hover:animate-pulse transition-colors duration-300" />
                    Support Us
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-blue-500 group-hover:w-3/4 transition-all duration-300 rounded-full" />
                  </button>
                </Link>
                <Link href="/auth/login">
                  <button className="flex cursor-pointer items-center justify-center rounded-lg h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 transition-all duration-200">
                    Login
                  </button>
                </Link>
                <Link href="/auth/register">
                  <button className="flex cursor-pointer items-center justify-center rounded-lg h-10 px-6 border border-blue-500/50 text-blue-400 hover:bg-blue-600/10 text-sm font-bold hover:-translate-y-0.5 transition-all duration-200">
                    Sign Up
                  </button>
                </Link>
              </div>
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex md:hidden size-10 items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Open menu"
              >
                <span className="material-symbols-outlined text-2xl">menu</span>
              </button>
            </div>
          </header>

          {/* Mobile Sidebar Overlay */}
          <div
            className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile Sidebar Panel */}
          <aside
            className={`fixed top-0 right-0 z-[70] h-full w-72 bg-[#101322] border-l border-[#283039] transform transition-transform duration-300 ease-in-out flex flex-col md:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="flex items-center justify-between p-6">
              <Image src="/main_logo.png" alt="Attendify Logo" width={200} height={100} className="h-8 md:h-12 w-auto object-contain justify-left" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex size-10 items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-[#283039] transition-colors"
                aria-label="Close menu">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            <div className="flex flex-col justify-center gap-2 px-4 mb-6">
              <Link href="/development" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full flex cursor-pointer items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 active:bg-white/15 active:scale-[0.98] border border-transparent hover:border-blue-500/30 transition-all duration-300 group">
                  <span className="flex items-center justify-center size-8 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                    <Info className="size-4" />
                  </span>
                  About
                  <ChevronRight className="size-4 ml-auto text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all duration-300" />
                </button>
              </Link>
              <Link href="/development" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full flex cursor-pointer items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 active:bg-white/15 active:scale-[0.98] border border-transparent hover:border-blue-500/30 transition-all duration-300 group">
                  <span className="flex items-center justify-center size-8 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                    <Sparkles className="size-4" />
                  </span>
                  Features
                  <ChevronRight className="size-4 ml-auto text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all duration-300" />
                </button>
              </Link>
              <Link href="/development" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full flex cursor-pointer items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 active:bg-white/15 active:scale-[0.98] border border-transparent hover:border-blue-500/30 transition-all duration-300 group">
                  <span className="flex items-center justify-center size-8 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                    <Heart className="size-4" />
                  </span>
                  Support Us
                  <ChevronRight className="size-4 ml-auto text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all duration-300" />
                </button>
              </Link>
            </div>
            <div className="flex flex-col gap-3 px-6 mt-auto mb-6">
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full flex cursor-pointer items-center justify-center rounded-lg h-12 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all duration-200">
                  Login
                </button>
              </Link>
              <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full flex cursor-pointer items-center justify-center rounded-lg h-12 border border-blue-500/50 text-blue-400 hover:bg-blue-600/10 text-sm font-bold transition-all duration-200">
                  Sign Up
                </button>
              </Link>
            </div>
          </aside>
          <div className="h-24 bg-linear-to-b from-[#101322] to-black" />
          {/* Hero Section */}
          <div className="layout-container flex grow flex-col bg-black">
            <div className="px-4 md:px-10 lg:px-40 flex flex-1 justify-center py-5">
              <div className="layout-content-container flex flex-col max-w-300 flex-1">
                <div className="@container">
                  <div className="flex flex-col gap-10 px-4 py-10 md:py-20 @[864px]:flex-row @[864px]:items-center">
                    <div className="flex flex-col gap-8 @[480px]:min-w-100 flex-1">
                      <div className="flex flex-col text-6xl gap-4 text-left">
                        <TextType
                          text={["Manage Your Time", "for your working time", "Happy working!"]}
                          typingSpeed={75}
                          pauseDuration={1500}
                          showCursor={true}
                          cursorCharacter="|"
                        />
                      </div>
                      <p className="text-[#616789] dark:text-gray-400 text-lg font-normal leading-relaxed max-w-lg">
                        The minimalist time tracker designed for professionals who value focus. Track hours, set goals, and gain insights without the clutter.
                      </p>
                      <div className="flex flex-wrap gap-4">
                        <Link href="/auth/login">
                          <button className="flex min-w-21 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white text-base font-bold leading-normal tracking-[0.015em] shadow-lg shadow-blue-600/30 transform hover:-translate-y-1 transition-all duration-200">
                            <span className="truncate">Get Started</span>
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Spacer Div */}
          <div className="h-24 bg-linear-to-b from-black to-[#101322]" />

          {/* Features Section */}
          <div className="layout-container flex grow flex-col bg-[#101322] py-20 transition-colors duration-300" id="features">
            <div className="px-4 md:px-40 flex flex-1 justify-center">
              <div className="layout-content-container flex flex-col max-w-300 flex-1">
                <div className="flex flex-col gap-12 @container">
                  <div className="flex flex-col items-center text-center gap-6">
                    <h2 className="text-blue-600 text-sm font-bold uppercase tracking-widest">Features</h2>
                    <h1 className="text-[#111218] dark:text-white tracking-tight text-3xl font-bold leading-tight md:text-5xl max-w-180">
                      Everything you need to stay productive, nothing you don't.
                    </h1>
                    <p className="text-[#616789] dark:text-gray-400 text-lg font-normal leading-normal max-w-150">
                      We stripped away the complexity to give you a tool that actually helps you focus, rather than distracting you.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                    {/* Feature 1 */}
                    <div className="flex flex-1 gap-6 rounded-2xl border border-[#dbdde6] dark:border-gray-800 bg-background-light dark:bg-gray-900 p-8 flex-col hover:border-blue-600/50 transition-colors duration-300 group">
                      <div className="size-12 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <span className="material-symbols-outlined text-[28px]">schedule</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <h3 className="text-[#111218] dark:text-white text-xl font-bold leading-tight">Easy Check-in</h3>
                        <p className="text-[#616789] dark:text-gray-400 text-base font-normal leading-relaxed">
                          Start and stop timers with a single click. No complex forms or nested menus. Just focus and go.
                        </p>
                      </div>
                    </div>
                    {/* Feature 2 */}
                    <div className="flex flex-1 gap-6 rounded-2xl border border-[#dbdde6] dark:border-gray-800 bg-background-light dark:bg-gray-900 p-8 flex-col hover:border-blue-600/50 transition-colors duration-300 group">
                      <div className="size-12 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <span className="material-symbols-outlined text-[28px]">ads_click</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <h3 className="text-[#111218] dark:text-white text-xl font-bold leading-tight">Smart Targets</h3>
                        <p className="text-[#616789] dark:text-gray-400 text-base font-normal leading-relaxed">
                          Set weekly goals and visualize your progress with intuitive progress bars that keep you motivated.
                        </p>
                      </div>
                    </div>
                    {/* Feature 3 */}
                    <div className="flex flex-1 gap-6 rounded-2xl border border-[#dbdde6] dark:border-gray-800 bg-background-light dark:bg-gray-900 p-8 flex-col hover:border-blue-600/50 transition-colors duration-300 group">
                      <div className="size-12 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <span className="material-symbols-outlined text-[28px]">bar_chart</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <h3 className="text-[#111218] dark:text-white text-xl font-bold leading-tight">Detailed Reports</h3>
                        <p className="text-[#616789] dark:text-gray-400 text-base font-normal leading-relaxed">
                          Export data seamlessly for billing or analysis. Generate PDF reports or CSV dumps in seconds.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-[#f0f1f4] dark:border-gray-800 bg-white dark:bg-[#101322] py-12 px-4 md:px-40 transition-colors duration-300">
            <div className="max-w-300 mx-auto flex flex-col md:flex-row justify-end items-center gap-6">
              <div className="text-sm text-[#616789] dark:text-gray-500">
                © 2026 Developer Josjis.
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default AttendifyLanding;