'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Audit } from '@/lib/types';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// ISO 19011 Audit Workflow Stages
const WORKFLOW_STAGES = [
  { key: 'PLANNED', label: 'Planned', order: 0 },
  { key: 'INITIATED', label: 'Initiated', order: 1 },
  { key: 'PREPARATION', label: 'Preparation', order: 2 },
  { key: 'EXECUTING', label: 'Executing', order: 3 },
  { key: 'REPORTING', label: 'Reporting', order: 4 },
  { key: 'FOLLOWUP', label: 'Follow-up', order: 5 },
  { key: 'CLOSED', label: 'Closed', order: 6 },
];

function getStageOrder(status: string): number {
  const stage = WORKFLOW_STAGES.find(s => s.key === status?.toUpperCase());
  return stage?.order ?? 0;
}

interface AuditNavigationProps {
  auditId: string;
  audit?: Audit | null;
}

export default function AuditNavigation({ auditId, audit: propAudit }: AuditNavigationProps) {
  const pathname = usePathname();

  // Fetch audit if not provided
  const { data: fetchedAudit } = useQuery<Audit>({
    queryKey: ['audit', auditId],
    queryFn: async () => {
      const response = await api.get(`/audits/${auditId}`);
      return response.data;
    },
    enabled: !propAudit,
  });

  const audit = propAudit || fetchedAudit;
  const currentStageOrder = getStageOrder(audit?.status || 'PLANNED');

  // ISO 19011 Workflow Tabs
  const workflowTabs = [
    { name: 'Overview', href: `/audits/${auditId}` },
    { name: 'Initiate', href: `/audits/${auditId}/initiate` },
    { name: 'Team', href: `/audits/${auditId}/team` },
    { name: 'Prepare', href: `/audits/${auditId}/prepare` },
    { name: 'Execute', href: `/audits/${auditId}/execute` },
    { name: 'Work Program', href: `/audits/${auditId}/work-program` },
    { name: 'Evidence', href: `/audits/${auditId}/evidence` },
    { name: 'Findings', href: `/audits/${auditId}/findings` },
    { name: 'Queries', href: `/audits/${auditId}/queries` },
    { name: 'Report', href: `/audits/${auditId}/report` },
    { name: 'Follow-up', href: `/audits/${auditId}/followup` },
  ];

  const isActiveTab = (href: string) => pathname === href;

  return (
    <div className="mb-6">
      {/* Back Link and Title */}
      <div className="mb-6">
        <Link href="/audits" className="text-primary-600 hover:underline mb-2 inline-block">
          ← Back to Audits
        </Link>
        <h1 className="text-3xl font-bold">{audit?.title || 'Loading...'}</h1>
        <p className="text-gray-600 mt-2">{audit?.scope}</p>
      </div>

      {/* ISO 19011 Workflow Progress */}
      <div className="card mb-6">
        <h3 className="text-sm font-medium text-gray-600 mb-3">ISO 19011 Audit Workflow Progress</h3>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {WORKFLOW_STAGES.map((stage, index) => {
            const isCompleted = currentStageOrder > stage.order;
            const isCurrent = currentStageOrder === stage.order;
            return (
              <div key={stage.key} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
                  isCompleted ? 'bg-green-100 text-green-800' :
                  isCurrent ? 'bg-blue-100 text-blue-800 font-medium' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {isCompleted && <span>✓</span>}
                  {isCurrent && <span>●</span>}
                  {stage.label}
                </div>
                {index < WORKFLOW_STAGES.length - 1 && (
                  <div className={`w-4 h-0.5 mx-1 ${isCompleted ? 'bg-green-400' : 'bg-gray-300'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {workflowTabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`px-4 py-2 border-b-2 whitespace-nowrap text-sm transition-colors ${
                isActiveTab(tab.href)
                  ? 'border-primary-600 text-primary-600 font-medium'
                  : 'border-transparent hover:border-gray-300 text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
