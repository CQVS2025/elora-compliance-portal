import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, CheckCircle, Droplet, Users, Loader2, Trophy, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import { base44 } from "@/api/base44Client";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

async function fetchDashboardData({ customerId, siteId, startDate, endDate } = {}) {
  const params = {};
  if (customerId && customerId !== 'all') params.customer_id = customerId;
  if (siteId && siteId !== 'all') params.site_id = siteId;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  
  const response = await base44.functions.invoke('elora_dashboard', params);
  return response.data;
}

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

import Header from '@/components/dashboard/Header';
import FilterSection from '@/components/dashboard/FilterSection';
import StatsCard from '@/components/dashboard/StatsCard';
import VehicleTable from '@/components/dashboard/VehicleTable';
import WashAnalytics from '@/components/dashboard/WashAnalytics';
import VehiclePerformanceChart from '@/components/dashboard/VehiclePerformanceChart';
import MaintenanceSection from '@/components/maintenance/MaintenanceSection';
import SiteManagement from '@/components/sites/SiteManagement';
import ReportsDashboard from '@/components/reports/ReportsDashboard';
import RoleManagement from '@/components/admin/RoleManagement';
import UsageCosts from '@/components/costs/UsageCosts';
import MobileDashboard from './MobileDashboard';
import DeviceHealth from '@/components/devices/DeviceHealth';
import CostForecast from '@/components/analytics/CostForecast';
import WashPatternAnalytics from '@/components/analytics/WashPatternAnalytics';
import QuickActions from '@/components/dashboard/QuickActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions, useFilteredData, PermissionGuard } from '@/components/auth/PermissionGuard';


