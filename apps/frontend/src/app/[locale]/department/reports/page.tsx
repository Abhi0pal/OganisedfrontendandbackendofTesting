'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { useRouter } from 'next/navigation';

export default function DepartmentReportsPage() {
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

      <Card title="Reports" className="shadow-sm">
        <div className="space-y-4">
          <p className="text-gray-600">
            Reports functionality is currently under development. Please check back later.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 border rounded-lg border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-2">Project Reports</h3>
              <p className="text-sm text-gray-600">Generate reports for project registrations and updates.</p>
            </div>
            
            <div className="p-4 border rounded-lg border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-2">Agent Reports</h3>
              <p className="text-sm text-gray-600">Generate reports for agent registrations and renewals.</p>
            </div>

            <div className="p-4 border rounded-lg border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-2">Compliance Reports</h3>
              <p className="text-sm text-gray-600">View compliance and audit reports.</p>
            </div>

            <div className="p-4 border rounded-lg border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
              <p className="text-sm text-gray-600">View analytics and KPI dashboards.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
