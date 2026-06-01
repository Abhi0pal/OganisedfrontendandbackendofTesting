import React, { useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useInspectorSchedule } from '@/hooks/useInspections';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface InspectionScheduleCalendarProps {
    inspectorIds: (string | number)[];
    inspectorNames?: string[]; // Optional: for tooltip or legend
    onDateSelect?: (date: Date) => void;
    selectedDate?: Date | null;
    height?: number | string;
}

const InspectionScheduleCalendar: React.FC<InspectionScheduleCalendarProps> = ({
    inspectorIds,
    inspectorNames,
    onDateSelect,
    selectedDate,
    height = 500
}) => {
    // For now, we fetch schedule for the first inspector if multiple are passed, 
    // or we could aggregate them. Let's start with the first one for the demo.
    const primaryInspectorId = inspectorIds.length > 0 ? inspectorIds[0] : null;

    const { data: events = [], isLoading } = useInspectorSchedule(primaryInspectorId);

    // Custom event style
    const eventPropGetter = (event: any) => {
        return {
            style: {
                backgroundColor: '#3b82f6',
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [currentView, setCurrentView] = React.useState<View>(Views.MONTH);

    const handleSelectSlot = ({ start }: { start: Date }) => {
        if (onDateSelect) {
            onDateSelect(start);
        }
    };

    if (!primaryInspectorId) {
        return (
            <div className="d-flex align-items-center justify-content-center bg-light rounded" style={{ height }}>
                <div className="text-center text-muted">
                    <i className="bi bi-calendar-x fs-1 d-block mb-3"></i>
                    <p>Select an inspector to view their schedule</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="d-flex align-items-center justify-content-center bg-light rounded" style={{ height }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="inspection-calendar-wrapper" style={{ height, background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h6 className="fw-bold mb-3 border-bottom pb-2">
                <i className="bi bi-calendar-check me-2 text-primary"></i>
                Inspector Availability
                {inspectorNames && inspectorNames.length > 0 && (
                    <span className="text-muted fw-normal ms-2 small">({inspectorNames.join(', ')})</span>
                )}
            </h6>
            <Calendar
                localizer={localizer}
                events={
                    selectedDate ? [
                        ...events,
                        {
                            id: 'temp-selection',
                            title: 'New Inspection',
                            start: new Date(selectedDate.setHours(10, 0, 0, 0)),
                            end: new Date(selectedDate.setHours(12, 0, 0, 0)),
                            allDay: false,
                            status: 'SCHEDULED', // Mock status for color
                            isTemporary: true
                        }
                    ] : events
                }
                startAccessor="start"
                endAccessor="end"
                style={{ height: 'calc(100% - 40px)' }}

                // Controlled State
                date={currentDate}
                view={currentView}
                onNavigate={setCurrentDate}
                onView={setCurrentView}

                views={['month', 'week', 'day']}
                selectable
                onSelectSlot={handleSelectSlot}
                eventPropGetter={(event: any) => {
                    if (event.isTemporary) {
                        return {
                            style: {
                                backgroundColor: '#10b981', // Green for new selection
                                borderRadius: '4px',
                                opacity: 1,
                                color: 'white',
                                border: '2px solid white',
                                display: 'block'
                            }
                        };
                    }
                    return eventPropGetter(event);
                }}
                tooltipAccessor={(event: any) => `${event.title} (${format(event.start, 'h:mm a')} - ${format(event.end, 'h:mm a')})`}
            />
            <div className="mt-2 small text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Click on any empty slot to select that date for inspection
            </div>
        </div>
    );
};

export default InspectionScheduleCalendar;
