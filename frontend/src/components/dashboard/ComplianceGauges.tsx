'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ComplianceScores } from '@/lib/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ComplianceGaugeProps {
  title: string;
  score: number;
  percentage: number;
  totalControls: number;
  compliantControls: number;
  size?: 'sm' | 'md' | 'lg';
}

function ComplianceGauge({ 
  title, 
  score, 
  percentage, 
  totalControls, 
  compliantControls, 
  size = 'md' 
}: ComplianceGaugeProps) {
  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-40 h-40',
    lg: 'w-48 h-48'
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#10b981'; // Green
    if (score >= 80) return '#f59e0b'; // Amber
    if (score >= 70) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    return 'Poor';
  };

  // Data for the pie chart (gauge effect)
  const data = [
    { name: 'Compliant', value: percentage, color: getScoreColor(score) },
    { name: 'Remaining', value: 100 - percentage, color: '#e5e7eb' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="text-center">
        <h4 className="text-sm font-semibold text-gray-900 mb-4 truncate" title={title}>
          {title}
        </h4>
        
        <div className="relative inline-block">
          <div className={sizeClasses[size]}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  startAngle={90}
                  endAngle={-270}
                  innerRadius="70%"
                  outerRadius="90%"
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-gray-900">
              {score.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 font-medium">
              {getScoreLabel(score)}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Compliance:</span>
            <span className="font-medium text-gray-900">{percentage.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Controls:</span>
            <span className="font-medium text-gray-900">
              {compliantControls}/{totalControls}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${percentage}%`,
                backgroundColor: getScoreColor(score)
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ComplianceGaugesProps {
  className?: string;
}

export function ComplianceGauges({ className = '' }: ComplianceGaugesProps) {
  const { data: complianceData, isLoading, error } = useQuery<ComplianceScores>({
    queryKey: ['compliance-scores'],
    queryFn: async () => {
      const response = await api.get('/api/v1/dashboard/compliance-scores');
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Overall Compliance Loading */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Framework Gauges Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
              <div className="text-center">
                <div className="h-4 bg-gray-200 rounded w-24 mx-auto mb-4"></div>
                <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-6 ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-800 font-medium">Failed to load compliance data</p>
        </div>
      </div>
    );
  }

  if (!complianceData) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Compliance Score */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Overall ISO Compliance</h3>
            <p className="text-sm text-gray-500">Aggregate score across all frameworks</p>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-600">
              {complianceData.frameworks.length} Frameworks
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { value: complianceData.overall_compliance_score, color: '#3b82f6' },
                      { value: 100 - complianceData.overall_compliance_score, color: '#e5e7eb' }
                    ]}
                    cx="50%"
                    cy="50%"
                    startAngle={90}
                    endAngle={-270}
                    innerRadius="70%"
                    outerRadius="90%"
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#e5e7eb" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-900">
                {complianceData.overall_compliance_score.toFixed(0)}
              </span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-baseline space-x-2 mb-2">
              <span className="text-3xl font-bold text-gray-900">
                {complianceData.overall_compliance_score.toFixed(1)}%
              </span>
              <span className="text-lg text-gray-500">compliant</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${complianceData.overall_compliance_score}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              Across {complianceData.frameworks.length} ISO frameworks and standards
            </p>
          </div>
        </div>
      </div>

      {/* Individual Framework Gauges */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Framework Compliance</h3>
        {complianceData.frameworks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500 font-medium">No framework data available</p>
            <p className="text-sm text-gray-400 mt-1">Complete audits to see compliance scores</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complianceData.frameworks.map((framework, index) => (
              <ComplianceGauge
                key={index}
                title={`${framework.framework_name} ${framework.framework_version}`}
                score={framework.compliance_score}
                percentage={framework.compliance_percentage}
                totalControls={framework.total_controls}
                compliantControls={framework.compliant_controls}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}