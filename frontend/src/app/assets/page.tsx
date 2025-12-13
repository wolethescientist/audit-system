'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { assetApi } from '@/lib/api';
import AssetManagement from '@/components/assets/AssetManagement';

interface Asset {
  id: string;
  asset_name: string;
  asset_category: string;
  asset_type?: string;
  asset_value?: number;
  criticality_level?: string;
  procurement_date?: string;
  warranty_expiry?: string;
  owner_id?: string;
  custodian_id?: string;
  department_id?: string;
  location?: string;
  serial_number?: string;
  model?: string;
  vendor?: string;
  status: string;
  disposal_date?: string;
  disposal_value?: number;
  disposal_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface AssetReports {
  total_assets: number;
  assets_by_category: Record<string, number>;
  assets_by_status: Record<string, number>;
  assets_by_criticality: Record<string, number>;
  total_value: number;
  assets_expiring_warranty: Array<{
    id: string;
    name: string;
    warranty_expiry: string;
    days_until_expiry: number;
  }>;
  unassigned_assets: number;
  overdue_returns: number;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [reports, setReports] = useState<AssetReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [criticalityFilter, setCriticalityFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadAssets();
    loadReports();
  }, [categoryFilter, statusFilter, criticalityFilter]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (criticalityFilter) params.criticality_level = criticalityFilter;
      
      const data = await assetApi.getAssets(params);
      setAssets(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const data = await assetApi.getAssetReports();
      setReports(data);
    } catch (err: any) {
      console.error('Failed to load asset reports:', err);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    
    try {
      await assetApi.deleteAsset(assetId);
      await loadAssets();
      await loadReports();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete asset');
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.serial_number && asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (asset.model && asset.model.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'disposed': return 'bg-red-100 text-red-800';
      case 'under_maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCriticalityBadgeColor = (criticality?: string) => {
    switch (criticality) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Management</h1>
          <p className="text-gray-600 mt-2">Manage organizational assets with lifecycle tracking</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Asset Reports Summary */}
      {reports && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.total_assets}</div>
              <p className="text-xs text-muted-foreground">
                Total Value: ${reports.total_value.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unassigned Assets</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.unassigned_assets}</div>
              <p className="text-xs text-muted-foreground">
                Available for assignment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Warranties</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.assets_expiring_warranty.length}</div>
              <p className="text-xs text-muted-foreground">
                Next 90 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Returns</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.overdue_returns}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="data">Data</SelectItem>
                <SelectItem value="personnel">Personnel</SelectItem>
                <SelectItem value="facilities">Facilities</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="disposed">Disposed</SelectItem>
                <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
              </SelectContent>
            </Select>

            <Select value={criticalityFilter} onValueChange={setCriticalityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Criticality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Criticality</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assets ({filteredAssets.length})</CardTitle>
          <CardDescription>
            Manage and track organizational assets with full lifecycle information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Asset Name</th>
                  <th className="text-left p-4 font-medium">Category</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Serial Number</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Criticality</th>
                  <th className="text-left p-4 font-medium">Value</th>
                  <th className="text-left p-4 font-medium">Location</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{asset.asset_name}</div>
                        {asset.model && (
                          <div className="text-sm text-gray-500">{asset.model}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="capitalize">
                        {asset.asset_category}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {asset.asset_type || '-'}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {asset.serial_number || '-'}
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusBadgeColor(asset.status)}>
                        {asset.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {asset.criticality_level ? (
                        <Badge className={getCriticalityBadgeColor(asset.criticality_level)}>
                          {asset.criticality_level}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {asset.asset_value ? `$${asset.asset_value.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {asset.location || '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAsset(asset)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setShowEditModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAssets.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No assets found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Asset Management Modal */}
      {(showCreateModal || showEditModal) && (
        <AssetManagement
          asset={showEditModal ? selectedAsset : null}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedAsset(null);
          }}
          onSuccess={() => {
            loadAssets();
            loadReports();
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedAsset(null);
          }}
        />
      )}
    </div>
  );
}