# Unified Service Popup System

## Overview

A unified, reusable popup system for displaying service information (checklists, processes, timelines, documents) across the application using radio button tabs instead of separate popups.

## Features

✅ **Single Unified Popup** - Consolidates multiple information types into one dialog  
✅ **Radio Button Navigation** - Switch between different content tabs easily  
✅ **Dynamic Configuration** - Works with any page or service  
✅ **Reusable Hook** - `useDynamicPopup` for easy integration  
✅ **Icon Support** - Bootstrap icons for visual tabs  
✅ **Download Functionality** - Built-in download button for documents  
✅ **Responsive Design** - Works on all screen sizes

---

## Components

### 1. **UnifiedServicePopup** Component

[Location: `src/components/popups/UnifiedServicePopup.tsx`]

The main popup component with radio button tabs.

#### Props:

```typescript
interface UnifiedServicePopupProps {
  visible: boolean; // Show/hide popup
  title: string; // Main popup title
  serviceName?: string; // Service name (subtitle)
  tabs: PopupTabContent[]; // Array of tab contents
  defaultTab?: string; // Which tab to show first (tab id)
  onHide: () => void; // Callback when popup closes
  footerContent?: React.ReactNode; // Custom footer content
  size?: "normal" | "large"; // Popup width
  showDownloadButton?: boolean; // Show download button
  onDownload?: () => void; // Download handler
}

interface PopupTabContent {
  id: string; // Unique tab identifier
  label: string; // Tab label shown to user
  icon?: string; // Bootstrap icon class (e.g., 'bi bi-file-earmark')
  content: React.ReactNode; // Tab content (JSX)
}
```

#### Basic Usage:

```tsx
<UnifiedServicePopup
  visible={showPopup}
  onHide={() => setShowPopup(false)}
  title="Service Details"
  serviceName="Marriage Registration"
  tabs={[
    {
      id: "checklist",
      label: "Document Checklist",
      icon: "bi bi-file-earmark-check",
      content: <ChecklistComponent />,
    },
    {
      id: "process",
      label: "Process Flow",
      icon: "bi bi-diagram-3",
      content: <ProcessComponent />,
    },
  ]}
/>
```

---

### 2. **useDynamicPopup** Hook

[Location: `src/hooks/useDynamicPopup.ts`]

Custom hook for managing popup state and configuration.

#### Usage:

```tsx
const popup = useDynamicPopup();

// Open popup
popup.openPopup({
  id: "my-popup",
  title: "Service Information",
  serviceName: "Test Service",
  tabs: [
    {
      id: "tab1",
      label: "Tab 1",
      icon: "bi bi-file",
      content: <div>Content 1</div>,
    },
    {
      id: "tab2",
      label: "Tab 2",
      icon: "bi bi-list-check",
      content: <div>Content 2</div>,
    },
  ],
});

// Render popup
<UnifiedServicePopup
  visible={popup.isVisible}
  onHide={popup.closePopup}
  title={popup.config?.title}
  serviceName={popup.config?.serviceName}
  tabs={popup.config?.tabs || []}
/>;

// Close popup
popup.closePopup();
```

---

## Integration Examples

### Example 1: Update Existing Component

**PublicInformationWizard** has been updated to use this new unified popup.

**Key Changes:**

- Replaced separate `showChecklistDialog` state with `showServicePopup`
- Created `generatePopupTabs()` function to build tabs dynamically
- Now shows: Document Checklist, Process/SOP, Timeline & Fees, Statutory Info
- Single "View Details" button opens all information

### Example 2: Simple Service Page

```tsx
import { useDynamicPopup } from "@/hooks/useDynamicPopup";
import { UnifiedServicePopup } from "@/components/popups/UnifiedServicePopup";

export function MyServicePage() {
  const popup = useDynamicPopup();

  const handleViewDetails = () => {
    popup.openPopup({
      id: "service-1",
      title: "Service Information",
      serviceName: "My Service",
      tabs: [
        {
          id: "checklist",
          label: "Documents",
          icon: "bi bi-file-earmark-check",
          content: (
            <div>
              <h6>Required Documents:</h6>
              <ul>
                <li>Document 1</li>
                <li>Document 2</li>
              </ul>
            </div>
          ),
        },
        {
          id: "steps",
          label: "Steps",
          icon: "bi bi-list-check",
          content: (
            <ol>
              <li>Step 1</li>
              <li>Step 2</li>
            </ol>
          ),
        },
      ],
    });
  };

  return (
    <>
      <button onClick={handleViewDetails}>View Details</button>

      {popup.config && (
        <UnifiedServicePopup
          visible={popup.isVisible}
          onHide={popup.closePopup}
          title={popup.config.title}
          serviceName={popup.config.serviceName}
          tabs={popup.config.tabs}
          size="large"
        />
      )}
    </>
  );
}
```

### Example 3: Dynamic API Data

```tsx
const handleOpenPopup = async () => {
  try {
    // Fetch service data
    const { data } = await apiClient.get(`/services/${serviceId}`);

    const tabs = [
      {
        id: "checklist",
        label: "Checklist",
        icon: "bi bi-file-earmark-check",
        content: <ChecklistTable items={data.checklist} />,
      },
      {
        id: "process",
        label: "Process",
        icon: "bi bi-diagram-3",
        content: <ProcessSteps steps={data.process} />,
      },
    ];

    popup.openPopup({
      id: `service-${serviceId}`,
      title: data.serviceName,
      serviceName: data.serviceName,
      tabs,
      defaultTab: "checklist",
    });
  } catch (error) {
    console.error("Failed to load service details", error);
  }
};
```

