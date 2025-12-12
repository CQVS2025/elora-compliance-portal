import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, CheckCircle, Droplet, Users, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import { base44 } from "@/api/base44Client";

async function fetchCustomers() {
  const response = await base44.functions.invoke('elora_customers');
  return response.data.map(c => ({
    id: c.ref,
    name: c.name
  }));
}

async function fetchSites() {
  const response = await base44.functions.invoke('elora_sites', {});
  return response.data.map(s => ({
    id: s.ref,
    name: s.siteName,
    customer_ref: s.customerRef
  }));
}

async function fetchVehicles({ customerId, siteId } = {}) {
  const params = {};
  if (customerId && customerId !== 'all') params.customer_id = customerId;
  if (siteId && siteId !== 'all') params.site_id = siteId;
  
  const response = await base44.functions.invoke('elora_vehicles', params);
  return response.data;
}

async function fetchScans({ customerId, siteId, startDate, endDate } = {}) {
  const params = {};
  if (customerId && customerId !== 'all') params.customer_id = customerId;
  if (siteId && siteId !== 'all') params.site_id = siteId;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  
  const response = await base44.functions.invoke('elora_scans', params);
  return response.data;
}

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

  // Update date range when period changes
  useEffect(() => {
    if (activePeriod === 'Today') {
      setDateRange({
        start: moment().format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD')
      });
    } else if (activePeriod === 'Week') {
      setDateRange({
        start: moment().startOf('week').format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD')
      });
    } else if (activePeriod === 'Month') {
      setDateRange({
        start: moment().startOf('month').format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD')
      });
    }
  }, [activePeriod]);

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const { data: rawSites = [], isLoading: sitesLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: () => fetchSites(),
  });

  // Filter sites by selected customer on the client side
  const allSites = useMemo(() => {
    if (selectedCustomer === 'all' || !selectedCustomer) return rawSites;
    return rawSites.filter(site => site.id === selectedCustomer || site.customer_ref === selectedCustomer);
  }, [rawSites, selectedCustomer]);

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles', selectedCustomer, selectedSite],
    queryFn: () => fetchVehicles({
      customerId: selectedCustomer,
      siteId: selectedSite
    }),
  });

  const { data: scans = [] } = useQuery({
    queryKey: ['scans', selectedCustomer, selectedSite, dateRange.start, dateRange.end],
    queryFn: () => fetchScans({
      customerId: selectedCustomer,
      siteId: selectedSite,
      startDate: dateRange.start,
      endDate: dateRange.end
    }),
  });



  // Generate chart data based on scans
  const washTrendsData = useMemo(() => {
    if (!scans.length) return [];
    
    const scansByDate = {};
    scans.forEach(scan => {
      const date = moment(scan.timestamp).format('MMM D');
      scansByDate[date] = (scansByDate[date] || 0) + 1;
    });

    const days = [];
    const start = moment(dateRange.start);
    const end = moment(dateRange.end);
    const diff = end.diff(start, 'days');
    
    for (let i = 0; i <= Math.min(diff, 30); i++) {
      const date = moment(start).add(i, 'days');
      const dateKey = date.format('MMM D');
      days.push({
        date: dateKey,
        washes: scansByDate[dateKey] || 0,
      });
    }
    return days;
  }, [scans, dateRange]);

  // Reset site when customer changes
  useEffect(() => {
    setSelectedSite('all');
  }, [selectedCustomer]);

  // Create site lookup map
  const sitesMap = useMemo(() => {
    const map = {};
    allSites.forEach(site => {
      map[site.id] = site.name;
    });
    return map;
  }, [allSites]);

  // Calculate wash counts from scans
  const washCounts = useMemo(() => {
    const counts = {};
    scans.forEach(scan => {
      const vehicleRef = scan.vehicleRef;
      if (vehicleRef) {
        counts[vehicleRef] = (counts[vehicleRef] || 0) + 1;
      }
    });
    return counts;
  }, [scans]);

  // Enrich vehicles with calculated washes
  const enrichedVehicles = useMemo(() => {
    return vehicles.map(vehicle => {
      const washCount = washCounts[vehicle.vehicleRef] || 0;
      
      return {
        id: vehicle.vehicleRef,
        name: vehicle.vehicleName,
        rfid: vehicle.vehicleRfid,
        site_id: vehicle.siteId,
        site_name: vehicle.siteName,
        washes_completed: washCount,
        target: vehicle.washesPerWeek || 12,
        last_scan: vehicle.lastScanAt,
      };
    });
  }, [vehicles, washCounts]);

  // Calculate stats
  const stats = useMemo(() => {
    const compliantCount = enrichedVehicles.filter(v => v.washes_completed >= v.target).length;
    const totalWashes = enrichedVehicles.reduce((sum, v) => sum + (v.washes_completed || 0), 0);
    const activeDriversCount = enrichedVehicles.filter(v => v.washes_completed > 0).length;
    
    return {
      totalVehicles: enrichedVehicles.length,
      complianceRate: enrichedVehicles.length > 0 
        ? Math.round((compliantCount / enrichedVehicles.length) * 100) 
        : 0,
      monthlyWashes: totalWashes,
      activeDrivers: activeDriversCount,
    };
  }, [enrichedVehicles]);

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
          sites={allSites}
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
          vehicles={enrichedVehicles}
          onVehicleClick={setSelectedVehicle}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WashTrendsChart data={washTrendsData} />
          <VehiclePerformanceChart vehicles={enrichedVehicles} />
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