import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle, 
  Droplet, 
  TrendingDown, 
  TrendingUp,
  Minus,
  DollarSign, 
  Calendar,
  MapPin,
  Zap,
  Filter,
  X,
  Activity,
  Target
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import moment from 'moment';

export default function RefillAnalytics({ refills, scans, sites, selectedCustomer, selectedSite }) {
  const [productFilter, setProductFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState(moment().subtract(30, 'days').format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = useState(moment().format('YYYY-MM-DD'));
  const [customerFilter, setCustomerFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  // Get unique values for filters
  const uniqueCustomers = useMemo(() => {
    const customers = new Set(refills?.map(r => r.customer) || []);
    return ['all', ...Array.from(customers).sort()];
  }, [refills]);

  const uniqueSites = useMemo(() => {
    const sites = new Set(refills?.map(r => r.site) || []);
    return ['all', ...Array.from(sites).sort()];
  }, [refills]);

  const uniqueProducts = useMemo(() => {
    const products = new Set(refills?.map(r => r.productName) || []);
    return ['all', ...Array.from(products).sort()];
  }, [refills]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(refills?.map(r => r.status) || []);
    return ['all', ...Array.from(statuses).sort()];
  }, [refills]);

  // Apply filters to refills
  const filteredRefills = useMemo(() => {
    if (!refills?.length) return [];
    
    return refills.filter(refill => {
      const refillDate = moment(refill.date);
      const matchesDate = refillDate.isBetween(dateFrom, dateTo, 'day', '[]');
      const matchesCustomer = customerFilter === 'all' || refill.customer === customerFilter;
      const matchesSite = siteFilter === 'all' || refill.site === siteFilter;
      const matchesProduct = productFilter === 'all' || refill.productName === productFilter;
      const matchesStatus = statusFilter === 'all' || refill.status === statusFilter;
      
      return matchesDate && matchesCustomer && matchesSite && matchesProduct && matchesStatus;
    });
  }, [refills, dateFrom, dateTo, customerFilter, siteFilter, productFilter, statusFilter]);

  const analysis = useMemo(() => {
    if (!filteredRefills?.length || !scans?.length) return null;

    // Group refills by site
    const refillsBySite = {};
    filteredRefills.forEach(refill => {
      const siteKey = refill.site;
      if (!refillsBySite[siteKey]) {
        refillsBySite[siteKey] = {
          site: siteKey,
          customer: refill.customer,
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

    // Calculate predictions for each site with advanced forecasting
    const predictions = [];
    Object.entries(refillsBySite).forEach(([siteName, siteData]) => {
      const siteScans = scansBySite[siteName] || [];
      const siteRefills = siteData.refills.sort((a, b) => moment(a.date).valueOf() - moment(b.date).valueOf());
      
      if (siteRefills.length < 1) return;

      // Calculate actual consumption from refill data
      const consumptionData = [];
      for (let i = 1; i < siteRefills.length; i++) {
        const prevRefill = siteRefills[i - 1];
        const currentRefill = siteRefills[i];
        
        const daysBetween = moment(currentRefill.date).diff(moment(prevRefill.date), 'days');
        
        // Actual consumption = (previous newTotalLitres - current startLitres)
        const consumed = (prevRefill.newTotalLitres || 0) - (currentRefill.startLitres || 0);
        
        if (daysBetween > 0 && consumed > 0) {
          consumptionData.push({
            days: daysBetween,
            consumed: consumed,
            dailyRate: consumed / daysBetween
          });
        }
      }

      // If we have actual consumption data, use it
      let dailyConsumption = 0;
      let avgRefillInterval = 0;
      let confidence = 100;
      
      if (consumptionData.length > 0) {
        // Calculate weighted average daily consumption (recent data weighted more)
        const weights = consumptionData.map((_, idx) => idx + 1); // More recent = higher weight
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        
        dailyConsumption = consumptionData.reduce((sum, data, idx) => 
          sum + (data.dailyRate * weights[idx]), 0
        ) / totalWeight;
        
        avgRefillInterval = consumptionData.reduce((sum, d) => sum + d.days, 0) / consumptionData.length;
        
        // Calculate consumption variance for confidence
        const avgRate = consumptionData.reduce((sum, d) => sum + d.dailyRate, 0) / consumptionData.length;
        const variance = consumptionData.reduce((sum, d) => 
          sum + Math.pow(d.dailyRate - avgRate, 2), 0
        ) / consumptionData.length;
        const coefficientOfVariation = Math.sqrt(variance) / avgRate * 100;
        
        if (coefficientOfVariation > 50) confidence -= 30;
        else if (coefficientOfVariation > 30) confidence -= 20;
        else if (coefficientOfVariation > 15) confidence -= 10;
      } else {
        // Fallback: estimate from wash scans if no consumption history
        const recentScans = siteScans.filter(s => 
          moment(s.timestamp).isAfter(moment().subtract(30, 'days'))
        );
        const ESTIMATED_LITRES_PER_WASH = 5;
        dailyConsumption = (recentScans.length / 30) * ESTIMATED_LITRES_PER_WASH;
        confidence -= 30; // Lower confidence for estimated data
        
        // Estimate interval from refill dates
        if (siteRefills.length >= 2) {
          const intervals = [];
          for (let i = 1; i < siteRefills.length; i++) {
            intervals.push(moment(siteRefills[i].date).diff(moment(siteRefills[i-1].date), 'days'));
          }
          avgRefillInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        }
      }

      // Consumption trend (last 2 periods vs previous)
      let consumptionTrend = 'stable';
      if (consumptionData.length >= 3) {
        const recentRate = (consumptionData[consumptionData.length - 1].dailyRate + 
                           consumptionData[consumptionData.length - 2].dailyRate) / 2;
        const olderRate = consumptionData.slice(0, -2).reduce((sum, d) => 
          sum + d.dailyRate, 0) / (consumptionData.length - 2);
        
        if (recentRate > olderRate * 1.15) consumptionTrend = 'increasing';
        else if (recentRate < olderRate * 0.85) consumptionTrend = 'decreasing';
      }

      // Apply trend adjustment
      const trendMultiplier = consumptionTrend === 'increasing' ? 1.1 : 
                             consumptionTrend === 'decreasing' ? 0.9 : 1.0;
      const adjustedDailyConsumption = dailyConsumption * trendMultiplier;
      
      // Predict days until refill threshold
      const REFILL_THRESHOLD = 200; // Safety threshold
      const currentStock = siteData.currentStock || 0;
      const daysUntilRefill = (currentStock - REFILL_THRESHOLD) / adjustedDailyConsumption;
      
      // Alternative prediction: based on historical interval
      const daysSinceLastRefill = moment().diff(moment(siteData.lastRefillDate), 'days');
      const historicalPrediction = avgRefillInterval > 0 ? avgRefillInterval - daysSinceLastRefill : daysUntilRefill;
      
      // Blended prediction (favor consumption-based if we have good data)
      const blendWeight = consumptionData.length >= 3 ? 0.8 : 0.5;
      const blendedDaysUntilRefill = (daysUntilRefill * blendWeight + historicalPrediction * (1 - blendWeight));
      
      // Adjust confidence based on data quality
      if (siteRefills.length < 3) confidence -= 25;
      else if (siteRefills.length < 5) confidence -= 15;
      else if (siteRefills.length < 8) confidence -= 5;
      
      if (consumptionTrend !== 'stable') confidence -= 10;
      if (currentStock === 0) confidence -= 20; // No stock data
      
      confidence = Math.max(40, Math.min(100, confidence));
      
      // Historical volume analysis
      const refillVolumes = siteRefills.map(r => r.deliveredLitres || 0);
      const avgRefillVolume = refillVolumes.reduce((a, b) => a + b, 0) / refillVolumes.length;
      
      // Calculate cost metrics
      const totalWashes = siteScans.length;
      const costPerWash = totalWashes > 0 ? siteData.totalCost / totalWashes : 0;

      // Determine urgency
      let urgency = 'good';
      if (blendedDaysUntilRefill < 3) urgency = 'critical';
      else if (blendedDaysUntilRefill < 7) urgency = 'warning';
      else if (blendedDaysUntilRefill < 14) urgency = 'attention';

      predictions.push({
        site: siteName,
        customer: siteData.customer,
        currentStock: currentStock,
        dailyConsumption: adjustedDailyConsumption.toFixed(1),
        daysUntilRefill: Math.max(0, blendedDaysUntilRefill).toFixed(0),
        predictedRefillDate: moment().add(Math.max(0, blendedDaysUntilRefill), 'days').format('MMM DD, YYYY'),
        urgency,
        confidence: Math.round(confidence),
        consumptionTrend,
        avgRefillInterval: avgRefillInterval.toFixed(0),
        avgRefillVolume: avgRefillVolume.toFixed(0),
        totalWashes: totalWashes,
        totalCost: siteData.totalCost,
        costPerWash: costPerWash.toFixed(2),
        lastRefillDate: siteData.lastRefillDate.format('MMM DD, YYYY'),
        avgWashesPerRefill: totalWashes > 0 ? (totalWashes / siteData.refills.length).toFixed(0) : '0',
        refillCount: siteData.refills.length,
        dataQuality: consumptionData.length >= 5 ? 'excellent' : 
                     consumptionData.length >= 3 ? 'good' : 
                     consumptionData.length >= 1 ? 'fair' : 'limited'
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
  }, [filteredRefills, scans, sites]);

  const handleClearFilters = () => {
    setProductFilter('all');
    setStatusFilter('all');
    setCustomerFilter('all');
    setSiteFilter('all');
    setDateFrom(moment().subtract(30, 'days').format('YYYY-MM-DD'));
    setDateTo(moment().format('YYYY-MM-DD'));
  };

  const hasActiveFilters = productFilter !== 'all' || statusFilter !== 'all' || 
    customerFilter !== 'all' || siteFilter !== 'all' ||
    dateFrom !== moment().subtract(30, 'days').format('YYYY-MM-DD') ||
    dateTo !== moment().format('YYYY-MM-DD');

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
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#7CB342]" />
              Refill Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Date Range */}
            <div>
              <label className="text-xs text-slate-600 mb-1 block">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 mb-1 block">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Customer Filter */}
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Customer</label>
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCustomers.map(customer => (
                    <SelectItem key={customer} value={customer}>
                      {customer === 'all' ? 'All Customers' : customer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Site Filter */}
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Site</label>
              <Select value={siteFilter} onValueChange={setSiteFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sites" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueSites.map(site => (
                    <SelectItem key={site} value={site}>
                      {site === 'all' ? 'All Sites' : site}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Filter */}
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Product</label>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueProducts.map(product => (
                    <SelectItem key={product} value={product}>
                      {product === 'all' ? 'All Products' : product}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueStatuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status === 'all' ? 'All Statuses' : status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Badge */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
              <Badge className="bg-[#7CB342] text-white">
                {filteredRefills.length} of {refills?.length || 0} deliveries shown
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

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
                      <div className="flex flex-col">
                        <h4 className="font-semibold">{pred.site}</h4>
                        <p className="text-xs text-slate-600">{pred.customer}</p>
                      </div>
                      <Badge className={getUrgencyColor(pred.urgency)}>
                        {pred.urgency.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Current Stock</p>
                        <p className="font-semibold">{pred.currentStock}L</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Daily Usage</p>
                        <div className="flex items-center gap-1">
                          <p className="font-semibold">{pred.dailyConsumption}L/day</p>
                          {pred.consumptionTrend === 'increasing' && <TrendingUp className="w-3 h-3 text-red-600" />}
                          {pred.consumptionTrend === 'decreasing' && <TrendingDown className="w-3 h-3 text-green-600" />}
                          {pred.consumptionTrend === 'stable' && <Minus className="w-3 h-3 text-slate-600" />}
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-600">Refill Needed In</p>
                        <p className="font-semibold">{pred.daysUntilRefill} days</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Predicted Date</p>
                        <p className="font-semibold">{pred.predictedRefillDate}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Confidence</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full transition-all"
                              style={{ 
                                width: `${pred.confidence}%`,
                                backgroundColor: pred.confidence >= 80 ? '#7CB342' : 
                                                pred.confidence >= 65 ? '#F59E0B' : '#EF4444'
                              }}
                            />
                          </div>
                          <span className="font-semibold text-xs">{pred.confidence}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional insights */}
                    <div className="mt-3 pt-3 border-t border-current/20 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-slate-600">Avg Refill Interval</p>
                        <p className="font-medium">{pred.avgRefillInterval} days</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Avg Refill Volume</p>
                        <p className="font-medium">{pred.avgRefillVolume}L</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Total Refills</p>
                        <p className="font-medium">{pred.refillCount}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Data Quality</p>
                        <Badge className={
                          pred.dataQuality === 'excellent' ? 'bg-green-100 text-green-800' :
                          pred.dataQuality === 'good' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {pred.dataQuality}
                        </Badge>
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


    </div>
  );
}