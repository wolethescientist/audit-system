'use client';

import React, { useState, useEffect } from 'react';
import { RiskMatrixData } from '@/lib/types';
import { api } from '@/lib/api';

interface RiskMatrixProps {
  auditId?: string;
  onRiskClick?: (riskId: string) => void;
  className?: string;
}

const RiskMatrix: React.FC<RiskMatrixProps> = ({
  auditId,
  onRiskClick,
  className = ''
}) => {
  const [matrixData, setMatrixData] = useState<RiskMatrixData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ likelihood: number; impact: number } | null>(null);

  useEffect(() => {
    fetchMatrixData();
  }, [auditId]);

  const fetchMatrixData = async () => {
    try {
      setLoading(true);
      const params = auditId ? { audit_id: auditId } : {};
      const response = await api.get('/api/v1/risks/matrix', { params });
      setMatrixData(response.data);
    } catch (error) {
      console.error('Failed to fetch risk matrix data:', error);
      setError('Failed to load risk matrix data');
    } finally {
      setLoading(false);
    }
  };

  const getCellData = (likelihood: number, impact: number): RiskMatrixData | null => {
    return matrixData.find(data => data.likelihood === likelihood && data.impact === impact) || null;
  };

  const getCellColor = (likelihood: number, impact: number): string => {
    const rating = likelihood * impact;
    if (rating <= 4) return 'bg-green-200 hover:bg-green-300 border-green-400';
    if (rating <= 9) return 'bg-yellow-200 hover:bg-yellow-300 border-yellow-400';
    if (rating <= 16) return 'bg-orange-200 hover:bg-orange-300 border-orange-400';
    return 'bg-red-200 hover:bg-red-300 border-red-400';
  };

  const getCellTextColor = (likelihood: number, impact: number): string => {
    const rating = likelihood * impact;
    if (rating <= 4) return 'text-green-800';
    if (rating <= 9) return 'text-yellow-800';
    if (rating <= 16) return 'text-orange-800';
    return 'text-red-800';
  };

  const getRiskCategoryLabel = (likelihood: number, impact: number): string => {
    const rating = likelihood * impact;
    if (rating <= 4) return 'LOW';
    if (rating <= 9) return 'MEDIUM';
    if (rating <= 16) return 'HIGH';
    return 'CRITICAL';
  };

  const handleCellClick = (likelihood: number, impact: number) => {
    const cellData = getCellData(likelihood, impact);
    if (cellData && cellData.count > 0) {
      setSelectedCell({ likelihood, impact });
    }
  };

  const handleRiskClick = (riskId: string) => {
    if (onRiskClick) {
      onRiskClick(riskId);
    }
    setSelectedCell(null);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading risk matrix...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-red-600 text-center">
          <p className="font-medium">Error loading risk matrix</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchMatrixData}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Risk Matrix</h3>
        <p className="text-gray-600">ISO 31000 Compliant Likelihood × Impact Analysis</p>
      </div>

      {/* Legend */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-200 border border-green-400 rounded mr-2"></div>
          <span className="text-sm text-gray-700">Low (1-4)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded mr-2"></div>
          <span className="text-sm text-gray-700">Medium (5-9)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-orange-200 border border-orange-400 rounded mr-2"></div>
          <span className="text-sm text-gray-700">High (10-16)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-200 border border-red-400 rounded mr-2"></div>
          <span className="text-sm text-gray-700">Critical (17-25)</span>
        </div>
      </div>

      {/* Risk Matrix Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-20 h-12 text-center text-sm font-medium text-gray-700 border border-gray-300">
                  Impact →<br />Likelihood ↓
                </th>
                {[1, 2, 3, 4, 5].map(impact => (
                  <th key={impact} className="w-24 h-12 text-center text-sm font-medium text-gray-700 border border-gray-300">
                    {impact}<br />
                    <span className="text-xs text-gray-500">
                      {impact === 1 ? 'Insignificant' :
                       impact === 2 ? 'Minor' :
                       impact === 3 ? 'Moderate' :
                       impact === 4 ? 'Major' : 'Catastrophic'}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[5, 4, 3, 2, 1].map(likelihood => (
                <tr key={likelihood}>
                  <td className="w-20 h-16 text-center text-sm font-medium text-gray-700 border border-gray-300 bg-gray-50">
                    {likelihood}<br />
                    <span className="text-xs text-gray-500">
                      {likelihood === 1 ? 'Rare' :
                       likelihood === 2 ? 'Unlikely' :
                       likelihood === 3 ? 'Possible' :
                       likelihood === 4 ? 'Likely' : 'Almost Certain'}
                    </span>
                  </td>
                  {[1, 2, 3, 4, 5].map(impact => {
                    const cellData = getCellData(likelihood, impact);
                    const rating = likelihood * impact;
                    const hasRisks = cellData && cellData.count > 0;
                    
                    return (
                      <td
                        key={`${likelihood}-${impact}`}
                        className={`w-24 h-16 text-center border border-gray-300 cursor-pointer transition-colors ${getCellColor(likelihood, impact)} ${getCellTextColor(likelihood, impact)}`}
                        onClick={() => handleCellClick(likelihood, impact)}
                        title={hasRisks ? `${cellData.count} risk(s) - Click to view details` : `Risk Rating: ${rating} (${getRiskCategoryLabel(likelihood, impact)})`}
                      >
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="text-lg font-bold">{rating}</div>
                          {hasRisks && (
                            <div className="text-xs">
                              {cellData.count} risk{cellData.count !== 1 ? 's' : ''}
                            </div>
                          )}
                          <div className="text-xs font-medium">
                            {getRiskCategoryLabel(likelihood, impact)}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Details Modal */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-gray-900">
                Risks (L:{selectedCell.likelihood} × I:{selectedCell.impact})
              </h4>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {(() => {
              const cellData = getCellData(selectedCell.likelihood, selectedCell.impact);
              if (!cellData || cellData.count === 0) {
                return <p className="text-gray-600">No risks in this category.</p>;
              }
              
              return (
                <div className="space-y-3">
                  {cellData.risks.map(risk => (
                    <div
                      key={risk.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRiskClick(risk.id)}
                    >
                      <div className="font-medium text-gray-900">{risk.title}</div>
                      <div className="text-sm text-gray-600">
                        Rating: {risk.risk_rating} | Status: {risk.status}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-green-800">
            {matrixData.filter(d => d.risk_rating <= 4).reduce((sum, d) => sum + d.count, 0)}
          </div>
          <div className="text-sm text-green-600">Low Risks</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-yellow-800">
            {matrixData.filter(d => d.risk_rating >= 5 && d.risk_rating <= 9).reduce((sum, d) => sum + d.count, 0)}
          </div>
          <div className="text-sm text-yellow-600">Medium Risks</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-orange-800">
            {matrixData.filter(d => d.risk_rating >= 10 && d.risk_rating <= 16).reduce((sum, d) => sum + d.count, 0)}
          </div>
          <div className="text-sm text-orange-600">High Risks</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-red-800">
            {matrixData.filter(d => d.risk_rating >= 17).reduce((sum, d) => sum + d.count, 0)}
          </div>
          <div className="text-sm text-red-600">Critical Risks</div>
        </div>
      </div>
    </div>
  );
};

export default RiskMatrix;