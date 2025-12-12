import React from 'react';
import { ChevronDown, Settings, LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { base44 } from "@/api/base44Client";
import { useQuery } from '@tanstack/react-query';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Header() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const handleLogout = () => {
    base44.auth.logout();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full h-20" style={{ background: 'linear-gradient(90deg, #0F172A 0%, #1E293B 50%, #334155 100%)' }}>
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg px-4 py-2 flex items-center justify-center" style={{ width: '80px', height: '48px' }}>
            <svg viewBox="0 0 40 40" className="w-8 h-8">
              <circle cx="20" cy="20" r="18" fill="url(#logoGradient)" />
              <path d="M12 20 L20 12 L28 20 L20 28 Z" fill="white" opacity="0.9" />
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7CB342" />
                  <stop offset="100%" stopColor="#9CCC65" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-white font-bold text-base tracking-wide">ELORA</span>
        </div>

        {/* Center Section */}
        <h1 className="text-white text-2xl md:text-[28px] font-bold tracking-tight absolute left-1/2 transform -translate-x-1/2">
          Compliance Portal
        </h1>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <NotificationCenter />

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ background: 'linear-gradient(135deg, #7CB342 0%, #9CCC65 100%)' }}
                >
                  {getInitials(user?.full_name)}
                </div>
                <span className="text-white font-medium hidden md:block">{user?.full_name}</span>
                <ChevronDown className="w-4 h-4 text-white/70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl('NotificationSettings')} className="cursor-pointer flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Notification Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleLogout}>
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