'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Eye, Edit, Trash2, Building, AlertTriangle, Star, Calendar } from 'lucide-react';
import { vendorApi } from '@/lib/api';
import VendorManagement from '@/components/vendors/VendorManagement';

interface Vendor {
  id: string;
  vendor_code: string;
  vendor_name: string;
  vendor_type?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  city?: string;
  country?: string;
  industry?: string;
  risk_rating: string;
  risk_assessment_date?: string;
  status: string;
  contract_start_date?: string;
  contract_end_date?: string;
  performance_rating?: number;
  last_evaluation_date?: string;
  created_at: string;
  updated_at: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadVendors();
  }, [typeFilter, riskFilter, statusFilter, industryFilter]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (typeFilter) params.vendor_type = typeFilter;
      if (riskFilter) params.risk_rating = riskFilter;
      if (statusFilter) params.status = statusFilter;
      if (industryFilter) params.industry = industryFilter;
      
      const data = await vendorApi.getVendors(params);
      setVendors(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    
    try {
      await vendorApi.deleteVendor(vendorId);
      await loadVendors();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete vendor');
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.vendor_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vendor.primary_contact_name && vendor.primary_contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (vendor.industry && vendor.industry.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-gray-400">No rating</span>;
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
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
          <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-600 mt-2">Manage vendors with SLA monitoring and risk assessment</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Vendor Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.length}</div>
            <p className="text-xs text-muted-foreground">
              Active: {vendors.filter(v => v.status === 'active').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Vendors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendors.filter(v => v.risk_rating === 'high' || v.risk_rating === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contracts Expiring</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendors.filter(v => {
                if (!v.contract_end_date) return false;
                const endDate = new Date(v.contract_end_date);
                const threeMonthsFromNow = new Date();
                threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
                return endDate <= threeMonthsFromNow;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Next 3 months
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Vendor Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
                <SelectItem value="service_provider">Service Provider</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
                <SelectItem value="consultant">Consultant</SelectItem>
              </SelectContent>
            </Select>

            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Risk Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Risk Levels</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
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
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Industry"
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendors ({filteredVendors.length})</CardTitle>
          <CardDescription>
            Manage vendor relationships, evaluations, and SLA monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Vendor</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Contact</th>
                  <th className="text-left p-4 font-medium">Risk Rating</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Performance</th>
                  <th className="text-left p-4 font-medium">Contract</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{vendor.vendor_name}</div>
                        <div className="text-sm text-gray-500">{vendor.vendor_code}</div>
                        {vendor.industry && (
                          <div className="text-xs text-gray-400">{vendor.industry}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {vendor.vendor_type ? (
                        <Badge variant="outline" className="capitalize">
                          {vendor.vendor_type.replace('_', ' ')}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {vendor.primary_contact_name && (
                          <div className="font-medium">{vendor.primary_contact_name}</div>
                        )}
                        {vendor.primary_contact_email && (
                          <div className="text-gray-600">{vendor.primary_contact_email}</div>
                        )}
                        {vendor.primary_contact_phone && (
                          <div className="text-gray-600">{vendor.primary_contact_phone}</div>
                        )}
                        {vendor.city && vendor.country && (
                          <div className="text-gray-500">{vendor.city}, {vendor.country}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getRiskBadgeColor(vendor.risk_rating)}>
                        {vendor.risk_rating}
                      </Badge>
                      {vendor.risk_assessment_date && (
                        <div className="text-xs text-gray-500 mt-1">
                          Assessed: {new Date(vendor.risk_assessment_date).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusBadgeColor(vendor.status)}>
                        {vendor.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {renderStars(vendor.performance_rating)}
                      {vendor.last_evaluation_date && (
                        <div className="text-xs text-gray-500 mt-1">
                          Last eval: {new Date(vendor.last_evaluation_date).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {vendor.contract_start_date && vendor.contract_end_date ? (
                        <div>
                          <div>Start: {new Date(vendor.contract_start_date).toLocaleDateString()}</div>
                          <div>End: {new Date(vendor.contract_end_date).toLocaleDateString()}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No contract dates</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedVendor(vendor)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setShowEditModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVendor(vendor.id)}
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

            {filteredVendors.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No vendors found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vendor Management Modal */}
      {(showCreateModal || showEditModal) && (
        <VendorManagement
          vendor={showEditModal ? selectedVendor : null}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedVendor(null);
          }}
          onSuccess={() => {
            loadVendors();
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedVendor(null);
          }}
        />
      )}
    </div>
  );
}