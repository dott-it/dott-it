import { forms_v1 } from 'googleapis';

export interface FormCreationRequest {
  title: string;
  description?: string;
}

export interface FormImage {
  sourceUri: string;
  altText?: string;
}

export interface QuestionItem {
  title: string;
  /** Longer prompt / context under the header (Forms Item.description). */
  description?: string;
  questionItem: {
    question: {
      required: boolean;
      textQuestion?: {
        paragraph: boolean;
      };
      choiceQuestion?: {
        type: 'RADIO' | 'CHECKBOX' | 'DROP_DOWN';
        options: Array<{ value: string }>;
      };
      scaleQuestion?: {
        low: number;
        high: number;
        lowLabel?: string;
        highLabel?: string;
      };
      fileUploadQuestion?: {
        folderId: string;
        maxFiles?: number;
        maxFileSize?: string;
        types?: Array<'ANY' | 'DOCUMENT' | 'PRESENTATION' | 'SPREADSHEET' | 'DRAWING' | 'PDF' | 'IMAGE' | 'VIDEO' | 'AUDIO'>;
      };
    };
    /** Optional figure shown with the question (Forms API QuestionItem.image). */
    image?: FormImage;
  };
}

/** Standalone image block placed before a question when a prompt has multiple figures. */
export interface ImageFormItem {
  /** Short question/section header (Forms Item.title). */
  title?: string;
  /** Context under the header in the same card (Forms Item.description). */
  description?: string;
  imageItem: {
    image: FormImage;
  };
}

/** Static title/description block (section intros, tables as text). */
export interface TextFormItem {
  title: string;
  description?: string;
  textItem: Record<string, never>;
}

/** Payload accepted by Forms createItem in digitize / export flows. */
export type FormCreateItem = QuestionItem | ImageFormItem | TextFormItem;

export interface FormResponse {
  formId: string;
  responderUri: string;
  info: {
    title: string;
    description?: string;
  };
  items?: QuestionItem[];
}

export interface ResponseAnswer {
  questionId: string;
  textAnswers?: {
    answers: Array<{ value: string }>;
  };
  textAnswer?: {
    value: string;
  };
}

export interface FormSubmissionResponse {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  answers: Record<string, ResponseAnswer>;
}

export type GoogleFormsAPI = forms_v1.Forms;
export type CreateFormResponse = forms_v1.Schema$Form;
export type GetFormResponse = forms_v1.Schema$Form;
export type ListResponsesResponse = forms_v1.Schema$ListFormResponsesResponse;
export type BatchUpdateRequest = forms_v1.Schema$BatchUpdateFormRequest;