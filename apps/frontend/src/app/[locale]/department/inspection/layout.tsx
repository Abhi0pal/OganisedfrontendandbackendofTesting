import './inspection.css';

export default function InspectionLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="inspection-scope">
            {children}
        </div>
    );
}
