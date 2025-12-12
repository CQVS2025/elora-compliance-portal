import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, MapPin, Phone, Mail, Building2, Edit, Trash2, AlertCircle, Truck } from 'lucide-react';
import SiteModal from './SiteModal';
import AssignVehiclesModal from './AssignVehiclesModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function SiteManagement({ customers, vehicles }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const records = await base44.entities.Site.list('-created_date', 1000);
      return records;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (siteId) => base44.entities.Site.delete(siteId),
    onSuccess: () => {
      queryClient.invalidateQueries(['sites']);
    }
  });

  const handleEdit = (site) => {
    setSelectedSite(site);
    setModalOpen(true);
  };

  const handleDelete = async (site) => {
    if (confirm(`Are you sure you want to delete "${site.name}"?`)) {
      deleteMutation.mutate(site.id);
    }
  };

  const handleAddNew = () => {
    setSelectedSite(null);
    setModalOpen(true);
  };

  const handleAssignVehicles = (site) => {
    setSelectedSite(site);
    setAssignModalOpen(true);
  };

  const getAssignedVehicles = (siteId) => {
    return vehicles?.filter(v => v.site_id === siteId) || [];
  };

  const filteredSites = sites.filter(site =>
    site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (site.customer_name && site.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (site.city && site.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500 text-white';
      case 'inactive':
        return 'bg-slate-500 text-white';
      case 'maintenance':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Site Management</h2>
          <p className="text-slate-600 mt-1">Manage wash station locations and contact information</p>
        </div>
        <Button onClick={handleAddNew} className="bg-[#7CB342] hover:bg-[#689F38]">
          <Plus className="w-4 h-4 mr-2" />
          Add New Site
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search sites by name, customer, or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-slate-200"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#7CB342]/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#7CB342]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{sites.length}</p>
                <p className="text-sm text-slate-600">Total Sites</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {sites.filter(s => s.status === 'active').length}
                </p>
                <p className="text-sm text-slate-600">Active Sites</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {sites.filter(s => s.status === 'maintenance').length}
                </p>
                <p className="text-sm text-slate-600">In Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Site Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredSites.map((site, index) => (
            <motion.div
              key={site.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 text-lg mb-1">{site.name}</h3>
                      {site.customer_name && (
                        <p className="text-sm text-slate-600">{site.customer_name}</p>
                      )}
                    </div>
                    <Badge className={getStatusColor(site.status)}>
                      {site.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    {(site.address || site.city || site.state) && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div className="text-sm text-slate-600">
                          {site.address && <p>{site.address}</p>}
                          <p>
                            {[site.city, site.state, site.postal_code].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                    )}

                    {site.contact_name && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <p className="text-sm text-slate-600">
                          {site.contact_name}
                          {site.contact_phone && ` • ${site.contact_phone}`}
                        </p>
                      </div>
                    )}

                    {site.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <p className="text-sm text-slate-600">{site.contact_email}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAssignVehicles(site)}
                      className="w-full justify-start text-[#7CB342] hover:text-[#689F38] hover:bg-[#7CB342]/10"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      <span>
                        {getAssignedVehicles(site.id).length} vehicle{getAssignedVehicles(site.id).length !== 1 ? 's' : ''} assigned
                      </span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(site)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(site)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredSites.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">
            {searchQuery ? 'No sites found matching your search' : 'No sites yet. Add your first site to get started.'}
          </p>
        </div>
      )}

      <SiteModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedSite(null);
        }}
        site={selectedSite}
        customers={customers}
        onSuccess={() => {
          queryClient.invalidateQueries(['sites']);
        }}
      />

      <AssignVehiclesModal
        open={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedSite(null);
        }}
        site={selectedSite}
        vehicles={vehicles || []}
        onSuccess={() => {
          queryClient.invalidateQueries(['vehicles']);
        }}
      />
    </div>
  );
}