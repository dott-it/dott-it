import { google, forms_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GoogleAuth } from './auth';
import {
  FormCreationRequest,
  QuestionItem,
  CreateFormResponse,
  GetFormResponse,
  ListResponsesResponse,
  BatchUpdateRequest,
  GoogleFormsAPI
} from './types/forms';

export class GoogleFormsClient {
  private forms: GoogleFormsAPI | null = null;
  private auth: GoogleAuth;

  constructor() {
    this.auth = new GoogleAuth();
  }

  async initialize(): Promise<void> {
    try {
      const authClient = await this.auth.authenticate();
      this.forms = google.forms({ version: 'v1', auth: authClient });
      console.log('✅ Google Forms client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Forms client:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Initialize with a user OAuth access token (e.g. library export to teacher Drive).
   */
  async initializeWithAccessToken(accessToken: string): Promise<void> {
    const oauth2 = new OAuth2Client();
    oauth2.setCredentials({ access_token: accessToken });
    this.forms = google.forms({ version: 'v1', auth: oauth2 });
  }

  async createForm(request: FormCreationRequest): Promise<CreateFormResponse> {
    if (!this.forms) {
      throw new Error('Forms client not initialized. Call initialize() first.');
    }

    try {
      // documentTitle (Drive file name) is writable only on create; description needs batchUpdate.
      const response = await this.forms.forms.create({
        requestBody: {
          info: {
            title: request.title,
            documentTitle: request.title,
          },
        },
      });

      if (!response.data?.formId) {
        throw new Error('No data returned from form creation');
      }

      if (request.description?.trim()) {
        await this.forms.forms.batchUpdate({
          formId: response.data.formId,
          requestBody: {
            requests: [
              {
                updateFormInfo: {
                  info: {
                    description: request.description,
                  },
                  updateMask: 'description',
                },
              },
            ],
          },
        });
      }

      console.log('✅ Form created successfully');
      return response.data;
    } catch (error) {
      const message = (error as Error).message;
      const hint =
        /internal error/i.test(message) && !process.env.GOOGLE_FORMS_IMPERSONATE_USER
          ? ' Service accounts cannot own Forms — set GOOGLE_FORMS_IMPERSONATE_USER to a Workspace user with domain-wide delegation.'
          : '';
      console.error('❌ Error creating form:', message + hint);
      throw error;
    }
  }

  async getForm(formId: string): Promise<GetFormResponse> {
    if (!this.forms) {
      throw new Error('Forms client not initialized. Call initialize() first.');
    }

    try {
      const response = await this.forms.forms.get({ formId });
      
      if (!response.data) {
        throw new Error('No data returned from get form request');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error getting form:', (error as Error).message);
      throw error;
    }
  }

  async addQuestion(formId: string, question: QuestionItem): Promise<forms_v1.Schema$BatchUpdateFormResponse> {
    if (!this.forms) {
      throw new Error('Forms client not initialized. Call initialize() first.');
    }

    try {
      const request: BatchUpdateRequest = {
        requests: [{
          createItem: {
            item: question,
            location: { index: 0 }
          }
        }]
      };

      const response = await this.forms.forms.batchUpdate({
        formId,
        requestBody: request
      });
      
      console.log('✅ Question added successfully');
      
      if (!response.data) {
        throw new Error('No data returned from batch update');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error adding question:', (error as Error).message);
      throw error;
    }
  }

  async addMultipleQuestions(formId: string, questions: QuestionItem[]): Promise<forms_v1.Schema$BatchUpdateFormResponse> {
    if (!this.forms) {
      throw new Error('Forms client not initialized. Call initialize() first.');
    }

    try {
      const requests = questions.map((question, index) => ({
        createItem: {
          item: question,
          location: { index }
        }
      }));

      const request: BatchUpdateRequest = { requests };

      const response = await this.forms.forms.batchUpdate({
        formId,
        requestBody: request
      });
      
      console.log(`✅ ${questions.length} questions added successfully`);
      
      if (!response.data) {
        throw new Error('No data returned from batch update');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error adding questions:', (error as Error).message);
      throw error;
    }
  }

  async getResponses(formId: string, pageToken?: string): Promise<ListResponsesResponse> {
    if (!this.forms) {
      throw new Error('Forms client not initialized. Call initialize() first.');
    }

    try {
      const response = await this.forms.forms.responses.list({
        formId,
        ...(pageToken ? { pageToken } : {}),
      });
      
      if (!response.data) {
        throw new Error('No data returned from responses request');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error getting responses:', (error as Error).message);
      throw error;
    }
  }

  /**
   * List all form responses, following nextPageToken until exhausted.
   */
  async listAllResponses(formId: string): Promise<forms_v1.Schema$FormResponse[]> {
    const responses: forms_v1.Schema$FormResponse[] = []
    let pageToken: string | undefined

    do {
      const page = await this.getResponses(formId, pageToken)
      if (page.responses?.length) {
        responses.push(...page.responses)
      }
      pageToken = page.nextPageToken ?? undefined
    } while (pageToken)

    return responses
  }

  async getResponse(formId: string, responseId: string): Promise<forms_v1.Schema$FormResponse> {
    if (!this.forms) {
      throw new Error('Forms client not initialized. Call initialize() first.');
    }

    try {
      const response = await this.forms.forms.responses.get({ formId, responseId });
      
      if (!response.data) {
        throw new Error('No data returned from get response request');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error getting response:', (error as Error).message);
      throw error;
    }
  }
}
