import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Truck, CheckCircle, Droplet, Users, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';

import Header from '@/components/dashboard/Header';
import FilterSection from '@/components/dashboard/FilterSection';
import StatsCard from '@/components/dashboard/StatsCard';
import VehicleTable from '@/components/dashboard/VehicleTable';
import WashTrendsChart from '@/components/dashboard/WashTrendsChart';
import VehiclePerformanceChart from '@/components/dashboard/VehiclePerformanceChart';
import VehicleDetailModal from '@/components/dashboard/VehicleDetailModal';

export default function Dashboard() {
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [selectedSite, setSelectedSite] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: moment().startOf('month').format('YYYY-MM-DD'),
    end: moment().format('YYYY-MM-DD')
  });
  const [activePeriod, setActivePeriod] = useState('Month');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const { data: sites = [], isLoading: sitesLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list(),
  });

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  // Generate chart data based on date range
  const washTrendsData = useMemo(() => {
    const days = [];
    const start = moment(dateRange.start);
    const end = moment(dateRange.end);
    const diff = end.diff(start, 'days');
    
    for (let i = 0; i <= Math.min(diff, 30); i++) {
      const date = moment(start).add(i, 'days');
      days.push({
        date: date.format('MMM D'),
        washes: Math.floor(Math.random() * 60) + 40,
      });
    }
    return days;
  }, [dateRange]);

  // Filter vehicles based on selections
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      if (selectedSite !== 'all' && vehicle.site_id !== selectedSite) return false;
      return true;
    });
  }, [vehicles, selectedSite, selectedCustomer]);

  // Calculate stats
  const stats = useMemo(() => {
    const compliantCount = filteredVehicles.filter(v => v.washes_completed >= v.target).length;
    const totalWashes = filteredVehicles.reduce((sum, v) => sum + (v.washes_completed || 0), 0);
    
    return {
      totalVehicles: filteredVehicles.length,
      complianceRate: filteredVehicles.length > 0 
        ? Math.round((compliantCount / filteredVehicles.length) * 100) 
        : 0,
      monthlyWashes: totalWashes,
      activeDrivers: Math.max(0, filteredVehicles.length - Math.floor(filteredVehicles.length * 0.04)),
    };
  }, [filteredVehicles]);

  const isLoading = customersLoading || sitesLoading || vehiclesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#7CB342] animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statsConfig = [
    {
      icon: Truck,
      iconBg: 'bg-slate-100 text-slate-600',
      value: stats.totalVehicles.toLocaleString(),
      label: 'Current fleet size',
    },
    {
      icon: CheckCircle,
      iconBg: 'bg-[#7CB342]/10 text-[#7CB342]',
      value: `${stats.complianceRate}%`,
      label: 'Current compliance rate',
    },
    {
      icon: Droplet,
      iconBg: 'bg-blue-100 text-blue-600',
      value: stats.monthlyWashes.toLocaleString(),
      label: 'Total washes this month',
    },
    {
      icon: Users,
      iconBg: 'bg-purple-100 text-purple-600',
      value: stats.activeDrivers.toLocaleString(),
      label: 'Current active drivers',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Filters */}
        <FilterSection
          customers={customers}
          sites={sites}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          selectedSite={selectedSite}
          setSelectedSite={setSelectedSite}
          dateRange={dateRange}
          setDateRange={setDateRange}
          activePeriod={activePeriod}
          setActivePeriod={setActivePeriod}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsConfig.map((stat, index) => (
            <StatsCard key={index} {...stat} index={index} />
          ))}
        </div>

        {/* Vehicle Table */}
        <VehicleTable
          vehicles={filteredVehicles}
          onVehicleClick={setSelectedVehicle}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WashTrendsChart data={washTrendsData} />
          <VehiclePerformanceChart vehicles={filteredVehicles} />
        </div>
      </main>

      {/* Vehicle Detail Modal */}
      <VehicleDetailModal
        vehicle={selectedVehicle}
        open={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
      />
    </div>
  );
}