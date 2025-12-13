'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, Package, User, Calendar, DollarSign, MapPin, AlertTriangle, History } from 'lucide-react';
import { assetApi } from '@/lib/api';

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

interface AssetAssignment {
  id: string;
  asset_id: string;
  user_id: string;
  assigned_by_id?: string;
  assigned_date: string;
  expected_return_date?: string;
  returned_date?: string;
  assignment_purpose?: string;
  assignment_notes?: string;
  return_condition?: string;
  return_notes?: string;
  is_active: boolean;
  created_at: string;
}

interface AssetManagementProps {
  asset?: Asset | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssetManagement({ asset, onClose, onSuccess }: AssetManagementProps) {
  const [formData, setFormData] = useState({
    asset_name: '',
    asset_category: '',
    asset_type: '',
    asset_value: '',
    criticality_level: '',
    procurement_date: '',
    warranty_expiry: '',
    owner_id: '',
    custodian_id: '',
    department_id: '',
    location: '',
    serial_number: '',
    model: '',
    vendor: '',
    status: 'active',
    disposal_date: '',
    disposal_value: '',
    disposal_method: '',
    notes: ''
  });

  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    user_id: '',
    assignment_purpose: '',
    assignment_notes: '',
    expected_return_date: ''
  });

  useEffect(() => {
    if (asset) {
      setFormData({
        asset_name: asset.asset_name || '',
        asset_category: asset.asset_category || '',
        asset_type: asset.asset_type || '',
        asset_value: asset.asset_value?.toString() || '',
        criticality_level: asset.criticality_level || '',
        procurement_date: asset.procurement_date ? asset.procurement_date.split('T')[0] : '',
        warranty_expiry: asset.warranty_expiry ? asset.warranty_expiry.split('T')[0] : '',
        owner_id: asset.owner_id || '',
        custodian_id: asset.custodian_id || '',
        department_id: asset.department_id || '',
        location: asset.location || '',
        serial_number: asset.serial_number || '',
        model: asset.model || '',
        vendor: asset.vendor || '',
        status: asset.status || 'active',
        disposal_date: asset.disposal_date ? asset.disposal_date.split('T')[0] : '',
        disposal_value: asset.disposal_value?.toString() || '',
        disposal_method: asset.disposal_method || '',
        notes: asset.notes || ''
      });
      loadAssetAssignments();
      loadAssetRisks();
    }
  }, [asset]);

  const loadAssetAssignments = async () => {
    if (!asset) return;
    
    try {
      const data = await assetApi.getAssetAssignments(asset.id, true);
      setAssignments(data);
    } catch (err: any) {
      console.error('Failed to load asset assignments:', err);
    }
  };

  const loadAssetRisks = async () => {
    if (!asset) return;
    
    try {
      const data = await assetApi.getAssetRisks(asset.id);
      setRisks(data);
    } catch (err: any) {
      console.error('Failed to load asset risks:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        asset_value: formData.asset_value ? parseFloat(formData.asset_value) : null,
        disposal_value: formData.disposal_value ? parseFloat(formData.disposal_value) : null,
        procurement_date: formData.procurement_date || null,
        warranty_expiry: formData.warranty_expiry || null,
        disposal_date: formData.disposal_date || null,
      };

      if (asset) {
        await assetApi.updateAsset(asset.id, submitData);
      } else {
        await assetApi.createAsset(submitData);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAsset = async () => {
    if (!asset) return;
    
    try {
      await assetApi.assignAsset(asset.id, {
        ...assignmentData,
        expected_return_date: assignmentData.expected_return_date || null
      });
      setShowAssignModal(false);
      setAssignmentData({
        user_id: '',
        assignment_purpose: '',
        assignment_notes: '',
        expected_return_date: ''
      });
      await loadAssetAssignments();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to assign asset');
    }
  };

  const handleReturnAsset = async (assignmentId: string) => {
    if (!asset) return;
    
    const returnCondition = prompt('Enter return condition:');
    const returnNotes = prompt('Enter return notes (optional):');
    
    try {
      await assetApi.returnAsset(asset.id, assignmentId, {
        return_condition: returnCondition,
        return_notes: returnNotes || ''
      });
      await loadAssetAssignments();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to return asset');
    }
  };

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {asset ? 'Edit Asset' : 'Create New Asset'}
            </h2>
            <p className="text-gray-600 mt-1">
              {asset ? 'Update asset information and manage lifecycle' : 'Add a new asset to the inventory'}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        {error && (
          <Alert className="m-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="h-4 w-4 inline mr-2" />
              Asset Details
            </button>
            {asset && (
              <>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'assignments'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <User className="h-4 w-4 inline mr-2" />
                  Assignments ({assignments.filter(a => a.is_active).length})
                </button>
                <button
                  onClick={() => setActiveTab('risks')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'risks'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  Risk Assessments ({risks.length})
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Asset Name *
                    </label>
                    <Input
                      value={formData.asset_name}
                      onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                      placeholder="Enter asset name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <Select
                      value={formData.asset_category}
                      onValueChange={(value) => setFormData({ ...formData, asset_category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hardware">Hardware</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="data">Data</SelectItem>
                        <SelectItem value="personnel">Personnel</SelectItem>
                        <SelectItem value="facilities">Facilities</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Asset Type
                    </label>
                    <Input
                      value={formData.asset_type}
                      onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                      placeholder="e.g., Server, Laptop, Database"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Criticality Level
                    </label>
                    <Select
                      value={formData.criticality_level}
                      onValueChange={(value) => setFormData({ ...formData, criticality_level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select criticality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                        <SelectItem value="disposed">Disposed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Technical Details</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Serial Number
                    </label>
                    <Input
                      value={formData.serial_number}
                      onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                      placeholder="Enter serial number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model
                    </label>
                    <Input
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="Enter model"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor
                    </label>
                    <Input
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      placeholder="Enter vendor name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Enter location"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Asset Value ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.asset_value}
                      onChange={(e) => setFormData({ ...formData, asset_value: e.target.value })}
                      placeholder="Enter asset value"
                    />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Procurement Date
                  </label>
                  <Input
                    type="date"
                    value={formData.procurement_date}
                    onChange={(e) => setFormData({ ...formData, procurement_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty Expiry
                  </label>
                  <Input
                    type="date"
                    value={formData.warranty_expiry}
                    onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                  />
                </div>
              </div>

              {/* Disposal Information (if status is disposed) */}
              {formData.status === 'disposed' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Disposal Date
                    </label>
                    <Input
                      type="date"
                      value={formData.disposal_date}
                      onChange={(e) => setFormData({ ...formData, disposal_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Disposal Value ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.disposal_value}
                      onChange={(e) => setFormData({ ...formData, disposal_value: e.target.value })}
                      placeholder="Enter disposal value"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Disposal Method
                    </label>
                    <Input
                      value={formData.disposal_method}
                      onChange={(e) => setFormData({ ...formData, disposal_method: e.target.value })}
                      placeholder="e.g., Sale, Donation, Recycling"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter additional notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {asset ? 'Update Asset' : 'Create Asset'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'assignments' && asset && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Asset Assignments</h3>
                <Button onClick={() => setShowAssignModal(true)}>
                  <User className="h-4 w-4 mr-2" />
                  Assign Asset
                </Button>
              </div>

              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className={assignment.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {assignment.is_active ? 'Active' : 'Returned'}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              User ID: {assignment.user_id}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}</div>
                            {assignment.expected_return_date && (
                              <div>Expected Return: {new Date(assignment.expected_return_date).toLocaleDateString()}</div>
                            )}
                            {assignment.returned_date && (
                              <div>Returned: {new Date(assignment.returned_date).toLocaleDateString()}</div>
                            )}
                          </div>
                          {assignment.assignment_purpose && (
                            <div className="text-sm">
                              <strong>Purpose:</strong> {assignment.assignment_purpose}
                            </div>
                          )}
                          {assignment.return_condition && (
                            <div className="text-sm">
                              <strong>Return Condition:</strong> {assignment.return_condition}
                            </div>
                          )}
                        </div>
                        {assignment.is_active && (
                          <Button
                            size="sm"
                            onClick={() => handleReturnAsset(assignment.id)}
                          >
                            Return Asset
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {assignments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No assignments found for this asset
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'risks' && asset && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Risk Assessments</h3>

              <div className="space-y-4">
                {risks.map((risk) => (
                  <Card key={risk.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{risk.risk_title}</h4>
                            <Badge className={getCriticalityBadgeColor(risk.risk_category)}>
                              {risk.risk_category}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>Risk Rating: {risk.risk_rating}/25</div>
                            <div>Likelihood: {risk.likelihood_score}/5 | Impact: {risk.impact_score}/5</div>
                            <div>Status: {risk.status}</div>
                            <div>Created: {new Date(risk.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {risks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No risk assessments found for this asset
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Assignment Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Asset</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User ID *
                  </label>
                  <Input
                    value={assignmentData.user_id}
                    onChange={(e) => setAssignmentData({ ...assignmentData, user_id: e.target.value })}
                    placeholder="Enter user ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Purpose
                  </label>
                  <Input
                    value={assignmentData.assignment_purpose}
                    onChange={(e) => setAssignmentData({ ...assignmentData, assignment_purpose: e.target.value })}
                    placeholder="Enter purpose"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Return Date
                  </label>
                  <Input
                    type="date"
                    value={assignmentData.expected_return_date}
                    onChange={(e) => setAssignmentData({ ...assignmentData, expected_return_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={assignmentData.assignment_notes}
                    onChange={(e) => setAssignmentData({ ...assignmentData, assignment_notes: e.target.value })}
                    placeholder="Enter assignment notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <Button variant="outline" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignAsset}>
                  Assign Asset
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}