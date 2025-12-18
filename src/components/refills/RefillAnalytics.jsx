import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Droplet, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  MapPin,
  Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import moment from 'moment';

export default function RefillAnalytics({ refills, scans, sites, selectedCustomer, selectedSite }) {
  const analysis = useMemo(() => {
    if (!refills?.length || !scans?.length) return null;

    // Group refills by site
    const refillsBySite = {};
    refills.forEach(refill => {
      const siteKey = refill.site;
      if (!refillsBySite[siteKey]) {
        refillsBySite[siteKey] = {
          site: siteKey,
          refills: [],
          totalLitres: 0,
          totalCost: 0,
          lastRefillDate: null,
          currentStock: 0
        };
      }
      refillsBySite[siteKey].refills.push(refill);
      refillsBySite[siteKey].totalLitres += refill.deliveredLitres || 0;
      refillsBySite[siteKey].totalCost += refill.totalExGst || 0;
      
      const refillDate = moment(refill.date);
      if (!refillsBySite[siteKey].lastRefillDate || refillDate.isAfter(refillsBySite[siteKey].lastRefillDate)) {
        refillsBySite[siteKey].lastRefillDate = refillDate;
        refillsBySite[siteKey].currentStock = refill.newTotalLitres || 0;
      }
    });

    // Group scans by site
    const scansBySite = {};
    scans.forEach(scan => {
      const siteName = scan.site_name || scan.siteName;
      if (!scansBySite[siteName]) {
        scansBySite[siteName] = [];
      }
      scansBySite[siteName].push(scan);
    });

    // Calculate predictions for each site
    const predictions = [];
    Object.entries(refillsBySite).forEach(([siteName, siteData]) => {
      const siteScans = scansBySite[siteName] || [];
      
      if (siteScans.length === 0) return;

      // Calculate daily consumption rate (assuming 5L per wash average)
      const LITRES_PER_WASH = 5;
      const recentScans = siteScans.filter(s => 
        moment(s.timestamp).isAfter(moment().subtract(30, 'days'))
      );
      const dailyWashes = recentScans.length / 30;
      const dailyConsumption = dailyWashes * LITRES_PER_WASH;

      // Predict days until refill needed (assuming 200L threshold)
      const REFILL_THRESHOLD = 200;
      const daysUntilRefill = (siteData.currentStock - REFILL_THRESHOLD) / dailyConsumption;

      // Calculate cost per wash
      const totalWashes = siteScans.length;
      const costPerWash = totalWashes > 0 ? siteData.totalCost / totalWashes : 0;

      // Determine urgency
      let urgency = 'good';
      if (daysUntilRefill < 3) urgency = 'critical';
      else if (daysUntilRefill < 7) urgency = 'warning';
      else if (daysUntilRefill < 14) urgency = 'attention';

      predictions.push({
        site: siteName,
        currentStock: siteData.currentStock,
        dailyConsumption: dailyConsumption.toFixed(1),
        daysUntilRefill: Math.max(0, daysUntilRefill).toFixed(0),
        predictedRefillDate: moment().add(daysUntilRefill, 'days').format('MMM DD'),
        urgency,
        totalWashes: totalWashes,
        totalCost: siteData.totalCost,
        costPerWash: costPerWash.toFixed(2),
        lastRefillDate: siteData.lastRefillDate.format('MMM DD, YYYY'),
        avgWashesPerRefill: (totalWashes / siteData.refills.length).toFixed(0),
        refillCount: siteData.refills.length
      });
    });

    // Sort by urgency
    predictions.sort((a, b) => {
      const urgencyOrder = { critical: 0, warning: 1, attention: 2, good: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });

    // Smart scheduling - group sites needing refills within same week
    const scheduleGroups = [];
    const weekGroups = {};
    predictions.filter(p => p.urgency !== 'good').forEach(pred => {
      const weekKey = moment().add(pred.daysUntilRefill, 'days').week();
      if (!weekGroups[weekKey]) {
        weekGroups[weekKey] = {
          week: moment().add(pred.daysUntilRefill, 'days').format('MMM DD'),
          sites: []
        };
      }
      weekGroups[weekKey].sites.push(pred.site);
    });
    Object.values(weekGroups).forEach(group => {
      if (group.sites.length > 1) {
        scheduleGroups.push(group);
      }
    });

    // Cost efficiency ranking
    const costEfficiency = [...predictions]
      .filter(p => p.totalWashes > 10)
      .sort((a, b) => parseFloat(a.costPerWash) - parseFloat(b.costPerWash));

    return {
      predictions,
      scheduleGroups,
      costEfficiency: costEfficiency.slice(0, 5),
      totalSites: predictions.length,
      criticalSites: predictions.filter(p => p.urgency === 'critical').length,
      warningSites: predictions.filter(p => p.urgency === 'warning').length
    };
  }, [refills, scans, sites]);

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-[#7CB342]" />
            Refill Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">No refill data available for analysis.</p>
        </CardContent>
      </Card>
    );
  }

  const getUrgencyColor = (urgency) => {
    switch(urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'warning': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'attention': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Critical Sites</p>
                <p className="text-3xl font-bold text-red-600">{analysis.criticalSites}</p>
                <p className="text-xs text-slate-500 mt-1">Need refill within 3 days</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Attention Needed</p>
                <p className="text-3xl font-bold text-orange-600">{analysis.warningSites}</p>
                <p className="text-xs text-slate-500 mt-1">Within 7 days</p>
              </div>
              <Calendar className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Monitored</p>
                <p className="text-3xl font-bold text-[#7CB342]">{analysis.totalSites}</p>
                <p className="text-xs text-slate-500 mt-1">Active sites</p>
              </div>
              <Droplet className="w-10 h-10 text-[#7CB342] opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predictive Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#7CB342]" />
            Predictive Refill Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.predictions.slice(0, 8).map((pred, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-lg border-2 ${getUrgencyColor(pred.urgency)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" />
                      <h4 className="font-semibold">{pred.site}</h4>
                      <Badge className={getUrgencyColor(pred.urgency)}>
                        {pred.urgency.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Current Stock</p>
                        <p className="font-semibold">{pred.currentStock}L</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Daily Usage</p>
                        <p className="font-semibold">{pred.dailyConsumption}L/day</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Refill Needed In</p>
                        <p className="font-semibold">{pred.daysUntilRefill} days</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Predicted Date</p>
                        <p className="font-semibold">{pred.predictedRefillDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Smart Scheduling */}
      {analysis.scheduleGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#7CB342]" />
              Smart Route Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Batch these sites together to optimize delivery routes:
            </p>
            <div className="space-y-3">
              {analysis.scheduleGroups.map((group, idx) => (
                <div key={idx} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <p className="font-semibold text-blue-900">Week of {group.week}</p>
                    <Badge className="bg-blue-600 text-white">
                      {group.sites.length} sites
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-800">
                    {group.sites.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Per Wash Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#7CB342]" />
            Cost Efficiency Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analysis.costEfficiency}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="site" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: 'Cost per Wash ($)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                <Tooltip formatter={(value) => `$${value}`} />
                <Bar dataKey="costPerWash" fill="#7CB342" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.costEfficiency.slice(0, 5).map((site, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-800">{site.site}</h4>
                    <Badge className="bg-[#7CB342] text-white">
                      #{idx + 1}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-slate-600">Cost/Wash</p>
                      <p className="font-semibold text-[#7CB342]">${site.costPerWash}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Total Washes</p>
                      <p className="font-semibold">{site.totalWashes}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Total Cost</p>
                      <p className="font-semibold">${site.totalCost.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}