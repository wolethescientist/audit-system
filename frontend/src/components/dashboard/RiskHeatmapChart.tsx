'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { RiskHeatmapData } from '@/lib/types';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface RiskHeatmapChartProps {
  className?: string;
}

// Risk category colors based on ISO 31000 risk matrix
const getRiskColor = (likelihood: number, impact: number): string => {
  const riskRating = likelihood * impact;
  
  if (riskRating >= 20) return '#dc2626'; // Critical - Red
  if (riskRating >= 15) return '#ea580c'; // High - Orange
  if (riskRating >= 10) return '#d97706'; // Medium-High - Amber
  if (riskRating >= 6) return '#eab308';  // Medium - Yellow
  if (riskRating >= 3) return '#65a30d';  // Low-Medium - Light Green
  return '#16a34a'; // Low - Green
};

const getRiskLabel = (likelihood: number, impact: number): string => {
  const riskRating = likelihood * impact;
  
  if (riskRating >= 20) return 'Critical';
  if (riskRating >= 15) return 'High';
  if (riskRating >= 10) return 'Medium-High';
  if (riskRating >= 6) return 'Medium';
  if (riskRating >= 3) return 'Low-Medium';
  return 'Low';
};

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">
          Risk Level: {getRiskLabel(data.likelihood, data.impact)}
        </p>
        <p className="text-sm text-gray-600">
          Likelihood: {data.likelihood}/5
        </p>
        <p className="text-sm text-gray-600">
          Impact: {data.impact}/5
        </p>
        <p className="text-sm text-gray-600">
          Risk Count: {data.count}
        </p>
        <p className="text-sm text-gray-600">
          Risk Rating: {data.risk_rating}
        </p>
      </div>
    );
  }
  return null;
};

// Custom dot component for scatter plot
const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  const color = getRiskColor(payload.likelihood, payload.impact);
  const size = Math.max(8, Math.min(40, payload.count * 4)); // Scale dot size based on count
  
  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={size} 
      fill={color} 
      fillOpacity={0.8}
      stroke={color}
      strokeWidth={2}
      className="hover:fill-opacity-100 transition-all duration-200"
    />
  );
};

export function RiskHeatmapChart({ className = '' }: RiskHeatmapChartProps) {
  const { data: heatmapData, isLoading, error } = useQuery<RiskHeatmapData[]>({
    queryKey: ['risk-heatmap'],
    queryFn: async () => {
      const response = await api.get('/dashboard/risk-heatmap');
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Risk Heatmap</h3>
          <div className="animate-pulse">
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
          </div>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-500">Loading risk data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Risk Heatmap</h3>
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-600 font-medium">Failed to load risk data</p>
          </div>
        </div>
      </div>
    );
  }

  if (!heatmapData || heatmapData.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Risk Heatmap</h3>
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500 font-medium">No risk data available</p>
            <p className="text-sm text-gray-400 mt-1">Risk assessments will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate risk statistics
  const totalRisks = heatmapData.reduce((sum, item) => sum + item.count, 0);
  const criticalRisks = heatmapData.filter(item => item.risk_rating >= 20).reduce((sum, item) => sum + item.count, 0);
  const highRisks = heatmapData.filter(item => item.risk_rating >= 15 && item.risk_rating < 20).reduce((sum, item) => sum + item.count, 0);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Risk Heatmap</h3>
          <p className="text-sm text-gray-500">Likelihood × Impact Matrix (ISO 31000)</p>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Critical ({criticalRisks})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <span className="text-gray-600">High ({highRisks})</span>
          </div>
        </div>
      </div>

      <div className="h-80 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
            data={heatmapData}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              type="number" 
              dataKey="likelihood" 
              name="Likelihood"
              domain={[0.5, 5.5]}
              ticks={[1, 2, 3, 4, 5]}
              tickFormatter={(value) => {
                const labels = ['', 'Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
                return labels[value] || value;
              }}
              angle={-45}
              textAnchor="end"
              height={60}
              className="text-xs"
            />
            <YAxis 
              type="number" 
              dataKey="impact" 
              name="Impact"
              domain={[0.5, 5.5]}
              ticks={[1, 2, 3, 4, 5]}
              tickFormatter={(value) => {
                const labels = ['', 'Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'];
                return labels[value] || value;
              }}
              width={60}
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter 
              dataKey="count" 
              shape={<CustomDot />}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Matrix Legend */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 font-medium">Risk Levels:</span>
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                <span className="text-gray-600">Low (1-2)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                <span className="text-gray-600">Medium (3-9)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-1"></div>
                <span className="text-gray-600">High (10-19)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                <span className="text-gray-600">Critical (20-25)</span>
              </div>
            </div>
          </div>
          <div className="text-gray-500">
            Total Risks: {totalRisks}
          </div>
        </div>
      </div>
    </div>
  );
}