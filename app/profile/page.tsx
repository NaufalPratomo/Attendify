"use client";

import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Save,
  X,
  Pencil,
  Briefcase,
  Copy,
  Check,
} from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  role: string;
  joinDate: string;
}

const ProfilePage = () => {
  // --- STATE MANAGEMENT ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=User",
    role: "Member",
    joinDate: "Member since 2024",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch User Data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (res.ok) {
          const data = await res.json();
          setProfile(prev => ({
            ...prev,
            name: data.userName,
            email: data.userEmail,
            avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${data.userName}`
          }));
        }
      } catch (e) {
        console.error("Failed to fetch user", e);
      }
    };
    fetchUser();
  }, []);

  // --- HANDLERS ---

  const openEditModal = () => {
    setTempProfile(profile);
    setPreviewImage(null);
    setIsEditing(true);
  };

  const closeModal = () => {
    setIsEditing(false);
    setPreviewImage(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProfile = {
      ...tempProfile,
      avatar: previewImage || tempProfile.avatar,
    };
    setProfile(finalProfile);
    setIsEditing(false);
    // Note: To persist changes, we would need an API endpoint for updating profile.
    // For now, this is client-side only state update.
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTempProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(profile.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    // Container Utama: h-screen & overflow-hidden untuk mencegah scrollbar window
    <div className="flex h-screen w-full bg-[#0f1218] text-white font-sans overflow-hidden selection:bg-[#137fec]/30">

      {/* Sidebar Component */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={{ name: profile.name, email: profile.email }}
      />

      {/* Main Layout Column */}
      <div className="relative flex flex-1 flex-col h-full overflow-hidden transition-all duration-300 lg:ml-72">

        {/* Header Component */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} userName={profile.name} />

        {/* === MAIN CONTENT AREA === */}
        <main className="relative flex-1 flex items-center justify-center p-4">

          {/* 1. ANIMATED BACKGROUND BLOBS (Efek Aurora) */}
          <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse delay-1000" />

          {/* 2. GLASS CARD CONTAINER */}
          <div className="relative w-full max-w-[420px] z-10 animate-in fade-in zoom-in-95 duration-500">
            {/* Glass Card */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#1a202c]/60 backdrop-blur-xl shadow-2xl p-8">
              {/* Dekorasi Garis Atas */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#137fec] to-transparent opacity-50" />

              {/* Profile Picture Section */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  {/* Glow Effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                  <div className="relative size-32 rounded-full border-4 border-[#1a202c] overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105">
                    <img
                      src={profile.avatar}
                      alt="Profile"
                      className="size-full object-cover bg-gray-800"
                    />
                  </div>
                </div>

                {/* Name & Role */}
                <div className="mt-5 text-center space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    {profile.name || 'Loading...'}
                  </h1>
                </div>

                {/* Interactive Email Card */}
                <button
                  onClick={handleCopyEmail}
                  className="group w-full mt-8 flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                        Email Address
                      </p>
                      <p className="text-sm text-gray-200 truncate font-medium">
                        {profile.email || 'Loading...'}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Edit Button */}
                <button
                  onClick={openEditModal}
                  className="w-full mt-4 h-12 rounded-xl bg-gradient-to-r from-[#137fec] to-[#3b82f6] hover:from-[#1170d2] hover:to-[#2563eb] text-white font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* === MODAL POP UP (EDIT MODE) === */}
        {isEditing && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200"
            onClick={closeModal}
          >
            <div
              className="w-full max-w-[420px] bg-[#1a202c] rounded-2xl shadow-2xl border border-white/10 p-6 animate-in zoom-in-95 slide-in-from-bottom-5 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <h2 className="text-lg font-bold text-white">Edit Profile</h2>
                <button
                  onClick={closeModal}
                  className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex flex-col gap-5">
                {/* Image Upload */}
                <div className="flex justify-center">
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="size-24 rounded-full border-2 border-dashed border-gray-500 p-1 group-hover:border-blue-500 transition-colors">
                      <img
                        src={previewImage || tempProfile.avatar}
                        alt="Preview"
                        className="size-full rounded-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white w-6 h-6" />
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
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-400 ml-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        name="name"
                        value={tempProfile.name}
                        onChange={handleChange}
                        className="w-full rounded-lg bg-[#0f1218] border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white px-4 py-2.5 pl-10 outline-none transition-all placeholder:text-gray-600"
                        placeholder="Full Name"
                      />
                      <User className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-400 ml-1">
                      Role
                    </label>
                    <div className="relative">
                      <input
                        name="role"
                        value={tempProfile.role}
                        onChange={handleChange}
                        className="w-full rounded-lg bg-[#0f1218] border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white px-4 py-2.5 pl-10 outline-none transition-all placeholder:text-gray-600"
                        placeholder="Role"
                      />
                      <Briefcase className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-400 ml-1">
                      Email
                    </label>
                    <div className="relative">
                      <input
                        name="email"
                        value={tempProfile.email}
                        onChange={handleChange}
                        className="w-full rounded-lg bg-[#0f1218] border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white px-4 py-2.5 pl-10 outline-none transition-all placeholder:text-gray-600"
                        placeholder="Email"
                      />
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm font-bold shadow-lg shadow-blue-900/20"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;