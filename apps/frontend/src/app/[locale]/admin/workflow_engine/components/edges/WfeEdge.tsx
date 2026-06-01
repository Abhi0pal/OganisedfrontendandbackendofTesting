'use client';
import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from 'reactflow';

export default function WfeEdge({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition, targetPosition,
  label, style, markerEnd,
}: any) {
  const isReverse = sourceX > targetX + 80;

  // Reverse edges arc below nodes; forward edges arc above slightly
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY: isReverse ? sourceY + 30 : sourceY,
    sourcePosition,
    targetX,
    targetY: isReverse ? targetY + 30 : targetY,
    targetPosition,
    curvature: isReverse ? 0.7 : 0.15,
  });

  const color = style?.stroke || '#555';

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: color,
              color: '#fff',
              padding: '3px 9px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              pointerEvents: 'all',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
