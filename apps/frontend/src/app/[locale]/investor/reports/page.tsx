'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { useRouter } from 'next/navigation';

export default function InvestorReportsPage() {
  const router = useRouter();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          label="Back"
          icon="pi pi-arrow-left"
          text
          onClick={() => router.back()}
        />
      </div>

      <Card title="Inspection Reports" className="shadow-sm">
        <div className="space-y-4">
          <p className="text-gray-600">
            Your inspection reports will appear here once inspections are completed.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 border rounded-lg border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-2">Inspection History</h3>
              <p className="text-sm text-gray-600">View all completed and pending inspections.</p>
            </div>
            
            <div className="p-4 border rounded-lg border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-2">Inspection Reports</h3>
              <p className="text-sm text-gray-600">Download and view detailed inspection reports.</p>
            </div>

            <div className="p-4 border rounded-lg border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-2">Compliance Status</h3>
              <p className="text-sm text-gray-600">Track compliance with inspection requirements.</p>
            </div>

            <div className="p-4 border rounded-lg border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-2">Action Items</h3>
              <p className="text-sm text-gray-600">View action items from inspections.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
