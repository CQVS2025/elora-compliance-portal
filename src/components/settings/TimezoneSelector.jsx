import React, { useState, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { getCommonTimezones, getStoredTimezone, setUserTimezone, getTimezoneAbbr, getTimezoneOffset } from '@/utils/timezone';
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

export default function TimezoneSelector({ className = '' }) {
  const [selectedTimezone, setSelectedTimezone] = useState(getStoredTimezone());
  const timezones = getCommonTimezones();

  useEffect(() => {
    setSelectedTimezone(getStoredTimezone());
  }, []);

  const handleTimezoneChange = (timezone) => {
    setSelectedTimezone(timezone);
    setUserTimezone(timezone);
    toast.success(`Timezone set to ${timezone}`);

    // Reload page to apply new timezone to all dates
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const currentAbbr = getTimezoneAbbr(selectedTimezone);
  const currentOffset = getTimezoneOffset(selectedTimezone);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#7CB342]" />
          Timezone Settings
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          All dates and times will be displayed in your selected timezone
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div>
            <Label className="text-sm font-medium text-slate-800">Current Timezone</Label>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedTimezone} ({currentAbbr}, {currentOffset})
            </p>
          </div>
        </div>

        <Label className="text-sm font-medium text-slate-700">Select Timezone</Label>
        <div className="max-h-64 overflow-y-auto border-2 border-slate-200 rounded-lg">
          {timezones.map((tz) => (
            <button
              key={tz.value}
              onClick={() => handleTimezoneChange(tz.value)}
              className={`w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                selectedTimezone === tz.value ? 'bg-[#7CB342]/10' : ''
              }`}
            >
              <span className="text-sm text-slate-800">{tz.label}</span>
              {selectedTimezone === tz.value && (
                <Check className="w-5 h-5 text-[#7CB342]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
