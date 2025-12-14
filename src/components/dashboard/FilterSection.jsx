import React from 'react';
import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function FilterSection({
  customers,
  sites,
  selectedCustomer,
  setSelectedCustomer,
  selectedSite,
  setSelectedSite,
  dateRange,
  setDateRange,
  activePeriod,
  setActivePeriod,
}) {
  const periods = ['Today', 'Week', 'Month'];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex flex-wrap items-center gap-4">
        {/* Customer Dropdown */}
        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
          <SelectTrigger className="w-[180px] border-slate-200 focus:ring-[#7CB342] focus:ring-offset-0">
            <SelectValue placeholder="Select Customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Site Dropdown */}
        <Select 
          value={selectedSite} 
          onValueChange={setSelectedSite}
        >
          <SelectTrigger className="w-[180px] border-slate-200 focus:ring-[#7CB342]">
            <SelectValue placeholder="Select Site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {sites.filter(site => site.name !== 'All Sites').map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range */}
        <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-md bg-white">
          <Calendar className="w-4 h-4 text-slate-400" />
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="border-0 p-0 h-auto w-32 focus-visible:ring-0 text-sm"
          />
          <span className="text-slate-300">|</span>
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="border-0 p-0 h-auto w-32 focus-visible:ring-0 text-sm"
          />
        </div>

        {/* Period Buttons */}
        <div className="flex rounded-lg overflow-hidden border border-slate-200">
          {periods.map((period) => (
            <Button
              key={period}
              variant="ghost"
              size="sm"
              onClick={() => setActivePeriod(period)}
              className={`rounded-none px-4 transition-all duration-300 ${
                activePeriod === period
                  ? 'bg-[#7CB342] text-white hover:bg-[#689F38] hover:text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}