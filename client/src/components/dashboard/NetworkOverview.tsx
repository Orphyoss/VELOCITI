import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, TrendingUp, TrendingDown } from 'lucide-react';

export default function NetworkOverview() {
  const [timeframe, setTimeframe] = useState('7');

  const { data: routeData, isLoading } = useQuery({
    queryKey: ['/api/routes/performance', timeframe],
    queryFn: () => api.getRoutePerformance(undefined, parseInt(timeframe)),
  });

  // Calculate top and bottom performing routes from real data
  const allRoutes = (routeData as any) || [];
  console.log('NetworkOverview - routeData:', routeData, 'allRoutes:', allRoutes, 'timeframe:', timeframe);
  const sortedByPerformance = [...allRoutes].sort((a: any, b: any) => 
    parseFloat(b.avgLoadFactor || '0') - parseFloat(a.avgLoadFactor || '0')
  );
  
  const topRoutes = sortedByPerformance.slice(0, 3).map((route: any) => ({
    code: route.routeId,
    name: route.routeId,
    performance: parseFloat(route.avgLoadFactor || '0'),
    yield: parseFloat(route.avgYield || '0')
  }));

  const bottomRoutes = sortedByPerformance.slice(-3).reverse().map((route: any) => ({
    code: route.routeId,
    name: route.routeId,
    performance: parseFloat(route.avgLoadFactor || '0'),
    yield: parseFloat(route.avgYield || '0')
  }));

  const timeframes = [
    { value: '2', label: '24h' },
    { value: '7', label: '7d' },
    { value: '30', label: '30d' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPerformance = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <Card className="bg-dark-900 border-dark-800">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <CardTitle className="text-base sm:text-lg font-semibold text-dark-50 flex items-center">
            <Globe className="text-aviation-500 w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Network Performance
          </CardTitle>
          <div className="flex space-x-1 sm:space-x-2">
            {timeframes.map((tf) => (
              <Button
                key={tf.value}
                variant={timeframe === tf.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe(tf.value)}
                className={`text-xs sm:text-sm ${timeframe === tf.value 
                  ? "bg-aviation-600 text-white" 
                  : "bg-dark-800 hover:bg-dark-700 text-dark-50 border-dark-600"
                }`}
              >
                {tf.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 bg-dark-800 rounded w-1/3"></div>
                <div className="h-12 bg-dark-800 rounded"></div>
                <div className="h-12 bg-dark-800 rounded"></div>
                <div className="h-12 bg-dark-800 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-dark-800 rounded w-1/3"></div>
                <div className="h-12 bg-dark-800 rounded"></div>
                <div className="h-12 bg-dark-800 rounded"></div>
                <div className="h-12 bg-dark-800 rounded"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Top Performing Routes */}
            <div>
              <h5 className="text-xs sm:text-sm font-medium text-green-400 mb-2 flex items-center">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Top Performing Routes
              </h5>
              <div className="space-y-1.5">
                {topRoutes.map((route, index) => (
                  <div key={index} className="flex items-center justify-between bg-dark-800 rounded-lg p-2 hover:bg-dark-700 transition-colors">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-dark-50 text-sm">{route.code}</span>
                    </div>
                    <div className="text-right ml-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-green-500 border-green-500/40 bg-green-500/10 text-xs px-1.5 py-0.5">
                        {Math.round(route.performance)}%
                      </Badge>
                      <span className="text-xs text-dark-400">£{Math.round(route.yield)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Underperforming Routes */}
            <div>
              <h5 className="text-xs sm:text-sm font-medium text-red-400 mb-2 flex items-center">
                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Underperforming Routes
              </h5>
              <div className="space-y-1.5">
                {bottomRoutes.map((route, index) => (
                  <div key={index} className="flex items-center justify-between bg-dark-800 rounded-lg p-2 hover:bg-dark-700 transition-colors">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-dark-50 text-sm">{route.code}</span>
                    </div>
                    <div className="text-right ml-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-red-500 border-red-500/40 bg-red-500/10 text-xs px-1.5 py-0.5">
                        {Math.round(route.performance)}%
                      </Badge>  
                      <span className="text-xs text-dark-400">£{Math.round(route.yield)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
