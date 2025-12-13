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
    // Role checks
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isTechnician: user?.role === 'technician',
    isViewer: user?.role === 'viewer',
    isSiteManager: user?.role === 'site_manager',
    isDriver: user?.role === 'driver',
    
    // Module permissions
    canViewCompliance: true, // Public access
    canViewMaintenance: true, // Public access
    canManageSites: user?.role === 'admin',
    canViewReports: true, // Public access
    canManageUsers: user?.role === 'admin',
    
    // Data permissions - Edit
    canEditVehicles: user && ['admin', 'manager', 'site_manager'].includes(user?.role),
    canEditMaintenance: user && ['admin', 'manager', 'technician', 'site_manager'].includes(user?.role),
    canEditSites: user?.role === 'admin',
    
    // Data permissions - Delete
    canDeleteRecords: user?.role === 'admin',
    
    // Data permissions - Export
    canExportData: user && ['admin', 'manager', 'site_manager'].includes(user?.role),
    
    // Advanced features
    canGenerateAIReports: user && ['admin', 'manager'].includes(user?.role),
    canViewCosts: user && ['admin', 'manager'].includes(user?.role),
    
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

  // Public view, admin, manager - show all data
  if (!permissions.user || ['admin', 'manager', 'viewer', 'technician'].includes(permissions.user?.role)) {
    return { filteredVehicles: vehicles, filteredSites: sites };
  }

  // Site manager - show assigned sites only
  if (permissions.isSiteManager) {
    const filteredSites = sites.filter(s => 
      permissions.assignedSites.includes(s.id)
    );
    const filteredVehicles = vehicles.filter(v => 
      permissions.assignedSites.includes(v.site_id)
    );
    return { filteredVehicles, filteredSites };
  }

  // Driver - show assigned vehicles only
  if (permissions.isDriver) {
    const filteredVehicles = vehicles.filter(v => 
      permissions.assignedVehicles.includes(v.id)
    );
    return { filteredVehicles, filteredSites: [] };
  }

  return { filteredVehicles: [], filteredSites: [] };
}