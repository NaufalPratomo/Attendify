'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowBigLeft } from 'lucide-react';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    // "dark" className ditambahkan di sini untuk memaksa tampilan Dark Mode
    <div className="dark">
      <div className="font-sans antialiased text-[#111418] dark:text-white bg-[#f6f7f8] dark:bg-[#101922] transition-colors duration-300">
        <div className="relative flex min-h-screen w-full flex-col justify-center items-center overflow-x-hidden p-4">
          
          {/* Main Card Container */}
          <div className="w-full max-w-[480px] bg-white dark:bg-[#1C252E] rounded-xl shadow-lg border border-[#e5e7eb] dark:border-[#2e3740] p-8 md:p-12 transition-colors duration-300">
            <div className="size-full">
              <Link href="/">
                <button className="flex items-center text-[#617589] dark:text-[#9AAAB8] text-sm font-medium hover:underline mb-4">
                  <ArrowBigLeft /><span>Back</span>
                </button>
              </Link>
            </div>
            {/* Branding / Header */}
            <div className="flex flex-col gap-2 mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-[#111418] dark:text-white">Login</h1>
              <p className="text-[#617589] dark:text-[#9AAAB8] text-sm">Welcome back! Please sign in to your account.</p>
            </div>

            {/* Login Form */}
            <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
              
              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <label className="text-[#111418] dark:text-white text-sm font-medium leading-normal" htmlFor="email">
                  Email address
                </label>
                <input
                  className="form-input w-full resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-[#3e4a56] bg-white dark:bg-[#1C252E] focus:border-[#137fec] h-12 placeholder:text-[#617589] dark:placeholder:text-[#637588] px-4 text-base font-normal leading-normal transition-colors"
                  id="email"
                  placeholder="name@company.com"
                  type="email"
                />
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-[#111418] dark:text-white text-sm font-medium leading-normal" htmlFor="password">
                    Password
                  </label>
                  <a className="text-[#137fec] text-sm font-medium hover:underline" href="#">
                    Forgot password?
                  </a>
                </div>
                <div className="relative flex w-full items-center rounded-lg">
                  <input
                    className="form-input w-full resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#137fec]/50 border border-[#dbe0e6] dark:border-[#3e4a56] bg-white dark:bg-[#1C252E] focus:border-[#137fec] h-12 placeholder:text-[#617589] dark:placeholder:text-[#637588] px-4 pr-12 text-base font-normal leading-normal transition-colors"
                    id="password"
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                  />
                  <div 
                    className="absolute right-0 flex h-full items-center justify-center pr-4 text-[#617589] cursor-pointer hover:text-[#137fec] transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Login Button */}
              <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-[#137fec] text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-[#1170d2] transition-colors shadow-sm mt-2">
                <span className="truncate">Sign in</span>
              </button>

              {/* Sign Up Footer */}
              <div className="mt-4 text-center">
                    <p className="text-[#617589] dark:text-[#9AAAB8] text-sm">
                      Don't have an account?{' '}
                      <a className="text-[#137fec] font-medium hover:underline" href="/auth/register">
                        Sign up
                      </a>
                    </p>
              </div>
            </form>
          </div>

          {/* Footer / Copyright */}
          <div className="mt-8 text-center text-xs text-[#617589] dark:text-[#9AAAB8]">
            <p>© 2024 Attendify Inc. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;