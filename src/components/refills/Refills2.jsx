import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Droplet, Calendar, MapPin } from 'lucide-react';
import moment from 'moment';

export default function Refills2({ selectedCustomer, selectedSite, dateRange }) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: refills = [], isLoading, error } = useQuery({
    queryKey: ['refills2', selectedCustomer, selectedSite, dateRange.start, dateRange.end],
    queryFn: async () => {
      const response = await base44.functions.invoke('elora_refills', {
        fromDate: dateRange.start,
        toDate: dateRange.end,
        customerRef: selectedCustomer !== 'all' ? selectedCustomer : undefined,
        siteRef: selectedSite !== 'all' ? selectedSite : undefined
      });
      return response.data || [];
    },
    retry: 1,
    staleTime: 30000,
  });

  const filteredRefills = refills.filter(refill => 
    refill.site?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    refill.customer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#7CB342] animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-600">Error loading refills data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-[#7CB342]" />
              Tank Level Monitoring
            </CardTitle>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search sites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRefills.length === 0 ? (
            <div className="text-center py-12">
              <Droplet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No refill data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Site</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Product</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Quantity (L)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Start Level (L)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRefills.map((refill, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700">
                            {moment(refill.date).format('MMM D, YYYY')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-800 font-medium">{refill.site}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600 text-sm">
                        {refill.customer}
                      </td>
                      <td className="px-4 py-4 text-slate-700 text-sm">
                        {refill.productName || 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-slate-800 font-semibold">
                          {refill.deliveredLitres ? refill.deliveredLitres.toLocaleString() : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`text-lg font-bold ${
                            refill.startLitres !== undefined && refill.startLitres !== null
                              ? refill.startLitres < 200 
                                ? 'text-red-600' 
                                : refill.startLitres < 500
                                  ? 'text-orange-500'
                                  : 'text-[#7CB342]'
                              : 'text-slate-400'
                          }`}>
                            {refill.startLitres !== undefined && refill.startLitres !== null
                              ? `${refill.startLitres}L`
                              : 'N/A'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}