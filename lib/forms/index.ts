// Core classes
export { GoogleFormsClient } from './forms-client';
export { GoogleAuth } from './auth';
export { GoogleFormsManager } from './manager';

// Example functions
export { createSampleForm } from './examples/create-form';
export { getFormDetails, runGetFormCLI } from './examples/get-form';
export { getFormResponses, runGetResponsesCLI } from './examples/list-responses';

// Types and errors
export * as FormTypes from './types/forms';
export * as FormErrors from './errors';

// Re-export commonly used types for convenience
export type {
  FormCreationRequest,
  QuestionItem,
  FormCreateItem,
  ImageFormItem,
  FormImage,
  FormResponse,
  ResponseAnswer,
  FormSubmissionResponse,
  GoogleFormsAPI,
  CreateFormResponse,
  GetFormResponse,
  ListResponsesResponse,
  BatchUpdateRequest
} from './types/forms';
