import React, { useState } from 'react';
import { Bell, ChevronDown, Settings, LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function Header({ onNotificationClick }) {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
  { id: 1, message: "BATCHER is non-compliant", time: "2 hours ago", type: "warning" },
  { id: 2, message: "New vehicle PLX 3156 added", time: "5 hours ago", type: "info" },
  { id: 3, message: "Monthly report ready", time: "1 day ago", type: "success" }];


  return (
    <header className="sticky top-0 z-50 w-full h-20" style={{ background: 'linear-gradient(90deg, #0F172A 0%, #1E293B 50%, #334155 100%)' }}>
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-xl px-5 py-3 flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-[#7CB342] to-[#9CCC65] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
                <path d="M12 2 L22 12 L12 22 L2 12 Z" />
              </svg>
            </div>
            <span className="text-[#0F172A] font-bold text-xl tracking-tight">ELORA</span>
          </div>
        </div>

        {/* Center Section */}
        <h1 className="text-white text-2xl md:text-[28px] font-bold tracking-tight absolute left-1/2 transform -translate-x-1/2">Elora

        </h1>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 text-white/80 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                  3
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="px-4 py-3 border-b bg-slate-50">
                <h3 className="font-semibold text-sm">Notifications</h3>
              </div>
              {notifications.map((notif) =>
              <div key={notif.id} className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-0">
                  <p className="text-sm font-medium text-slate-800">{notif.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ background: 'linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)' }}>

                  JH
                </div>
                <span className="text-white font-medium hidden md:block">Jenny Harper</span>
                <ChevronDown className="w-4 h-4 text-white/70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Accent Line */}
      <div
        className="h-0.5 w-full"
        style={{ background: 'linear-gradient(90deg, #7CB342 0%, #9CCC65 50%, #7CB342 100%)' }} />

    </header>);

}