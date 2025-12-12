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
    
    // Module permissions
    canViewCompliance: true, // All roles can view
    canViewMaintenance: user?.role === 'admin' || user?.role === 'site_manager',
    canManageSites: user?.role === 'admin',
    canViewReports: user?.role === 'admin' || user?.role === 'site_manager',
    canManageUsers: user?.role === 'admin',
    
    // Data permissions
    canEditVehicles: user?.role === 'admin' || user?.role === 'site_manager',
    canDeleteRecords: user?.role === 'admin',
    canExportData: user?.role === 'admin' || user?.role === 'site_manager',
    
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
    return fallback || (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <AlertTriangle className="w-12 h-12 text-orange-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Access Denied</h3>
        <p className="text-slate-600 text-center">
          You don't have permission to view this content. Please contact your administrator.
        </p>
      </div>
    );
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