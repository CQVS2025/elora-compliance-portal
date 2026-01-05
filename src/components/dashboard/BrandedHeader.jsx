import React, { useEffect, useMemo } from 'react';
import { Bell, ChevronDown, Settings, LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

async function fetchUserAndBranding() {
  const user = await base44.auth.me();
  const emailDomain = user.email.split('@')[1];
  
  // Fetch branding for this domain
  const branding = await base44.entities.Client_Branding.filter({ 
    client_email_domain: emailDomain 
  });
  
  return {
    user,
    branding: branding.length > 0 ? branding[0] : null
  };
}

export default function BrandedHeader({ onNotificationClick }) {
  const { data, isLoading } = useQuery({
    queryKey: ['userAndBranding'],
    queryFn: fetchUserAndBranding
  });

  const user = data?.user;
  const clientBranding = data?.branding;

  // Default fallback branding
  const branding = useMemo(() => {
    if (clientBranding) {
      return clientBranding;
    }
    return {
      company_name: 'ELORA Solutions',
      logo_url: null,
      primary_color: '#2563eb',
      secondary_color: '#1e40af'
    };
  }, [clientBranding]);

  // Inject CSS variables for theming
  useEffect(() => {
    if (branding) {
      document.documentElement.style.setProperty('--client-primary', branding.primary_color);
      document.documentElement.style.setProperty('--client-secondary', branding.secondary_color);
    }
  }, [branding]);

  const notifications = [
    { id: 1, message: "BATCHER is non-compliant", time: "2 hours ago", type: "warning" },
    { id: 2, message: "New vehicle PLX 3156 added", time: "5 hours ago", type: "info" },
    { id: 3, message: "Monthly report ready", time: "1 day ago", type: "success" }
  ];

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full h-[72px] bg-slate-800">
        <div className="h-full px-6 flex items-center justify-center">
          <div className="animate-pulse text-white">Loading...</div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Branded Header Bar */}
      <header 
        className="sticky top-0 z-50 w-full"
        style={{ backgroundColor: branding.primary_color }}
      >
        <div className="h-[72px] px-6 flex items-center justify-between">
          {/* Left Section - Client Branding */}
          <div className="flex items-center gap-4">
            {branding.logo_url ? (
              <img 
                src={branding.logo_url} 
                alt={branding.company_name}
                className="h-[50px] max-h-[50px] object-contain md:h-[40px]"
              />
            ) : null}
            <div className="flex flex-col">
              <h1 className="text-white font-bold text-2xl md:text-xl leading-tight">
                {branding.company_name}
              </h1>
              {branding.company_name === 'ELORA' && !branding.logo_url && (
                <p className="text-xs font-semibold uppercase" style={{ color: '#7CB342' }}>
                  Powered by CQVS
                </p>
              )}
            </div>
          </div>

          {/* Center Section - Portal Title (Desktop Only) */}
          <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2">
            <h2 className="text-white text-lg font-semibold opacity-90">
              Fleet Compliance Portal
            </h2>
          </div>

          {/* Right Section - User Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2 text-white/70 hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
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
                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-0"
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
                <button className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: branding.secondary_color }}
                  >
                    {initials}
                  </div>
                  <span className="text-white font-medium text-sm hidden lg:block">
                    {user?.full_name || 'User'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-white/70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                <DropdownMenuItem className="cursor-pointer py-3 px-4">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-3 px-4">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer py-3 px-4 text-red-600 hover:bg-red-50"
                  onClick={() => base44.auth.logout()}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Accent Line */}
        <div
          className="h-[3px] w-full"
          style={{ backgroundColor: branding.secondary_color }}
        />
      </header>
    </>
  );
}