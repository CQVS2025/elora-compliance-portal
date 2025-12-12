import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { AlertTriangle } from 'lucide-react';

export function usePermissions() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    }
  });

  const permissions = {
    isAdmin: user?.role === 'admin',
    isSiteManager: user?.role === 'site_manager',
    isDriver: user?.role === 'driver',
    
    // Module permissions - allow public viewing for all tabs
    canViewCompliance: true,
    canViewMaintenance: !user || user?.role === 'admin' || user?.role === 'site_manager',
    canManageSites: user?.role === 'admin',
    canViewReports: !user || user?.role === 'admin' || user?.role === 'site_manager',
    canManageUsers: user?.role === 'admin',
    
    // Data permissions - read-only for public
    canEditVehicles: user && (user?.role === 'admin' || user?.role === 'site_manager'),
    canDeleteRecords: user?.role === 'admin',
    canExportData: user && (user?.role === 'admin' || user?.role === 'site_manager'),
    
    user,
    assignedSites: user?.assigned_sites || [],
    assignedVehicles: user?.assigned_vehicles || []
  };

  return permissions;
}

export function PermissionGuard({ children, require, fallback }) {
  const permissions = usePermissions();

  const hasPermission = typeof require === 'function' 
    ? require(permissions) 
    : permissions[require];

  if (!hasPermission) {
    return fallback || <>{children}</>;
  }

  return <>{children}</>;
}

// Filter data based on user permissions
export function useFilteredData(vehicles, sites) {
  const permissions = usePermissions();

  if (permissions.isAdmin) {
    return { filteredVehicles: vehicles, filteredSites: sites };
  }

  if (permissions.isSiteManager) {
    const filteredSites = sites.filter(s => 
      permissions.assignedSites.includes(s.id)
    );
    const filteredVehicles = vehicles.filter(v => 
      permissions.assignedSites.includes(v.site_id)
    );
    return { filteredVehicles, filteredSites };
  }

  if (permissions.isDriver) {
    const filteredVehicles = vehicles.filter(v => 
      permissions.assignedVehicles.includes(v.id)
    );
    return { filteredVehicles, filteredSites: [] };
  }

  return { filteredVehicles: [], filteredSites: [] };
}