'use client';

import Link from 'next/link';

export default function PlanningPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Audit Planning</h1>
        <Link href="/audits/create" className="btn btn-primary">
          Create Audit Plan
        </Link>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Annual Audit Plan</h2>
        <p className="text-gray-600">Plan and schedule audits for the year</p>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-2">Q1 Audits</h3>
            <p className="text-sm text-gray-600">January - March</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-2">Q2 Audits</h3>
            <p className="text-sm text-gray-600">April - June</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-2">Q3 Audits</h3>
            <p className="text-sm text-gray-600">July - September</p>
          </div>
        </div>
      </div>
    </div>
  );
}
