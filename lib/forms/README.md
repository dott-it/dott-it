# Google Forms API Integration

A comprehensive TypeScript implementation for integrating with Google Forms API in your Next.js application.

## Features

- ✅ **Full Google Forms API Support**: Create forms, add questions, get responses
- ✅ **TypeScript Integration**: Complete type safety with proper interfaces
- ✅ **Authentication**: Service account-based authentication with proper scopes
- ✅ **Error Handling**: Custom error classes for different failure scenarios
- ✅ **Modern ES Modules**: Uses modern JavaScript patterns and ESLint compliance
- ✅ **CLI Tools**: Ready-to-use command line scripts for common operations

## Prerequisites

1. **Google Cloud Project**: You need a Google Cloud project with Forms API enabled
2. **Service Account**: Create a service account with proper permissions
3. **Credentials File**: Download the service account JSON key file

## Setup Instructions

### 1. Enable Google Forms API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Library"
4. Search for "Google Forms API" and click "Enable"

### 2. Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the details:
   - **Name**: `forms-api-service`
   - **ID**: `forms-api-service`
   - **Description**: `Service account for Forms API access`
4. Click "Create and Continue"
5. Skip role assignment (click "Continue")
6. Click "Done"

### 3. Generate Service Account Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Select "JSON" format
5. Click "Create" - this downloads your credentials file
6. Save this file as `google-credentials.json` in your project root

### 4. Environment Configuration

Create or update your `.env.local` file:

```env
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
```

**Important**: Add `google-credentials.json` to your `.gitignore` file to avoid committing sensitive credentials.

## Usage

### Basic Usage

```typescript
import { GoogleFormsClient } from '@/lib/forms';

const client = new GoogleFormsClient();
await client.initialize();

// Create a new form
const form = await client.createForm({
  title: 'My Survey',
  description: 'Please fill out this survey'
});

console.log('Form URL:', form.responderUri);
```

### Adding Questions

```typescript
import { QuestionItem } from '@/lib/forms/types/forms';

const questions: QuestionItem[] = [
  {
    title: 'What is your name?',
    questionItem: {
      question: {
        required: true,
        textQuestion: {
          paragraph: false
        }
      }
    }
  },
  {
    title: 'How satisfied are you?',
    questionItem: {
      question: {
        required: true,
        choiceQuestion: {
          type: 'RADIO',
          options: [
            { value: 'Very Satisfied' },
            { value: 'Satisfied' },
            { value: 'Neutral' },
            { value: 'Dissatisfied' }
          ]
        }
      }
    }
  }
];

await client.addMultipleQuestions(form.formId, questions);
```

### Getting Form Responses

```typescript
const responses = await client.getResponses(formId);
console.log('Total responses:', responses.responses?.length || 0);

if (responses.responses) {
  for (const response of responses.responses) {
    console.log('Response ID:', response.responseId);
    // Process answers...
  }
}
```

## CLI Commands

The integration includes convenient npm scripts for common operations:

### Create a Sample Form

```bash
npm run forms:create
```

This creates a sample customer feedback survey with multiple question types.

### Get Form Details

```bash
npm run forms:get -- YOUR_FORM_ID
```

Replace `YOUR_FORM_ID` with an actual Google Form ID to see form structure and questions.

### List Form Responses

```bash
npm run forms:responses -- YOUR_FORM_ID
```

Shows all responses submitted to the specified form.

## API Reference

### GoogleFormsClient

The main client class for interacting with Google Forms API.

#### Methods

- `initialize()`: Initialize the client with authentication
- `createForm(request)`: Create a new Google Form
- `getForm(formId)`: Get form details and structure
- `addQuestion(formId, question)`: Add a single question to a form
- `addMultipleQuestions(formId, questions)`: Add multiple questions at once
- `getResponses(formId)`: Get all responses for a form
- `getResponse(formId, responseId)`: Get a specific response

### Question Types

#### Text Question

```typescript
{
  title: 'Question text',
  questionItem: {
    question: {
      required: true,
      textQuestion: {
        paragraph: false // true for long text, false for short text
      }
    }
  }
}
```

#### Multiple Choice Question

```typescript
{
  title: 'Choose one option',
  questionItem: {
    question: {
      required: true,
      choiceQuestion: {
        type: 'RADIO', // or 'CHECKBOX', 'DROP_DOWN'
        options: [
          { value: 'Option 1' },
          { value: 'Option 2' }
        ]
      }
    }
  }
}
```

#### Scale Question

```typescript
{
  title: 'Rate from 1 to 10',
  questionItem: {
    question: {
      required: true,
      scaleQuestion: {
        low: 1,
        high: 10,
        lowLabel: 'Poor',
        highLabel: 'Excellent'
      }
    }
  }
}
```

## Error Handling

The integration includes custom error classes for better error handling:

```typescript
import { FormErrors } from '@/lib/forms';

try {
  await client.createForm({ title: 'My Form' });
} catch (error) {
  if (error instanceof FormErrors.AuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof FormErrors.FormNotFoundError) {
    console.error('Form not found:', error.message);
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

### Available Error Types

- `GoogleFormsError`: Base error class
- `AuthenticationError`: Authentication failures
- `FormNotFoundError`: Form not found (404)
- `FormCreationError`: Form creation failures
- `InvalidRequestError`: Invalid request parameters

## Security Best Practices

1. **Never commit credentials**: Always add `google-credentials.json` to `.gitignore`
2. **Use environment variables**: Store sensitive configuration in `.env.local`
3. **Limit service account permissions**: Only grant necessary scopes
4. **Rotate credentials regularly**: Update service account keys periodically

## Troubleshooting

### Authentication Errors

- Verify `GOOGLE_APPLICATION_CREDENTIALS` path is correct
- Ensure the credentials file exists and is valid JSON
- Check that the service account has proper permissions

### API Errors

- Verify Google Forms API is enabled in your Google Cloud project
- Check API quotas and limits in Google Cloud Console
- Ensure form IDs are valid and accessible

### TypeScript Errors

- Run `npm run build` to check for compilation errors
- Ensure all dependencies are installed: `npm install`
- Check that TypeScript configuration is compatible

## Integration with Your Application

### Using in React Components

```typescript
'use client';

import { useState } from 'react';
import { GoogleFormsClient, FormCreationRequest } from '@/lib/forms';

export function CreateFormComponent() {
  const [formUrl, setFormUrl] = useState<string>('');
  
  const handleCreateForm = async () => {
    const client = new GoogleFormsClient();
    await client.initialize();
    
    const form = await client.createForm({
      title: 'User Survey',
      description: 'Please provide your feedback'
    });
    
    setFormUrl(form.responderUri || '');
  };
  
  return (
    <div>
      <button onClick={handleCreateForm}>
        Create Form
      </button>
      {formUrl && (
        <a href={formUrl} target="_blank" rel="noopener noreferrer">
          Open Form
        </a>
      )}
    </div>
  );
}
```

### Using in API Routes

```typescript
// app/api/forms/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleFormsClient } from '@/lib/forms';

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json();
    
    const client = new GoogleFormsClient();
    await client.initialize();
    
    const form = await client.createForm({ title, description });
    
    return NextResponse.json({
      success: true,
      formId: form.formId,
      formUrl: form.responderUri
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
```

## Contributing

When contributing to this integration:

1. Follow the existing TypeScript patterns
2. Add proper error handling for new methods
3. Update type definitions as needed
4. Add tests for new functionality
5. Update this documentation

## License

This integration follows the same license as the main project.
