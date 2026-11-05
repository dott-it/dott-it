# Export Utilities

This module provides a clean and organized API for exporting various types of data in different formats (PDF, DOC).

## Structure

```
export/
├── types.ts              # Shared type definitions
├── utils/                # Utility functions
│   ├── file-utils.ts     # File handling utilities
│   ├── text-utils.ts     # Text formatting utilities
│   └── status-utils.ts   # Status handling utilities
├── pdf/                  # PDF and DOC export functions
│   ├── feedback-pdf.ts   # Feedback export (PDF + DOC)
│   ├── assessment-pdf.ts # Assessment export (PDF + DOC)
│   └── history-pdf.ts    # Assessment history export (PDF + DOC)
└── index.ts              # Main entry point
```

## Usage

### Import from main entry point

```typescript
import {
  exportFeedbackToPDF,
  exportFeedbackToDOC,
  exportAssessmentToPDF,
  exportAssessmentToDOC,
  exportAssessmentHistoryToPDF,
  exportAssessmentHistoryToDOC,
} from '@/app/lib/utils/export'
```

### Import specific functions

```typescript
import { exportFeedbackToPDF } from '@/app/lib/utils/export/pdf/feedback-pdf'
```

### Import utilities

```typescript
import { generateSafeFileName, getStatusLabel } from '@/app/lib/utils/export'
```

## Features

- **Modular Design**: Each export type is in its own file for better maintainability
- **Type Safety**: Full TypeScript support with shared interfaces
- **Utility Functions**: Common functions for file handling, text formatting, and status management
- **Backward Compatibility**: All existing imports continue to work
- **Clean API**: Simple and intuitive function signatures

## Export Functions

### Feedback Export

- `exportFeedbackToPDF()` - Export feedback as PDF
- `exportFeedbackToDOC()` - Export feedback as DOC

### Assessment Export

- `exportAssessmentToPDF()` - Export assessment report as PDF
- `exportAssessmentToDOC()` - Export assessment report as DOC

### Assessment History Export

- `exportAssessmentHistoryToPDF()` - Export assessment history as PDF
- `exportAssessmentHistoryToDOC()` - Export assessment history as DOC

## Utility Functions

### File Utils

- `generateSafeFileName()` - Create safe filenames
- `saveFile()` - Save files using file-saver
- `generateFeedbackFileName()` - Generate feedback filenames
- `generateAssessmentReportFileName()` - Generate assessment report filenames
- `generateAssessmentHistoryFileName()` - Generate assessment history filenames

### Text Utils

- `getFeedbackTypeLabel()` - Get display labels for feedback types
- `formatStudentScore()` - Format student scores
- `formatDate()` - Format dates for display
- `truncateText()` - Truncate text to specified length
- `cleanTextForExport()` - Clean and normalize text

### Status Utils

- `getStatusLabel()` - Get human-readable status labels
- `getStatusColor()` - Get CSS classes for status colors

## Dependencies

- `jspdf` - PDF generation
- `docx` - DOC generation
- `file-saver` - File download handling
