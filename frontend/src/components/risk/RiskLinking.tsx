'use client';

import React, { useState, useEffect } from 'react';
import { Asset, AuditFinding, RiskLinkingRequest } from '@/lib/types';
import { api } from '@/lib/api';

interface RiskLinkingProps {
  riskId: string;
  auditId?: string;
  onLinkingComplete?: (linkedEntities: any) => void;
  className?: string;
}

interface CAPAItem {
  id: string;
  capa_number: string;
  title: string;
  status: string;
  capa_type: string;
  due_date?: string;
}

const RiskLinking: React.FC<RiskLinkingProps> = ({
  riskId,
  auditId,
  onLinkingComplete,
  className = ''
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [capaItems, setCapaItems] = useState<CAPAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedFindings, setSelectedFindings] = useState<string[]>([]);
  const [selectedCapaItems, setSelectedCapaItems] = useState<string[]>([]);

  const [searchTerms, setSearchTerms] = useState({
    assets: '',
    findings: '',
    capa: ''
  });

  useEffect(() => {
    fetchData();
  }, [auditId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAssets(),
        fetchFindings(),
        fetchCapaItems()
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load linking data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await api.get('/api/v1/assets');
      setAssets(response.data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    }
  };

  const fetchFindings = async () => {
    try {
      const params = auditId ? { audit_id: auditId } : {};
      const response = await api.get('/audits/findings', { params });
      setFindings(response.data);
    } catch (error) {
      console.error('Failed to fetch findings:', error);
    }
  };

  const fetchCapaItems = async () => {
    try {
      const params = auditId ? { audit_id: auditId } : {};
      const response = await api.get('/api/v1/capa', { params });
      setCapaItems(response.data);
    } catch (error) {
      console.error('Failed to fetch CAPA items:', error);
    }
  };

  const handleAssetToggle = (assetId: string) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleFindingToggle = (findingId: string) => {
    setSelectedFindings(prev => 
      prev.includes(findingId) 
        ? prev.filter(id => id !== findingId)
        : [...prev, findingId]
    );
  };

  const handleCapaToggle = (capaId: string) => {
    setSelectedCapaItems(prev => 
      prev.includes(capaId) 
        ? prev.filter(id => id !== capaId)
        : [...prev, capaId]
    );
  };

  const handleLinkEntities = async () => {
    try {
      setLinking(true);
      
      const linkingData: RiskLinkingRequest = {
        asset_ids: selectedAssets.length > 0 ? selectedAssets : undefined,
        finding_ids: selectedFindings.length > 0 ? selectedFindings : undefined,
        capa_ids: selectedCapaItems.length > 0 ? selectedCapaItems : undefined
      };

      const response = await api.post(`/api/v1/risks/${riskId}/link`, linkingData);
      
      if (onLinkingComplete) {
        onLinkingComplete(response.data.linked_entities);
      }

      // Reset selections
      setSelectedAssets([]);
      setSelectedFindings([]);
      setSelectedCapaItems([]);
      
    } catch (error) {
      console.error('Failed to link entities:', error);
      setError('Failed to link entities to risk');
    } finally {
      setLinking(false);
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.asset_name.toLowerCase().includes(searchTerms.assets.toLowerCase()) ||
    asset.asset_category.toLowerCase().includes(searchTerms.assets.toLowerCase())
  );

  const filteredFindings = findings.filter(finding =>
    finding.title.toLowerCase().includes(searchTerms.findings.toLowerCase()) ||
    finding.severity.toLowerCase().includes(searchTerms.findings.toLowerCase())
  );

  const filteredCapaItems = capaItems.filter(capa =>
    capa.title.toLowerCase().includes(searchTerms.capa.toLowerCase()) ||
    capa.capa_number.toLowerCase().includes(searchTerms.capa.toLowerCase())
  );

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-32 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading entities...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 text-center p-4 ${className}`}>
        <p className="font-medium">Error loading entities</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const hasSelections = selectedAssets.length > 0 || selectedFindings.length > 0 || selectedCapaItems.length > 0;

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Link Risk to Entities</h3>
          <p className="text-gray-600">Associate this risk with related assets, findings, and CAPA items</p>
        </div>

        {/* Action Button */}
        {hasSelections && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-800">
                Selected: {selectedAssets.length} assets, {selectedFindings.length} findings, {selectedCapaItems.length} CAPA items
              </div>
              <button
                onClick={handleLinkEntities}
                disabled={linking}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {linking ? 'Linking...' : 'Link Selected Entities'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Assets Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900">Assets</h4>
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchTerms.assets}
                  onChange={(e) => setSearchTerms(prev => ({ ...prev, assets: e.target.value }))}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredAssets.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No assets found</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredAssets.map(asset => (
                    <div
                      key={asset.id}
                      className={`p-3 hover:bg-gray-50 cursor-pointer ${
                        selectedAssets.includes(asset.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => handleAssetToggle(asset.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedAssets.includes(asset.id)}
                            onChange={() => handleAssetToggle(asset.id)}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{asset.asset_name}</div>
                            <div className="text-sm text-gray-600">{asset.asset_category}</div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(asset.status)}`}>
                          {asset.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Findings Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900">Audit Findings</h4>
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Search findings..."
                  value={searchTerms.findings}
                  onChange={(e) => setSearchTerms(prev => ({ ...prev, findings: e.target.value }))}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredFindings.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No findings found</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredFindings.map(finding => (
                    <div
                      key={finding.id}
                      className={`p-3 hover:bg-gray-50 cursor-pointer ${
                        selectedFindings.includes(finding.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => handleFindingToggle(finding.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedFindings.includes(finding.id)}
                            onChange={() => handleFindingToggle(finding.id)}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{finding.title}</div>
                            <div className="text-sm text-gray-600">Status: {finding.status}</div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded border ${getSeverityColor(finding.severity)}`}>
                          {finding.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CAPA Items Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900">CAPA Items</h4>
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Search CAPA items..."
                  value={searchTerms.capa}
                  onChange={(e) => setSearchTerms(prev => ({ ...prev, capa: e.target.value }))}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredCapaItems.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No CAPA items found</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredCapaItems.map(capa => (
                    <div
                      key={capa.id}
                      className={`p-3 hover:bg-gray-50 cursor-pointer ${
                        selectedCapaItems.includes(capa.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => handleCapaToggle(capa.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedCapaItems.includes(capa.id)}
                            onChange={() => handleCapaToggle(capa.id)}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{capa.capa_number}</div>
                            <div className="text-sm text-gray-600">{capa.title}</div>
                            <div className="text-xs text-gray-500">Type: {capa.capa_type}</div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(capa.status)}`}>
                          {capa.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {!hasSelections && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
            Select entities above to link them to this risk assessment
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskLinking;