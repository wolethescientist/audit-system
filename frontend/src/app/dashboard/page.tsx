'use client';

import { MetricsWidget } from '@/components/dashboard/MetricsWidget';
import { RiskHeatmapChart } from '@/components/dashboard/RiskHeatmapChart';
import { ComplianceGauges } from '@/components/dashboard/ComplianceGauges';
import { CAPATracker } from '@/components/dashboard/CAPATracker';

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
          ISO Compliance Dashboard
        </h1>
        <p className="text-gray-600">
          Comprehensive audit management and ISO compliance tracking
        </p>
      </div>

      {/* Metrics Overview */}
      <section>
        <MetricsWidget />
      </section>

      {/* Risk and Compliance Section */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <RiskHeatmapChart />
        <div className="space-y-6">
          <ComplianceGauges />
        </div>
      </section>

      {/* CAPA Tracking */}
      <section>
        <CAPATracker />
      </section>

      {/* Quick Actions */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">New Audit</p>
              <p className="text-sm text-gray-600">Create audit</p>
            </div>
          </button>

          <button className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Risk Assessment</p>
              <p className="text-sm text-gray-600">Assess risks</p>
            </div>
          </button>

          <button className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Generate Report</p>
              <p className="text-sm text-gray-600">AI-powered reports</p>
            </div>
          </button>

          <button className="flex items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors duration-200">
            <div className="p-2 bg-orange-100 rounded-lg mr-3">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">CAPA Management</p>
              <p className="text-sm text-gray-600">Track actions</p>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