export default function Dashboard() {
  const permissions = usePermissions();
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [selectedSite, setSelectedSite] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: moment().startOf('month').format('YYYY-MM-DD'),
    end: moment().format('YYYY-MM-DD')
  });
  const [activePeriod, setActivePeriod] = useState('Month');
  const [searchQuery, setSearchQuery] = useState('');
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [selectedVehicleForModal, setSelectedVehicleForModal] = useState(null);

  // Detect mobile and redirect drivers to mobile view
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


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

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard', selectedCustomer, selectedSite, dateRange.start, dateRange.end],
    queryFn: () => fetchDashboardData({
      customerId: selectedCustomer,
      siteId: selectedSite,
      startDate: dateRange.start,
      endDate: dateRange.end
    }),
  });

  // Reset site when customer changes
  useEffect(() => {
    setSelectedSite('all');
  }, [selectedCustomer]);

  // Process dashboard data
  const processedData = useMemo(() => {
    if (!dashboardData?.rows) return { vehicles: [], scans: [] };
    
    const vehicleMap = new Map();
    const scansArray = [];
    
    // Filter rows to only include the selected date range
    const startMoment = moment(dateRange.start);
    const endMoment = moment(dateRange.end);
    
    dashboardData.rows.forEach(row => {
      // Check if this row falls within the selected date range
      const rowDate = moment(`${row.year}-${String(row.month).padStart(2, '0')}-01`);
      if (!rowDate.isBetween(startMoment, endMoment, 'month', '[]')) {
        return; // Skip rows outside the date range
      }
      
      const vehicleKey = row.vehicleRef;
      
      if (!vehicleMap.has(vehicleKey)) {
        vehicleMap.set(vehicleKey, {
          id: row.vehicleRef,
          name: row.vehicleName,
          rfid: row.vehicleRef,
          site_id: row.siteRef,
          site_name: row.siteName,
          washes_completed: row.totalScans || 0,
          target: row.washesPerWeek || 12,
          last_scan: row.lastScan,
        });
      } else {
        const existing = vehicleMap.get(vehicleKey);
        existing.washes_completed += (row.totalScans || 0);
        if (row.lastScan && (!existing.last_scan || row.lastScan > existing.last_scan)) {
          existing.last_scan = row.lastScan;
        }
      }
      
      // Create scan records for compatibility
      if (row.totalScans > 0) {
        scansArray.push({
          vehicleRef: row.vehicleRef,
          siteRef: row.siteRef,
          siteName: row.siteName,
          timestamp: row.lastScan
        });
      }
    });
    
    return {
      vehicles: Array.from(vehicleMap.values()),
      scans: scansArray
    };
  }, [dashboardData, dateRange]);

  const enrichedVehicles = processedData.vehicles;
  const scans = processedData.scans;

  // Apply permission-based filtering
  const { filteredVehicles, filteredSites } = useFilteredData(enrichedVehicles, allSites);

  // Generate chart data from dashboard API
  const washTrendsData = useMemo(() => {
    if (!dashboardData?.charts?.totalWashesByMonth?.length) {
      // Fallback to scanning data
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
    }
    
    // Use API's pre-aggregated data
    return dashboardData.charts.totalWashesByMonth.map(item => ({
      date: `${item.month}/${item.year}`,
      washes: item.totalWashes || 0
    }));
  }, [dashboardData, scans, dateRange]);

  // Calculate stats
  const stats = useMemo(() => {
    const compliantCount = filteredVehicles.filter(v => v.washes_completed >= v.target).length;
    const totalWashes = filteredVehicles.reduce((sum, v) => sum + (v.washes_completed || 0), 0);
    const activeDriversCount = filteredVehicles.filter(v => v.washes_completed > 0).length;
    
    return {
      totalVehicles: filteredVehicles.length,
      complianceRate: filteredVehicles.length > 0 
        ? Math.round((compliantCount / filteredVehicles.length) * 100) 
        : 0,
      monthlyWashes: totalWashes,
      activeDrivers: activeDriversCount,
    };
  }, [filteredVehicles]);

  const isLoading = customersLoading || sitesLoading || dashboardLoading;

  // Redirect drivers to mobile view on mobile devices
  if (isMobile && permissions.isDriver) {
    return <MobileDashboard />;
  }

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

        {/* Quick Actions Widget */}
        <QuickActions 
          vehicles={filteredVehicles}
          onOpenMaintenance={() => {
            const tabsElement = document.querySelector('[value="maintenance"]');
            if (tabsElement) tabsElement.click();
          }}
          onOpenVehicle={(vehicle) => setSelectedVehicleForModal(vehicle)}
        />

        {/* Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CostForecast 
            scans={scans}
            selectedCustomer={selectedCustomer}
            selectedSite={selectedSite}
          />
          <WashPatternAnalytics scans={scans} />
        </div>

        {/* Leaderboard Quick Link */}
        <Link to={`${createPageUrl('Leaderboard')}?customer=${selectedCustomer}&site=${selectedSite}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Trophy className="w-6 h-6" />
                  Driver Leaderboard
                </h3>
                <p className="text-purple-100">
                  See who's leading the pack this month! 🏆
                </p>
              </div>
              <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
            </div>
          </motion.div>
        </Link>

        {/* Main Content Tabs */}
        <Tabs defaultValue="compliance" className="w-full">
          <TabsList className="grid w-full max-w-6xl grid-cols-7 gap-1">
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="costs">Usage Costs</TabsTrigger>
            <TabsTrigger value="devices">Device Health</TabsTrigger>
            <TabsTrigger value="sites">Sites</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="compliance" className="space-y-6">
            {/* Vehicle Table */}
            <VehicleTable
              vehicles={filteredVehicles}
              scans={scans}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WashAnalytics 
                data={washTrendsData} 
                vehicles={filteredVehicles}
                scans={scans}
              />
              <VehiclePerformanceChart vehicles={filteredVehicles} />
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="mt-6">
            <MaintenanceSection vehicles={filteredVehicles} />
          </TabsContent>

          <TabsContent value="costs" className="mt-6">
            <UsageCosts
              selectedCustomer={selectedCustomer}
              selectedSite={selectedSite}
              dateRange={dateRange}
            />
          </TabsContent>

          <TabsContent value="devices" className="mt-6">
            <DeviceHealth
              selectedCustomer={selectedCustomer}
              selectedSite={selectedSite}
            />
          </TabsContent>

          <TabsContent value="sites" className="mt-6">
            <SiteManagement customers={customers} vehicles={enrichedVehicles} />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ReportsDashboard vehicles={filteredVehicles} scans={scans} />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <RoleManagement vehicles={enrichedVehicles} sites={allSites} />
          </TabsContent>
          </Tabs>
      </main>


    </div>
  );
}