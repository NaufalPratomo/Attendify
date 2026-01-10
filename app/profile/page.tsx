"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

import Link from "next/link";
import {
  ArrowBigLeft,
  Camera,
  User,
  Mail,
  Save,
  X,
  Pencil,
  Briefcase,
} from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  role: string;
}

const ProfilePage = () => {
  // --- STATE MANAGEMENT ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    name: "Jane Doe",
    email: "jane@attendify.com",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jane",
    role: "Product Designer",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HANDLERS ---

  // Buka Modal Edit
  const openEditModal = () => {
    setTempProfile(profile); // Copy data asli ke temp
    setPreviewImage(null);
    setIsEditing(true);
  };

  // Tutup Modal
  const closeModal = () => {
    setIsEditing(false);
    setPreviewImage(null);
  };

  // Simpan Data
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProfile = {
      ...tempProfile,
      avatar: previewImage || tempProfile.avatar,
    };
    setProfile(finalProfile);
    setIsEditing(false);
  };

  // Handle Input Text
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTempProfile((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Image Upload
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
    }
  };

  return (
    <div className="bg-[#101922] font-sans text-white antialiased selection:bg-[#137fec]/30 min-h-screen">
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="dark">
          <div className="font-sans antialiased text-[#111418] dark:text-white bg-[#f6f7f8] dark:bg-[#101922] transition-colors duration-300 min-h-screen">
            {/* === HALAMAN UTAMA (READ ONLY) === */}
            <div className="relative flex min-h-screen w-full flex-col justify-center items-center overflow-x-hidden p-4">
              <div className="w-full max-w-120 bg-white dark:bg-[#1C252E] rounded-xl shadow-lg border border-[#e5e7eb] dark:border-[#2e3740] p-8 relative transition-colors duration-300">
                {/* Back Button */}
                <div className="mb-6">
                  <Link href="/dashboard">
                    <button className="flex items-center text-[#617589] dark:text-[#9AAAB8] text-sm font-medium hover:underline hover:text-[#137fec] transition-colors">
                      <ArrowBigLeft className="w-5 h-5 mr-1" />
                      <span>Back to Dashboard</span>
                    </button>
                  </Link>
                </div>

                {/* Profile Info Display */}
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="relative size-32 rounded-full border-4 border-[#f6f7f8] dark:border-[#2e3740] shadow-sm overflow-hidden">
                    <img
                      src={profile.avatar}
                      alt="Profile"
                      className="size-full object-cover bg-gray-200 dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold text-[#111418] dark:text-white">
                      {profile.name}
                    </h1>
                  </div>

                  <div className="w-full bg-[#f6f7f8] dark:bg-[#101922] p-4 rounded-lg border border-[#e5e7eb] dark:border-[#2e3740] flex items-center gap-3 mt-2">
                    <Mail className="text-[#137fec] w-5 h-5" />
                    <span className="text-sm font-medium text-[#111418] dark:text-white truncate">
                      {profile.email}
                    </span>
                  </div>

                  <button
                    onClick={openEditModal}
                    className="w-full mt-4 h-12 rounded-lg bg-[#137fec] hover:bg-[#1170d2] text-white font-bold shadow-md shadow-[#137fec]/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-4 h-4" /> Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* === MODAL POP UP (EDIT MODE) === */}
            {isEditing && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                onClick={closeModal}
              >
                {/* 2. Card Modal */}
                <div
                  className="w-full max-w-120 bg-white dark:bg-[#1C252E] rounded-xl shadow-2xl border border-[#e5e7eb] dark:border-[#2e3740] p-6 md:p-8 animate-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam card menutup modal
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#111418] dark:text-white">
                      Edit Profile
                    </h2>
                    <button
                      onClick={closeModal}
                      className="text-[#617589] dark:text-[#9AAAB8] hover:text-[#111418] dark:hover:text-white transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleSave} className="flex flex-col gap-6">
                    {/* Image Upload */}
                    <div className="flex justify-center">
                      <div
                        className="relative group cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="size-24 rounded-full border-2 border-[#137fec] p-1 overflow-hidden">
                          <img
                            src={previewImage || tempProfile.avatar}
                            alt="Preview"
                            className="size-full rounded-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="text-white w-6 h-6" />
                        </div>
                        {/* Badge Plus Icon */}
                        <div className="absolute bottom-0 right-0 bg-[#137fec] p-1.5 rounded-full border-2 border-white dark:border-[#1C252E]">
                          <Pencil className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#111418] dark:text-white flex items-center gap-2">
                          <User className="w-4 h-4 text-[#137fec]" /> Full Name
                        </label>
                        <input
                          name="name"
                          value={tempProfile.name}
                          onChange={handleChange}
                          className="form-input w-full rounded-lg h-11 px-4 bg-white dark:bg-[#101922] border border-[#dbe0e6] dark:border-[#3e4a56] focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 text-[#111418] dark:text-white outline-none transition-all"
                          placeholder="Full Name"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#111418] dark:text-white flex items-center gap-2">
                          <Mail className="w-4 h-4 text-[#137fec]" /> Email
                          Address
                        </label>
                        <input
                          name="email"
                          value={tempProfile.email}
                          onChange={handleChange}
                          className="form-input w-full rounded-lg h-11 px-4 bg-white dark:bg-[#101922] border border-[#dbe0e6] dark:border-[#3e4a56] focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 text-[#111418] dark:text-white outline-none transition-all"
                          placeholder="name@example.com"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-2">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 h-11 rounded-lg border border-[#dbe0e6] dark:border-[#3e4a56] text-[#617589] dark:text-[#9AAAB8] font-semibold hover:bg-gray-50 dark:hover:bg-[#2e3740] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 h-11 rounded-lg bg-[#137fec] hover:bg-[#1170d2] text-white font-semibold shadow-md shadow-[#137fec]/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" /> Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
