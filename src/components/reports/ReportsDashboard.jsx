import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  Wrench,
  Calendar,
  Building2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import moment from 'moment';

export default function ReportsDashboard({ vehicles, scans }) {
  const { data: maintenanceRecords = [] } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const records = await base44.entities.Maintenance.list('-service_date', 1000);
      return records;
    }
  });

  // Fleet Compliance Analysis
  const complianceStats = useMemo(() => {
    const compliant = vehicles.filter(v => v.washes_completed >= v.target).length;
    const total = vehicles.length;
    const rate = total > 0 ? Math.round((compliant / total) * 100) : 0;
    
    return {
      compliantVehicles: compliant,
      nonCompliantVehicles: total - compliant,
      totalVehicles: total,
      complianceRate: rate,
      trend: rate >= 75 ? 'good' : rate >= 50 ? 'warning' : 'critical'
    };
  }, [vehicles]);

  // Wash Frequency by Site
  const washFrequencyBySite = useMemo(() => {
    const siteWashes = {};
    scans.forEach(scan => {
      const siteName = scan.siteName || 'Unknown';
      siteWashes[siteName] = (siteWashes[siteName] || 0) + 1;
    });
    
    return Object.entries(siteWashes)
      .map(([site, washes]) => ({ site, washes }))
      .sort((a, b) => b.washes - a.washes)
      .slice(0, 10);
  }, [scans]);

  // Maintenance Cost Analysis
  const maintenanceCostAnalysis = useMemo(() => {
    const monthlyData = {};
    let totalCost = 0;
    
    maintenanceRecords.forEach(record => {
      if (record.cost) {
        totalCost += record.cost;
        const month = moment(record.service_date).format('MMM YY');
        monthlyData[month] = (monthlyData[month] || 0) + record.cost;
      }
    });

    const chartData = Object.entries(monthlyData)
      .map(([month, cost]) => ({ month, cost: Math.round(cost) }))
      .sort((a, b) => moment(a.month, 'MMM YY').valueOf() - moment(b.month, 'MMM YY').valueOf())
      .slice(-12);

    const avgCost = maintenanceRecords.length > 0 ? totalCost / maintenanceRecords.length : 0;

    return {
      totalCost,
      avgCost,
      chartData,
      recordCount: maintenanceRecords.length
    };
  }, [maintenanceRecords]);

  // Upcoming Maintenance
  const upcomingMaintenance = useMemo(() => {
    const now = new Date();
    const upcoming = maintenanceRecords.filter(record => {
      if (!record.next_service_date) return false;
      const nextDate = new Date(record.next_service_date);
      const daysUntil = Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 30;
    }).sort((a, b) => new Date(a.next_service_date) - new Date(b.next_service_date));

    const overdue = maintenanceRecords.filter(record => {
      if (!record.next_service_date) return false;
      const nextDate = new Date(record.next_service_date);
      return nextDate < now;
    });

    return { upcoming, overdue };
  }, [maintenanceRecords]);

  // Compliance Trend (last 30 days)
  const complianceTrend = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = moment().subtract(i, 'days');
      const dateStr = date.format('YYYY-MM-DD');
      const scansOnDate = scans.filter(s => moment(s.timestamp).format('YYYY-MM-DD') === dateStr).length;
      
      days.push({
        date: date.format('MMM D'),
        scans: scansOnDate
      });
    }
    return days;
  }, [scans]);

  // Service Type Distribution
  const serviceTypeDistribution = useMemo(() => {
    const distribution = {};
    maintenanceRecords.forEach(record => {
      const type = record.service_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      distribution[type] = (distribution[type] || 0) + 1;
    });

    return Object.entries(distribution)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [maintenanceRecords]);

  const COLORS = ['#7CB342', '#9CCC65', '#689F38', '#558B2F', '#33691E', '#827717', '#CDDC39'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Fleet Reports & Analytics</h2>
        <p className="text-slate-600 mt-1">Comprehensive overview of fleet health and operational efficiency</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Compliance Rate</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{complianceStats.complianceRate}%</p>
                <div className="flex items-center gap-1 mt-2">
                  {complianceStats.trend === 'good' ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-xs ${complianceStats.trend === 'good' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {complianceStats.compliantVehicles}/{complianceStats.totalVehicles} compliant
                  </span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                complianceStats.trend === 'good' ? 'bg-emerald-100' : 'bg-red-100'
              }`}>
                <CheckCircle className={`w-6 h-6 ${
                  complianceStats.trend === 'good' ? 'text-emerald-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Maintenance Cost</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  ${maintenanceCostAnalysis.totalCost.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Avg: ${Math.round(maintenanceCostAnalysis.avgCost).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Upcoming Services</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {upcomingMaintenance.upcoming.length}
                </p>
                <p className="text-xs text-slate-500 mt-2">Next 30 days</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Overdue Services</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {upcomingMaintenance.overdue.length}
                </p>
                <p className="text-xs text-red-600 mt-2">Requires attention</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wash Activity Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={complianceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="scans" 
                  stroke="#7CB342" 
                  strokeWidth={2}
                  dot={{ fill: '#7CB342', r: 4 }}
                  name="Washes"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Maintenance Cost Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Maintenance Cost Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={maintenanceCostAnalysis.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="cost" fill="#7CB342" name="Cost ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wash Frequency by Site */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wash Frequency by Site</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={washFrequencyBySite} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="site" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="washes" fill="#9CCC65" name="Washes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Maintenance Service Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceTypeDistribution}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => entry.type}
                >
                  {serviceTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Maintenance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Upcoming Maintenance Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingMaintenance.overdue.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-800 mb-2">
                ⚠️ {upcomingMaintenance.overdue.length} Overdue Service{upcomingMaintenance.overdue.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-1">
                {upcomingMaintenance.overdue.slice(0, 3).map((record, idx) => (
                  <div key={idx} className="text-xs text-red-700">
                    • {record.vehicle_name} - {record.service_type.replace('_', ' ')} 
                    (Due: {moment(record.next_service_date).format('MMM D, YYYY')})
                  </div>
                ))}
              </div>
            </div>
          )}

          {upcomingMaintenance.upcoming.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {upcomingMaintenance.upcoming.map((record, idx) => {
                const daysUntil = Math.ceil((new Date(record.next_service_date) - new Date()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysUntil <= 7;
                
                return (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isUrgent ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{record.vehicle_name}</p>
                        <p className="text-xs text-slate-600">
                          {record.service_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800">
                        {moment(record.next_service_date).format('MMM D, YYYY')}
                      </p>
                      <Badge className={isUrgent ? 'bg-orange-500 text-white' : 'bg-slate-500 text-white'}>
                        {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No upcoming maintenance scheduled</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}