import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { AlertTriangle } from 'lucide-react';

// Domain-based access configuration - CUSTOMIZE HERE
const DOMAIN_CONFIG = {
  'elora.com.au': {
    showAllData: false,
    filterByCustomer: 'Heidelberg Materials', // Only show this customer's data
    defaultCustomer: 'all',
    defaultSite: 'all',
    hiddenTabs: [],
    visibleTabs: ['compliance', 'maintenance', 'costs', 'refills', 'devices', 'sites', 'reports', 'users']
  },
  'heidelberg.com.au': {
    showAllData: true,
    defaultCustomer: 'all',
    defaultSite: 'all',
    hiddenTabs: [],
    visibleTabs: ['compliance', 'maintenance', 'costs', 'refills', 'devices', 'sites', 'reports', 'users']
  }
  // Add more domains as needed
};

export function getDomainConfig(email) {
  if (!email) return null;
  const domain = email.split('@')[1];
  return DOMAIN_CONFIG[domain] || null;
}

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
    // Role checks - All public
    isAdmin: true,
    isManager: true,
    isTechnician: true,
    isViewer: true,
    isSiteManager: true,
    isDriver: false,
    
    // Module permissions - All public
    canViewCompliance: true,
    canViewMaintenance: true,
    canManageSites: true,
    canViewReports: true,
    canManageUsers: true,
    
    // Data permissions - Edit - All public
    canEditVehicles: true,
    canEditMaintenance: true,
    canEditSites: true,
    
    // Data permissions - Delete - All public
    canDeleteRecords: true,
    
    // Data permissions - Export - All public
    canExportData: true,
    
    // Advanced features - All public
    canGenerateAIReports: true,
    canViewCosts: true,
    
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

  // Check domain-based configuration
  const domainConfig = getDomainConfig(permissions.user?.email);
  if (domainConfig?.filterByCustomer) {
    const customerName = domainConfig.filterByCustomer;
    const filteredVehicles = vehicles?.filter(v => 
      v.customer_name === customerName || v.customerName === customerName
    ) || [];
    const filteredSites = sites?.filter(s => 
      s.customer_name === customerName || s.customerName === customerName
    ) || [];
    return { filteredVehicles, filteredSites };
  }
  
  if (domainConfig?.showAllData) {
    return { filteredVehicles: vehicles, filteredSites: sites };
  }

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