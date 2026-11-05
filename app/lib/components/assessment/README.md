# Assessment Components

This directory contains reusable components for displaying assessment-related information in the application.

## Components

### AssessmentHeader

Displays the assessment title, metadata, and action buttons.

**Props:**

- `assessment: Assessment` - The assessment data
- `onBack: () => void` - Callback for back button
- `onEdit: () => void` - Callback for edit button
- `onExport: () => void` - Callback for export button
- `onLiveCollection: () => void` - Callback for live collection button

**Features:**

- Shows assessment title and unit information
- Displays action buttons (Back, Edit, Export, Live Collection)
- Conditionally renders Live Collection button based on assessment status

### AssessmentMetadata

Displays key assessment information in card format.

**Props:**

- `assessment: Assessment` - The assessment data
- `totalStudents: number` - Total number of students

**Features:**

- Shows student count, due date, assessment type, and status
- Handles null due dates gracefully
- Uses appropriate icons for each metadata type

### StudentProgress

Displays student progress statistics in a visual format.

**Props:**

- `readyForReview: number` - Number of students ready for review
- `revisionRequested: number` - Number of students with revision requested
- `done: number` - Number of completed students

**Features:**

- Visual progress cards with color coding
- Responsive grid layout
- Clear statistics display

### StudentList

Displays a filterable table of student records.

**Props:**

- `students: StudentRecord[]` - Array of student records

**Features:**

- Search functionality by student name
- Filter by status (Ready for Review, Revision Requested, Done)
- Filter by class section
- Toggle between anonymous and real names
- Responsive table design
- Empty state handling

## Usage Example

```tsx
import {
  AssessmentHeader,
  AssessmentMetadata,
  StudentProgress,
  StudentList,
} from '@/app/v2/shared/components/assessment'

function AssessmentDetailPage() {
  // ... state and data fetching logic

  return (
    <div className="space-y-6">
      <AssessmentHeader
        assessment={assessment}
        onBack={handleBack}
        onEdit={handleEdit}
        onExport={handleExport}
        onLiveCollection={handleLiveCollection}
      />

      <AssessmentMetadata assessment={assessment} totalStudents={students.length} />

      <StudentProgress
        readyForReview={readyForReview}
        inProgress={inProgress}
        readyToShare={readyToShare}
        shared={shared}
      />

      <StudentList students={students} />
    </div>
  )
}
```

## Testing

Each component has comprehensive tests covering:

- Rendering behavior
- User interactions
- Edge cases
- Accessibility features

Run tests with:

```bash
npm test -- --testPathPattern=assessment
```

## Styling

Components use Tailwind CSS classes and follow the design system established in the UI components. They are responsive and support both light and dark themes.
