import React, { useState } from 'react';
import { Search, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';

export default function VehicleTable({ vehicles, onVehicleClick, searchQuery, setSearchQuery }) {
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.rfid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
    return aVal < bVal ? 1 : -1;
  });

  const totalPages = Math.ceil(sortedVehicles.length / itemsPerPage);
  const paginatedVehicles = sortedVehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportToCSV = () => {
    const headers = ['Vehicle', 'RFID', 'Site', 'Washes Completed', 'Target', 'Status', 'Progress', 'Last Scan'];
    const rows = sortedVehicles.map(v => [
      v.name,
      v.rfid,
      v.site_name,
      v.washes_completed,
      v.target,
      v.washes_completed >= v.target ? 'Compliant' : 'Non-Compliant',
      `${Math.round((v.washes_completed / v.target) * 100)}%`,
      moment(v.last_scan).fromNow()
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vehicle-compliance.csv';
    a.click();
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  const columns = [
    { key: 'name', label: 'Vehicle' },
    { key: 'rfid', label: 'RFID' },
    { key: 'site_name', label: 'Site' },
    { key: 'washes_completed', label: 'Washes' },
    { key: 'target', label: 'Target' },
    { key: 'status', label: 'Status' },
    { key: 'progress', label: 'Progress' },
    { key: 'last_scan', label: 'Last Scan' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">Vehicle Compliance Status</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search vehicles or RFID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 border-slate-200 focus-visible:ring-[#7CB342]"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={exportToCSV}
              className="border-[#7CB342] text-[#7CB342] hover:bg-[#7CB342] hover:text-white transition-all duration-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#0F172A]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition-colors"
                >
                  {col.label}
                  <SortIcon field={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {paginatedVehicles.map((vehicle, index) => {
                const isCompliant = vehicle.washes_completed >= vehicle.target;
                const progress = Math.min(100, Math.round((vehicle.washes_completed / vehicle.target) * 100));
                
                return (
                  <motion.tr
                    key={vehicle.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    onClick={() => onVehicleClick(vehicle)}
                    className={`border-b border-slate-100 cursor-pointer transition-colors hover:bg-[rgba(124,179,66,0.08)] ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    <td className="px-4 py-4 font-semibold text-slate-800">{vehicle.name}</td>
                    <td className="px-4 py-4 font-mono text-sm text-slate-500">{vehicle.rfid}</td>
                    <td className="px-4 py-4 text-slate-700">{vehicle.site_name}</td>
                    <td className="px-4 py-4 text-slate-800">{vehicle.washes_completed}</td>
                    <td className="px-4 py-4 text-slate-500">{vehicle.target}</td>
                    <td className="px-4 py-4">
                      <Badge 
                        className={`px-3 py-1 text-xs font-medium ${
                          isCompliant 
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        {isCompliant ? 'Compliant' : 'Non-Compliant'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${progress}%`,
                              background: 'linear-gradient(90deg, #7CB342 0%, #9CCC65 100%)'
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-10">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {moment(vehicle.last_scan).fromNow()}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedVehicles.length)} of {sortedVehicles.length} vehicles
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="border-slate-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(pageNum)}
                className={currentPage === pageNum ? 'bg-[#7CB342] hover:bg-[#689F38]' : 'border-slate-200'}
              >
                {pageNum}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="border-slate-200"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}