---

## Configuration Types

### PopupTabContent

```typescript
interface PopupTabContent {
  id: string; // Unique identifier
  label: string; // Display label
  icon?: string; // Bootstrap icon class
  content: React.ReactNode; // Tab content (any JSX)
}
```

### DynamicPopupConfig (from hook)

```typescript
interface DynamicPopupConfig {
  id: string; // Popup identifier
  title: string; // Main title
  serviceName?: string; // Service name (subtitle)
  tabs: PopupTabContent[];
  defaultTab?: string; // Initial tab to show
}
```

---

## Styling & Customization

### Bootstrap Classes

The component uses Bootstrap 5 classes:

- Buttons: `btn btn-primary`, `btn btn-success`, etc.
- Forms: `form-check`, `form-check-label`
- Tables: `table table-bordered`
- Badges: `badge bg-success`, `badge bg-danger`
- Cards: `card border-0 shadow-sm`

### Custom Styling

Add custom CSS or inline styles:

```tsx
const customContent = (
  <div
    style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "0.5rem" }}
  >
    Custom styled content
  </div>
);
```

### Icon Options

Bootstrap Icons (prefix with `bi bi-`):

- `bi bi-file-earmark-check` - Checklist
- `bi bi-diagram-3` - Process/Flow
- `bi bi-clock-history` - Timeline
- `bi bi-file-text` - Documents
- `bi bi-download` - Download
- `bi bi-eye` - View
- `bi bi-info-circle` - Information

---

## Advantages Over Separate Popups

| Feature          | Separate Popups         | Unified Popup                 |
| ---------------- | ----------------------- | ----------------------------- |
| User Navigation  | Click different buttons | Radio buttons in one popup    |
| Screen Space     | Multiple windows        | Single compact dialog         |
| State Management | Multiple `useState`     | Single hook                   |
| Code Reusability | Limited                 | High - works for all services |
| Consistency      | Different per component | Unified experience            |
| API Load         | Multiple requests       | Single or combined request    |

---

## Migration Guide

### From Old to New

**Before (Old Way):**

```tsx
const [showChecklist, setShowChecklist] = useState(false);
const [showProcess, setShowProcess] = useState(false);
const [showTimeline, setShowTimeline] = useState(false);

// Three separate dialogs...
<Dialog visible={showChecklist} onHide={() => setShowChecklist(false)}>
  {/* Checklist content */}
</Dialog>
<Dialog visible={showProcess} onHide={() => setShowProcess(false)}>
  {/* Process content */}
</Dialog>
```

**After (New Way):**

```tsx
const popup = useDynamicPopup();

popup.openPopup({
  id: "service",
  title: "Service Info",
  tabs: [
    { id: "checklist", label: "Checklist", content: <ChecklistContent /> },
    { id: "process", label: "Process", content: <ProcessContent /> },
    { id: "timeline", label: "Timeline", content: <TimelineContent /> },
  ],
});

<UnifiedServicePopup
  {...popup.config}
  visible={popup.isVisible}
  onHide={popup.closePopup}
/>;
```

---

## Files Modified/Created

### New Files:

- ✅ `src/components/popups/UnifiedServicePopup.tsx` - Main component
- ✅ `src/types/popupConfig.ts` - Type definitions
- ✅ `src/hooks/useDynamicPopup.ts` - Custom hook
- ✅ `src/components/popups/PopupExamples.tsx` - Example implementations

### Modified Files:

- 🔄 `src/components/information-wizard/PublicInformationWizard.tsx` - Integrated new popup

---

## Advanced Features

### Download Button

```tsx
<UnifiedServicePopup
  // ... other props
  showDownloadButton={true}
  onDownload={() => {
    // Handle download
    const csv = generateCSV(data);
    downloadFile(csv, "filename.csv");
  }}
/>
```

### Custom Footer

```tsx
<UnifiedServicePopup
  // ... other props
  footerContent={
    <div className="text-muted small">Last updated: {lastUpdatedDate}</div>
  }
/>
```

### Dynamic Tab Updates

```tsx
const popup = useDynamicPopup();

// Update tabs after popup is open
popup.updateTabs(newTabs);
```

---

## Browser Support

- ✅ Chrome (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ✅ Edge (Latest)

---

## Performance Considerations

- **Lazy Loading**: Render tab content only when tab is active
- **Memoization**: Use `useMemo` for tab content generation
- **Large Data**: Paginate large tables inside tabs
- **API Calls**: Load data before opening popup or lazy-load per tab

---

## Best Practices

1. **Always provide unique tab IDs** - Required for radio buttons
2. **Use meaningful icons** - Improves UX
3. **Keep tab content lightweight** - Avoid heavy computations
4. **Test on mobile** - Dialog may need adjusted size
5. **Provide default tab** - Improves perceived speed
6. **Cache popup configs** - Reduce API calls if showing same popup frequently

---

## Future Enhancements

- 📋 Tab keyboard navigation (arrows, Escape)
- 📱 Mobile-optimized layout
- 🎨 Theme customization
- 📊 Tab content caching
- 🔔 Tab indicators (e.g., "3/5 items")

---

## Support

For issues or questions about the unified popup system, refer to:

- Component: `src/components/popups/UnifiedServicePopup.tsx`
- Hook: `src/hooks/useDynamicPopup.ts`
- Examples: `src/components/popups/PopupExamples.tsx`
