import React, { useState } from 'react';
import { Bell, ChevronDown, Settings, LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function Header({ onNotificationClick }) {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, message: "BATCHER is non-compliant", time: "2 hours ago", type: "warning" },
    { id: 2, message: "New vehicle PLX 3156 added", time: "5 hours ago", type: "info" },
    { id: 3, message: "Monthly report ready", time: "1 day ago", type: "success" }
  ];

  return (
    <header className="sticky top-0 z-50 w-full h-[72px]" style={{ 
      background: 'linear-gradient(135deg, #1a2332 0%, #2d3748 100%)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Section - Enhanced Branding */}
        <div className="flex items-center min-w-[280px]">
          <div 
            className="bg-white/10 rounded-2xl px-5 py-3 transition-all duration-300 hover:shadow-[0_0_24px_rgba(124,179,66,0.4)] hover:scale-[1.02] animate-[slideIn_0.6s_ease-out]"
            style={{
              background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(51,65,85,0.8))',
              border: '1px solid rgba(124,179,66,0.3)'
            }}
          >
            {/* ELORA Logo */}
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693b6e9a55c91aa6cc445b23/5bcc0fc55_ChatGPTImageDec12202504_50_02PM.png"
              alt="ELORA Logo"
              className="h-[56px] w-auto mb-2"
            />
            
            {/* Divider Line */}
            <div className="h-[1px] w-full bg-white/20 my-2" />
            
            {/* Powered by CQVS */}
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-[13px] font-medium text-slate-300" style={{ letterSpacing: '0.5px' }}>
                powered by
              </span>
              <span className="text-[14px] font-bold text-[#7CB342]" style={{ letterSpacing: '0.8px' }}>
                CQVS
              </span>
            </div>
          </div>
        </div>
        
        <style>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>

        {/* Center Section - Title */}
        <div className="hidden lg:flex flex-col items-center absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-white text-[26px] font-bold tracking-[-0.5px]">
            ELORA Fleet Compliance Portal
          </h1>
          <div className="h-0.5 w-[60px] mt-1" style={{ background: '#7CB342' }} />
        </div>

        {/* Mobile/Tablet Center - Short Title */}
        <div className="lg:hidden absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-white text-lg font-bold">Fleet Portal</h1>
        </div>

        {/* Right Section - User Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 text-white/50 hover:text-white hover:scale-110 transition-all duration-300">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-[#EF4444] rounded-full text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 rounded-xl shadow-xl">
              <div className="px-4 py-3 border-b bg-slate-50">
                <h3 className="font-semibold text-sm">Notifications</h3>
              </div>
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className="px-4 py-3 hover:bg-[#F1F5F9] cursor-pointer border-b last:border-0 transition-colors"
                >
                  <p className="text-sm font-medium text-slate-800">{notif.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 transition-all duration-300">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ background: 'linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)' }}
                >
                  JH
                </div>
                <span className="text-white font-medium text-sm hidden lg:block">Jenny Harper</span>
                <ChevronDown className="w-4 h-4 text-white/70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
              <DropdownMenuItem className="cursor-pointer py-3 px-4 hover:bg-[#F1F5F9] transition-colors">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-3 px-4 hover:bg-[#F1F5F9] transition-colors">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer py-3 px-4 text-red-600 hover:bg-red-50 transition-colors">
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
        style={{ background: 'linear-gradient(90deg, #7CB342 0%, #9CCC65 50%, #7CB342 100%)' }}
      />
    </header>
  );
}