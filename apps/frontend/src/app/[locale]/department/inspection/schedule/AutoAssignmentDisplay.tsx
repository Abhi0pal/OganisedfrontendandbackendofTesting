import { useEffect } from 'react';
import { useRecommendedInspector } from '@/hooks/useInspections';

export default function AutoAssignmentDisplay({
    departmentId,
    departmentName,
    inspectorType,
    onAssign,
    districtId
}: {
    departmentId: number,
    departmentName: string,
    inspectorType: 'DEPARTMENT_OFFICIAL' | 'THIRD_PARTY',
    onAssign: (id: string) => void,
    districtId?: number
}) {
    const { mutate: getRecommendation, data, isPending, error } = useRecommendedInspector();

    useEffect(() => {
        getRecommendation({ departmentId, type: inspectorType, districtId });
    }, [departmentId, inspectorType, districtId]);

    useEffect(() => {
        if (data && data.inspector) {
            console.log('AutoAssignmentDisplay: Assigned', data.inspector.id);
            onAssign(data.inspector.id);
        } else if (data && !data.inspector) {
            console.log('AutoAssignmentDisplay: No inspector found in response', data);
        }
    }, [data, onAssign]);

    useEffect(() => {
        if (error) {
            console.error('AutoAssignmentDisplay: Error fetching recommendation', error);
        }
    }, [error]);

    if (isPending) {
        return (
            <div className="card border-0 mb-3 shadow-sm bg-light">
                <div className="card-body p-3 d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm text-primary me-3" role="status"></div>
                    <div>
                        <div className="fw-semibold text-dark">Analyzing Workloads...</div>
                        <small className="text-muted">Finding best inspector for {departmentName}</small>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-warning mb-3 small">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Could not auto-assign for {departmentName}. Please switch to Manual.
            </div>
        );
    }

    if (!data || !data.inspector) return null;

    return (
        <div className="card border-0 mb-3 shadow-sm" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <div className="d-flex align-items-center mb-1">
                            <h6 className="fw-bold mb-0 text-dark">{data.inspector.name}</h6>
                            <span className="badge bg-success-subtle text-success ms-2" style={{ fontSize: '0.65rem' }}>RECOMMENDED</span>
                        </div>
                        <div className="text-muted small mb-2">{data.inspector.designation}</div>
                        <div className="d-flex align-items-center small" style={{ color: '#059669', background: '#ecfdf5', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex' }}>
                            <i className="bi bi-lightning-charge-fill me-1"></i>
                            {data.reason}
                        </div>
                    </div>
                    <div className="text-end">
                        <div className="h4 fw-bold mb-0 text-success">{data.score}</div>
                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>MATCH SCORE</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
