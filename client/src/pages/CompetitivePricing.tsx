import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign,
  Plane,
  BarChart3,
  AlertTriangle
} from 'lucide-react';

const CompetitivePricing = () => {
  const [selectedRoute, setSelectedRoute] = useState('LGW-BCN');

  // Fetch competitive analysis for selected route
  const { data: competitiveAnalysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['/api/competitive/analysis', selectedRoute],
    enabled: !!selectedRoute
  });

  // Fetch detailed pricing data
  const { data: pricingData, isLoading: pricingLoading } = useQuery({
    queryKey: ['/api/competitive/pricing', selectedRoute],
    enabled: !!selectedRoute
  });

  const analysis = competitiveAnalysis?.data;
  const pricing = pricingData?.data || [];

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'strong_advantage':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'advantage':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'competitive':
        return <Minus className="h-4 w-4 text-yellow-500" />;
      case 'disadvantage':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPositionBadge = (position: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      strong_advantage: 'secondary',
      advantage: 'secondary',
      competitive: 'outline',
      disadvantage: 'destructive'
    };
    return variants[position] || 'outline';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Competitive Pricing Intelligence</h1>
          <p className="text-muted-foreground">
            Real-time competitive analysis powered by infare webfare data
          </p>
        </div>
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <span className="text-sm font-medium">Route:</span>
          <Select value={selectedRoute} onValueChange={setSelectedRoute}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select route" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LGW-BCN">LGW-BCN</SelectItem>
              <SelectItem value="LGW-AMS">LGW-AMS</SelectItem>
              <SelectItem value="LGW-CDG">LGW-CDG</SelectItem>
              <SelectItem value="LGW-MAD">LGW-MAD</SelectItem>
              <SelectItem value="LGW-FCO">LGW-FCO</SelectItem>
              <SelectItem value="LGW-MXP">LGW-MXP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Competitive Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EasyJet Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{analysis?.easyjetPrice?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Including taxes & fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Average</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{analysis?.competitorAvgPrice?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Competitor average price
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Advantage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +£{analysis?.priceAdvantage?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Above market average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Rank</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              #{analysis?.priceRank || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {analysis?.competitorCount || 0} airlines
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Competitor Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Competitor Analysis - {selectedRoute}</CardTitle>
          <CardDescription>
            Detailed competitive positioning based on real market data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analysisLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Airline</TableHead>
                  <TableHead>Average Price</TableHead>
                  <TableHead>Market Share</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>vs EasyJet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis?.competitors?.map((competitor: any) => {
                  const priceDiff = competitor.avgPrice - (analysis?.easyjetPrice || 0);
                  return (
                    <TableRow key={competitor.airlineCode}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{competitor.airlineCode}</div>
                          <div className="text-sm text-muted-foreground">
                            {competitor.airlineName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          £{competitor.avgPrice?.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={competitor.marketShare} 
                            className="w-16 h-2" 
                          />
                          <span className="text-sm">
                            {competitor.marketShare?.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getPositionBadge(competitor.pricePosition)}
                          className="flex items-center w-fit space-x-1"
                        >
                          {getPositionIcon(competitor.pricePosition)}
                          <span className="capitalize">
                            {competitor.pricePosition?.replace('_', ' ')}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${
                          priceDiff > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {priceDiff > 0 ? '+' : ''}£{priceDiff.toFixed(2)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detailed Pricing Data */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Pricing Breakdown</CardTitle>
          <CardDescription>
            Flight-level pricing data from infare webfare intelligence
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pricingLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Airline</TableHead>
                  <TableHead>Flight</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Fare Basis</TableHead>
                  <TableHead>Main Price</TableHead>
                  <TableHead>Saver Price</TableHead>
                  <TableHead>Total (Inc. Tax)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricing.map((fare: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{fare.airlineCode}</div>
                        <div className="text-sm text-muted-foreground">
                          {fare.airlineName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {fare.airlineCode}{fare.flightNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {fare.searchClass}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm">{fare.fareBasis}</code>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        £{fare.mainPrice?.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-green-600 font-medium">
                        £{fare.saverPrice?.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold">
                        £{fare.priceInclTax?.toFixed(2)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitivePricing;