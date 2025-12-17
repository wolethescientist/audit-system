'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, Building, User, Calendar, DollarSign, MapPin, AlertTriangle, Star, FileText } from 'lucide-react';
import { vendorApi } from '@/lib/api';

interface Vendor {
  id: string;
  vendor_code: string;
  vendor_name: string;
  vendor_type?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  secondary_contact_name?: string;
  secondary_contact_email?: string;
  secondary_contact_phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  business_registration_number?: string;
  tax_identification_number?: string;
  website?: string;
  industry?: string;
  risk_rating: string;
  risk_assessment_date?: string;
  risk_notes?: string;
  status: string;
  onboarding_date?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  iso_certifications?: string[];
  other_certifications?: string[];
  insurance_coverage?: number;
  insurance_expiry?: string;
  performance_rating?: number;
  last_evaluation_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface VendorEvaluation {
  id: string;
  vendor_id: string;
  evaluation_type: string;
  evaluation_period_start?: string;
  evaluation_period_end?: string;
  overall_score?: number;
  evaluation_result?: string;
  quality_score?: number;
  delivery_score?: number;
  cost_score?: number;
  service_score?: number;
  compliance_score?: number;
  strengths?: string;
  weaknesses?: string;
  recommendations?: string;
  evaluation_date: string;
  next_evaluation_date?: string;
}

interface VendorSLA {
  id: string;
  vendor_id: string;
  sla_name: string;
  sla_type?: string;
  service_description?: string;
  availability_target?: number;
  response_time_target?: number;
  resolution_time_target?: number;
  start_date: string;
  end_date?: string;
  status: string;
  compliance_status: string;
}

interface VendorManagementProps {
  vendor?: Vendor | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VendorManagement({ vendor, onClose, onSuccess }: VendorManagementProps) {
  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_type: '',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    secondary_contact_name: '',
    secondary_contact_email: '',
    secondary_contact_phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: '',
    business_registration_number: '',
    tax_identification_number: '',
    website: '',
    industry: '',
    risk_rating: 'MEDIUM',
    status: 'active',
    contract_start_date: '',
    contract_end_date: '',
    iso_certifications: [] as string[],
    other_certifications: [] as string[],
    insurance_coverage: '',
    insurance_expiry: '',
    performance_rating: '',
    notes: ''
  });

  const [evaluations, setEvaluations] = useState<VendorEvaluation[]>([]);
  const [slas, setSlas] = useState<VendorSLA[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showSLAModal, setShowSLAModal] = useState(false);
  const [newCertification, setNewCertification] = useState('');
  const [certificationType, setCertificationType] = useState<'iso' | 'other'>('iso');

  const [evaluationData, setEvaluationData] = useState({
    evaluation_type: 'periodic',
    evaluation_period_start: '',
    evaluation_period_end: '',
    overall_score: '',
    quality_score: '',
    delivery_score: '',
    cost_score: '',
    service_score: '',
    compliance_score: '',
    strengths: '',
    weaknesses: '',
    recommendations: '',
    next_evaluation_date: ''
  });

  const [slaData, setSlaData] = useState({
    sla_name: '',
    sla_type: 'service_level',
    service_description: '',
    availability_target: '',
    response_time_target: '',
    resolution_time_target: '',
    start_date: '',
    end_date: '',
    auto_renewal: false
  });

  useEffect(() => {
    if (vendor) {
      setFormData({
        vendor_name: vendor.vendor_name || '',
        vendor_type: vendor.vendor_type || '',
        primary_contact_name: vendor.primary_contact_name || '',
        primary_contact_email: vendor.primary_contact_email || '',
        primary_contact_phone: vendor.primary_contact_phone || '',
        secondary_contact_name: vendor.secondary_contact_name || '',
        secondary_contact_email: vendor.secondary_contact_email || '',
        secondary_contact_phone: vendor.secondary_contact_phone || '',
        address_line1: vendor.address_line1 || '',
        address_line2: vendor.address_line2 || '',
        city: vendor.city || '',
        state_province: vendor.state_province || '',
        postal_code: vendor.postal_code || '',
        country: vendor.country || '',
        business_registration_number: vendor.business_registration_number || '',
        tax_identification_number: vendor.tax_identification_number || '',
        website: vendor.website || '',
        industry: vendor.industry || '',
        risk_rating: vendor.risk_rating || 'MEDIUM',
        status: vendor.status || 'active',
        contract_start_date: vendor.contract_start_date ? vendor.contract_start_date.split('T')[0] : '',
        contract_end_date: vendor.contract_end_date ? vendor.contract_end_date.split('T')[0] : '',
        iso_certifications: vendor.iso_certifications || [],
        other_certifications: vendor.other_certifications || [],
        insurance_coverage: vendor.insurance_coverage?.toString() || '',
        insurance_expiry: vendor.insurance_expiry ? vendor.insurance_expiry.split('T')[0] : '',
        performance_rating: vendor.performance_rating?.toString() || '',
        notes: vendor.notes || ''
      });
      loadVendorEvaluations();
      loadVendorSLAs();
    }
  }, [vendor]);

  const loadVendorEvaluations = async () => {
    if (!vendor) return;
    
    try {
      const data = await vendorApi.getVendorEvaluations(vendor.id);
      setEvaluations(data);
    } catch (err: any) {
      console.error('Failed to load vendor evaluations:', err);
    }
  };

  const loadVendorSLAs = async () => {
    if (!vendor) return;
    
    try {
      const data = await vendorApi.getVendorSLAs(vendor.id);
      setSlas(data);
    } catch (err: any) {
      console.error('Failed to load vendor SLAs:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        insurance_coverage: formData.insurance_coverage ? parseFloat(formData.insurance_coverage) : null,
        performance_rating: formData.performance_rating ? parseInt(formData.performance_rating) : null,
        contract_start_date: formData.contract_start_date || null,
        contract_end_date: formData.contract_end_date || null,
        insurance_expiry: formData.insurance_expiry || null,
      };

      if (vendor) {
        await vendorApi.updateVendor(vendor.id, submitData);
      } else {
        await vendorApi.createVendor(submitData);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save vendor');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvaluation = async () => {
    if (!vendor) return;
    
    try {
      const submitData = {
        ...evaluationData,
        overall_score: evaluationData.overall_score ? parseInt(evaluationData.overall_score) : null,
        quality_score: evaluationData.quality_score ? parseInt(evaluationData.quality_score) : null,
        delivery_score: evaluationData.delivery_score ? parseInt(evaluationData.delivery_score) : null,
        cost_score: evaluationData.cost_score ? parseInt(evaluationData.cost_score) : null,
        service_score: evaluationData.service_score ? parseInt(evaluationData.service_score) : null,
        compliance_score: evaluationData.compliance_score ? parseInt(evaluationData.compliance_score) : null,
        evaluation_period_start: evaluationData.evaluation_period_start || null,
        evaluation_period_end: evaluationData.evaluation_period_end || null,
        next_evaluation_date: evaluationData.next_evaluation_date || null,
      };

      await vendorApi.createVendorEvaluation(vendor.id, submitData);
      setShowEvaluationModal(false);
      setEvaluationData({
        evaluation_type: 'periodic',
        evaluation_period_start: '',
        evaluation_period_end: '',
        overall_score: '',
        quality_score: '',
        delivery_score: '',
        cost_score: '',
        service_score: '',
        compliance_score: '',
        strengths: '',
        weaknesses: '',
        recommendations: '',
        next_evaluation_date: ''
      });
      await loadVendorEvaluations();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create evaluation');
    }
  };

  const handleCreateSLA = async () => {
    if (!vendor) return;
    
    try {
      const submitData = {
        ...slaData,
        availability_target: slaData.availability_target ? parseFloat(slaData.availability_target) : null,
        response_time_target: slaData.response_time_target ? parseInt(slaData.response_time_target) : null,
        resolution_time_target: slaData.resolution_time_target ? parseInt(slaData.resolution_time_target) : null,
        end_date: slaData.end_date || null,
      };

      await vendorApi.createVendorSLA(vendor.id, submitData);
      setShowSLAModal(false);
      setSlaData({
        sla_name: '',
        sla_type: 'service_level',
        service_description: '',
        availability_target: '',
        response_time_target: '',
        resolution_time_target: '',
        start_date: '',
        end_date: '',
        auto_renewal: false
      });
      await loadVendorSLAs();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create SLA');
    }
  };

  const addCertification = () => {
    if (!newCertification.trim()) return;
    
    if (certificationType === 'iso') {
      setFormData({
        ...formData,
        iso_certifications: [...formData.iso_certifications, newCertification.trim()]
      });
    } else {
      setFormData({
        ...formData,
        other_certifications: [...formData.other_certifications, newCertification.trim()]
      });
    }
    
    setNewCertification('');
  };

  const removeCertification = (index: number, type: 'iso' | 'other') => {
    if (type === 'iso') {
      const updated = [...formData.iso_certifications];
      updated.splice(index, 1);
      setFormData({ ...formData, iso_certifications: updated });
    } else {
      const updated = [...formData.other_certifications];
      updated.splice(index, 1);
      setFormData({ ...formData, other_certifications: updated });
    }
  };

  const getEvaluationResultBadgeColor = (result?: string) => {
    switch (result) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'conditional': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSLAStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {vendor ? 'Edit Vendor' : 'Create New Vendor'}
            </h2>
            <p className="text-gray-600 mt-1">
              {vendor ? 'Update vendor information and manage evaluations' : 'Add a new vendor to the system'}
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
              <Building className="h-4 w-4 inline mr-2" />
              Vendor Details
            </button>
            {vendor && (
              <>
                <button
                  onClick={() => setActiveTab('evaluations')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'evaluations'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Star className="h-4 w-4 inline mr-2" />
                  Evaluations ({evaluations.length})
                </button>
                <button
                  onClick={() => setActiveTab('slas')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'slas'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FileText className="h-4 w-4 inline mr-2" />
                  SLAs ({slas.length})
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor Name *
                    </label>
                    <Input
                      value={formData.vendor_name}
                      onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                      placeholder="Enter vendor name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor Type
                    </label>
                    <Select
                      value={formData.vendor_type}
                      onValueChange={(value) => setFormData({ ...formData, vendor_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supplier">Supplier</SelectItem>
                        <SelectItem value="service_provider">Service Provider</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="consultant">Consultant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry
                    </label>
                    <Input
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder="Enter industry"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <Input
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Primary Contact</h4>
                    <Input
                      value={formData.primary_contact_name}
                      onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                      placeholder="Contact name"
                    />
                    <Input
                      type="email"
                      value={formData.primary_contact_email}
                      onChange={(e) => setFormData({ ...formData, primary_contact_email: e.target.value })}
                      placeholder="Email address"
                    />
                    <Input
                      value={formData.primary_contact_phone}
                      onChange={(e) => setFormData({ ...formData, primary_contact_phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Secondary Contact</h4>
                    <Input
                      value={formData.secondary_contact_name}
                      onChange={(e) => setFormData({ ...formData, secondary_contact_name: e.target.value })}
                      placeholder="Contact name"
                    />
                    <Input
                      type="email"
                      value={formData.secondary_contact_email}
                      onChange={(e) => setFormData({ ...formData, secondary_contact_email: e.target.value })}
                      placeholder="Email address"
                    />
                    <Input
                      value={formData.secondary_contact_phone}
                      onChange={(e) => setFormData({ ...formData, secondary_contact_phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Input
                      value={formData.address_line1}
                      onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                      placeholder="Address Line 1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      value={formData.address_line2}
                      onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                      placeholder="Address Line 2"
                    />
                  </div>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                  />
                  <Input
                    value={formData.state_province}
                    onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
                    placeholder="State/Province"
                  />
                  <Input
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="Postal Code"
                  />
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Country"
                  />
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    value={formData.business_registration_number}
                    onChange={(e) => setFormData({ ...formData, business_registration_number: e.target.value })}
                    placeholder="Business Registration Number"
                  />
                  <Input
                    value={formData.tax_identification_number}
                    onChange={(e) => setFormData({ ...formData, tax_identification_number: e.target.value })}
                    placeholder="Tax ID Number"
                  />
                </div>
              </div>

              {/* Risk and Status */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Assessment & Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Risk Rating
                    </label>
                    <Select
                      value={formData.risk_rating}
                      onValueChange={(value) => setFormData({ ...formData, risk_rating: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Performance Rating (1-5)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={formData.performance_rating}
                      onChange={(e) => setFormData({ ...formData, performance_rating: e.target.value })}
                      placeholder="1-5"
                    />
                  </div>
                </div>
              </div>

              {/* Contract Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contract Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contract Start Date
                    </label>
                    <Input
                      type="date"
                      value={formData.contract_start_date}
                      onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contract End Date
                    </label>
                    <Input
                      type="date"
                      value={formData.contract_end_date}
                      onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Insurance */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Insurance Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Coverage ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.insurance_coverage}
                      onChange={(e) => setFormData({ ...formData, insurance_coverage: e.target.value })}
                      placeholder="Enter coverage amount"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Expiry Date
                    </label>
                    <Input
                      type="date"
                      value={formData.insurance_expiry}
                      onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Certifications</h3>
                
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Select value={certificationType} onValueChange={(value: 'iso' | 'other') => setCertificationType(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iso">ISO</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      placeholder="Enter certification"
                      className="flex-1"
                    />
                    <Button type="button" onClick={addCertification}>
                      Add
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">ISO Certifications</h4>
                      <div className="space-y-2">
                        {formData.iso_certifications.map((cert, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span>{cert}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCertification(index, 'iso')}
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Other Certifications</h4>
                      <div className="space-y-2">
                        {formData.other_certifications.map((cert, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span>{cert}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCertification(index, 'other')}
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
                      {vendor ? 'Update Vendor' : 'Create Vendor'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'evaluations' && vendor && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Vendor Evaluations</h3>
                <Button onClick={() => setShowEvaluationModal(true)}>
                  <Star className="h-4 w-4 mr-2" />
                  New Evaluation
                </Button>
              </div>

              <div className="space-y-4">
                {evaluations.map((evaluation) => (
                  <Card key={evaluation.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className="capitalize">
                              {evaluation.evaluation_type.replace('_', ' ')}
                            </Badge>
                            {evaluation.evaluation_result && (
                              <Badge className={getEvaluationResultBadgeColor(evaluation.evaluation_result)}>
                                {evaluation.evaluation_result}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            {evaluation.overall_score && (
                              <div>
                                <span className="font-medium">Overall:</span> {evaluation.overall_score}%
                              </div>
                            )}
                            {evaluation.quality_score && (
                              <div>
                                <span className="font-medium">Quality:</span> {evaluation.quality_score}%
                              </div>
                            )}
                            {evaluation.delivery_score && (
                              <div>
                                <span className="font-medium">Delivery:</span> {evaluation.delivery_score}%
                              </div>
                            )}
                            {evaluation.cost_score && (
                              <div>
                                <span className="font-medium">Cost:</span> {evaluation.cost_score}%
                              </div>
                            )}
                            {evaluation.compliance_score && (
                              <div>
                                <span className="font-medium">Compliance:</span> {evaluation.compliance_score}%
                              </div>
                            )}
                          </div>

                          <div className="text-sm text-gray-600">
                            <div>Evaluated: {new Date(evaluation.evaluation_date).toLocaleDateString()}</div>
                            {evaluation.next_evaluation_date && (
                              <div>Next: {new Date(evaluation.next_evaluation_date).toLocaleDateString()}</div>
                            )}
                          </div>

                          {evaluation.strengths && (
                            <div className="text-sm">
                              <strong>Strengths:</strong> {evaluation.strengths}
                            </div>
                          )}
                          
                          {evaluation.weaknesses && (
                            <div className="text-sm">
                              <strong>Weaknesses:</strong> {evaluation.weaknesses}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {evaluations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No evaluations found for this vendor
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'slas' && vendor && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Service Level Agreements</h3>
                <Button onClick={() => setShowSLAModal(true)}>
                  <FileText className="h-4 w-4 mr-2" />
                  New SLA
                </Button>
              </div>

              <div className="space-y-4">
                {slas.map((sla) => (
                  <Card key={sla.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{sla.sla_name}</h4>
                            <Badge className={getSLAStatusBadgeColor(sla.status)}>
                              {sla.status}
                            </Badge>
                            {sla.sla_type && (
                              <Badge variant="outline" className="capitalize">
                                {sla.sla_type.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {sla.availability_target && (
                              <div>
                                <span className="font-medium">Availability:</span> {sla.availability_target}%
                              </div>
                            )}
                            {sla.response_time_target && (
                              <div>
                                <span className="font-medium">Response Time:</span> {sla.response_time_target} min
                              </div>
                            )}
                            {sla.resolution_time_target && (
                              <div>
                                <span className="font-medium">Resolution Time:</span> {sla.resolution_time_target} hrs
                              </div>
                            )}
                          </div>

                          <div className="text-sm text-gray-600">
                            <div>Start: {new Date(sla.start_date).toLocaleDateString()}</div>
                            {sla.end_date && (
                              <div>End: {new Date(sla.end_date).toLocaleDateString()}</div>
                            )}
                            <div>Compliance: {sla.compliance_status}</div>
                          </div>

                          {sla.service_description && (
                            <div className="text-sm">
                              <strong>Service:</strong> {sla.service_description}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {slas.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No SLAs found for this vendor
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Evaluation Modal */}
        {showEvaluationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Vendor Evaluation</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Evaluation Type
                    </label>
                    <Select
                      value={evaluationData.evaluation_type}
                      onValueChange={(value) => setEvaluationData({ ...evaluationData, evaluation_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="initial">Initial</SelectItem>
                        <SelectItem value="periodic">Periodic</SelectItem>
                        <SelectItem value="incident_based">Incident Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Overall Score (0-100)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={evaluationData.overall_score}
                      onChange={(e) => setEvaluationData({ ...evaluationData, overall_score: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Evaluation Period Start
                    </label>
                    <Input
                      type="date"
                      value={evaluationData.evaluation_period_start}
                      onChange={(e) => setEvaluationData({ ...evaluationData, evaluation_period_start: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Evaluation Period End
                    </label>
                    <Input
                      type="date"
                      value={evaluationData.evaluation_period_end}
                      onChange={(e) => setEvaluationData({ ...evaluationData, evaluation_period_end: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality (0-100)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={evaluationData.quality_score}
                      onChange={(e) => setEvaluationData({ ...evaluationData, quality_score: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery (0-100)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={evaluationData.delivery_score}
                      onChange={(e) => setEvaluationData({ ...evaluationData, delivery_score: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost (0-100)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={evaluationData.cost_score}
                      onChange={(e) => setEvaluationData({ ...evaluationData, cost_score: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service (0-100)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={evaluationData.service_score}
                      onChange={(e) => setEvaluationData({ ...evaluationData, service_score: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compliance (0-100)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={evaluationData.compliance_score}
                      onChange={(e) => setEvaluationData({ ...evaluationData, compliance_score: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strengths
                  </label>
                  <textarea
                    value={evaluationData.strengths}
                    onChange={(e) => setEvaluationData({ ...evaluationData, strengths: e.target.value })}
                    placeholder="Enter strengths"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weaknesses
                  </label>
                  <textarea
                    value={evaluationData.weaknesses}
                    onChange={(e) => setEvaluationData({ ...evaluationData, weaknesses: e.target.value })}
                    placeholder="Enter weaknesses"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recommendations
                  </label>
                  <textarea
                    value={evaluationData.recommendations}
                    onChange={(e) => setEvaluationData({ ...evaluationData, recommendations: e.target.value })}
                    placeholder="Enter recommendations"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Next Evaluation Date
                  </label>
                  <Input
                    type="date"
                    value={evaluationData.next_evaluation_date}
                    onChange={(e) => setEvaluationData({ ...evaluationData, next_evaluation_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <Button variant="outline" onClick={() => setShowEvaluationModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEvaluation}>
                  Create Evaluation
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* SLA Modal */}
        {showSLAModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Service Level Agreement</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SLA Name *
                    </label>
                    <Input
                      value={slaData.sla_name}
                      onChange={(e) => setSlaData({ ...slaData, sla_name: e.target.value })}
                      placeholder="Enter SLA name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SLA Type
                    </label>
                    <Select
                      value={slaData.sla_type}
                      onValueChange={(value) => setSlaData({ ...slaData, sla_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="service_level">Service Level</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="availability">Availability</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Description
                  </label>
                  <textarea
                    value={slaData.service_description}
                    onChange={(e) => setSlaData({ ...slaData, service_description: e.target.value })}
                    placeholder="Describe the service"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Availability Target (%)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={slaData.availability_target}
                      onChange={(e) => setSlaData({ ...slaData, availability_target: e.target.value })}
                      placeholder="99.9"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Response Time (minutes)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={slaData.response_time_target}
                      onChange={(e) => setSlaData({ ...slaData, response_time_target: e.target.value })}
                      placeholder="15"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resolution Time (hours)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={slaData.resolution_time_target}
                      onChange={(e) => setSlaData({ ...slaData, resolution_time_target: e.target.value })}
                      placeholder="24"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <Input
                      type="date"
                      value={slaData.start_date}
                      onChange={(e) => setSlaData({ ...slaData, start_date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={slaData.end_date}
                      onChange={(e) => setSlaData({ ...slaData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="auto_renewal"
                    checked={slaData.auto_renewal}
                    onChange={(e) => setSlaData({ ...slaData, auto_renewal: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="auto_renewal" className="text-sm font-medium text-gray-700">
                    Auto-renewal
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <Button variant="outline" onClick={() => setShowSLAModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSLA}>
                  Create SLA
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}