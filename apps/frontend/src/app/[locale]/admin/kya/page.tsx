'use client';

import { Link } from '@/navigation';
import { Card } from 'primereact/card';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

export default function KyaIndexPage() {
    return (
        <div className="p-4">
            <h1 className="h2 mb-4">Know Your Approvals (KYA)</h1>

            <div className="row">
                <div className="col-md-4 mb-4">
                    <Link href="./kya/add" className="text-decoration-none">
                        <Card className="h-100 shadow-sm" style={{ cursor: 'pointer' }}>
                            <div className="d-flex align-items-center gap-3">
                                <i className="pi pi-cog" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}></i>
                                <div>
                                    <h5 className="mb-1">Configuration</h5>
                                    <p className="text-muted mb-0">View categories and services</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                </div>

                <div className="col-md-4 mb-4">
                    <Link href="./kya/questions" className="text-decoration-none">
                        <Card className="h-100 shadow-sm" style={{ cursor: 'pointer' }}>
                            <div className="d-flex align-items-center gap-3">
                                <i className="pi pi-question-circle" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}></i>
                                <div>
                                    <h5 className="mb-1">Question Management</h5>
                                    <p className="text-muted mb-0">Add, edit, and manage KYA questions</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                </div>

                <div className="col-md-4 mb-4">
                    <Link href="./kya/questions-v2" className="text-decoration-none">
                        <Card className="h-100 shadow-sm" style={{ cursor: 'pointer', border: '2px solid #198754' }}>
                            <div className="d-flex align-items-center gap-3">
                                <i className="pi pi-star-fill" style={{ fontSize: '2rem', color: '#198754' }}></i>
                                <div>
                                    <h5 className="mb-1">
                                        Questions V2
                                        <span className="badge bg-success ms-2" style={{ fontSize: '0.7rem' }}>NEW</span>
                                    </h5>
                                    <p className="text-muted mb-0">Advanced editor with drawer & better UX</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                </div>

                <div className="col-md-4 mb-4">
                    <Link href="./kya/approvals" className="text-decoration-none">
                        <Card className="h-100 shadow-sm" style={{ cursor: 'pointer' }}>
                            <div className="d-flex align-items-center gap-3">
                                <i className="pi pi-check-circle" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}></i>
                                <div>
                                    <h5 className="mb-1">Approvals Display</h5>
                                    <p className="text-muted mb-0">View KYA results by stage</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    );
}
