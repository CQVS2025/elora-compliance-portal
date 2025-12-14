import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Wrench, TrendingDown, WifiOff, ChevronRight } from 'lucide-react';
import moment from 'moment';
import { motion } from 'framer-motion';

export default function QuickActions({ vehicles, onOpenMaintenance, onOpenVehicle }) {
  const { data: maintenanceRecords = [] } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const records = await base44.entities.Maintenance.list('-service_date', 100);
      return records;
    }
  });

  const { data: devices = [] } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await base44.functions.invoke('elora_devices', { status: 'active' });
      return response.data || [];
    }
  });

  const urgentItems = useMemo(() => {
    const items = [];
    const now = moment();

    // Check for overdue maintenance
    const overdueVehicles = vehicles.filter(v => {
      const record = maintenanceRecords.find(m => m.vehicle_id === v.id);
      if (!record?.next_service_date) return false;
      return moment(record.next_service_date).isBefore(now);
    });

    if (overdueVehicles.length > 0) {
      items.push({
        type: 'maintenance_overdue',
        icon: Wrench,
        color: 'bg-red-100 text-red-800 border-red-200',
        title: 'Overdue Maintenance',
        count: overdueVehicles.length,
        description: `${overdueVehicles.length} vehicle${overdueVehicles.length > 1 ? 's need' : ' needs'} immediate service`,
        action: 'View',
        onClick: onOpenMaintenance
      });
    }

    // Check for vehicles below target
    const underperformingVehicles = vehicles.filter(v => 
      v.washes_completed < v.target * 0.75
    );

    if (underperformingVehicles.length > 0) {
      items.push({
        type: 'underperforming',
        icon: TrendingDown,
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        title: 'Below Target',
        count: underperformingVehicles.length,
        description: `${underperformingVehicles.length} vehicle${underperformingVehicles.length > 1 ? 's are' : ' is'} under 75% compliance`,
        action: 'Review',
        vehicle: underperformingVehicles[0],
        onClick: () => onOpenVehicle && onOpenVehicle(underperformingVehicles[0])
      });
    }

    // Check for offline devices
    const offlineDevices = devices.filter(d => {
      if (!d.lastScanAt) return true;
      const hoursSince = now.diff(moment(d.lastScanAt), 'hours');
      return hoursSince >= 24;
    });

    if (offlineDevices.length > 0) {
      items.push({
        type: 'devices_offline',
        icon: WifiOff,
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        title: 'Devices Offline',
        count: offlineDevices.length,
        description: `${offlineDevices.length} device${offlineDevices.length > 1 ? 's' : ''} not responding`,
        action: 'Check',
        tab: 'devices'
      });
    }

    // Check for maintenance due soon (next 7 days)
    const upcomingMaintenance = vehicles.filter(v => {
      const record = maintenanceRecords.find(m => m.vehicle_id === v.id);
      if (!record?.next_service_date) return false;
      const daysUntil = moment(record.next_service_date).diff(now, 'days');
      return daysUntil > 0 && daysUntil <= 7;
    });

    if (upcomingMaintenance.length > 0) {
      items.push({
        type: 'maintenance_upcoming',
        icon: AlertTriangle,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        title: 'Upcoming Maintenance',
        count: upcomingMaintenance.length,
        description: `${upcomingMaintenance.length} vehicle${upcomingMaintenance.length > 1 ? 's' : ''} due within 7 days`,
        action: 'Schedule',
        onClick: onOpenMaintenance
      });
    }

    return items.slice(0, 4); // Show top 4 urgent items
  }, [vehicles, maintenanceRecords, devices, onOpenMaintenance, onOpenVehicle]);

  if (urgentItems.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 mx-auto mb-3 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ✓
            </motion.div>
          </div>
          <p className="text-lg font-semibold text-green-800">All Clear!</p>
          <p className="text-sm text-green-600 mt-1">No urgent actions required at this time</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Quick Actions - Requires Attention
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {urgentItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-4 border-2 rounded-lg ${item.color} hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <h4 className="font-semibold">{item.title}</h4>
                  </div>
                  <Badge variant="secondary" className="bg-white/50">
                    {item.count}
                  </Badge>
                </div>
                <p className="text-sm mb-3">{item.description}</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full group hover:bg-white/50"
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    }
                  }}
                >
                  {item.action}
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}