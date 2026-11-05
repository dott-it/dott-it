import { createFormWithQuestionsViaFetch } from './forms-api-fetch'
import { GoogleFormsClient } from './forms-client'
import { FormCreationRequest, FormCreateItem, QuestionItem, CreateFormResponse } from './types/forms'
import { FormCreationError, FormNotFoundError } from './errors'

/**
 * High-level manager class for Google Forms operations
 * Provides simplified interface for common form management tasks
 */
export class GoogleFormsManager {
  private client: GoogleFormsClient
  private initialized = false
  private accessToken: string | null = null

  constructor() {
    this.client = new GoogleFormsClient()
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.client.initialize()
      this.accessToken = null
      this.initialized = true
    }
  }

  /**
   * Use a teacher OAuth access token instead of the service account.
   */
  async initializeWithAccessToken(accessToken: string): Promise<void> {
    this.accessToken = accessToken
    this.initialized = true
  }

  /**
   * Create a complete form with questions in one operation
   */
  async createFormWithQuestions(
    formRequest: FormCreationRequest,
    questions: FormCreateItem[],
  ): Promise<CreateFormResponse> {
    try {
      // Next.js route handlers: prefer fetch to avoid googleapis/undici gzip errors.
      if (this.accessToken) {
        return await createFormWithQuestionsViaFetch(this.accessToken, formRequest, questions)
      }

      if (!this.initialized) {
        await this.initialize()
      }

      const form = await this.client.createForm(formRequest)

      if (!form.formId) {
        throw new FormCreationError('Form created but no ID returned')
      }

      const questionOnly = questions.filter(
        (item): item is QuestionItem => 'questionItem' in item,
      )
      if (questionOnly.length > 0) {
        await this.client.addMultipleQuestions(form.formId, questionOnly)
      }

      return form
    } catch (error) {
      throw new FormCreationError(`Failed to create form: ${(error as Error).message}`)
    }
  }

  /**
   * Create a survey form with common question types
   */
  async createSurveyForm(title: string, description?: string): Promise<CreateFormResponse> {
    const questions: QuestionItem[] = [
      {
        title: 'What is your name?',
        questionItem: {
          question: {
            required: true,
            textQuestion: { paragraph: false }
          }
        }
      },
      {
        title: 'How would you rate your overall experience?',
        questionItem: {
          question: {
            required: true,
            scaleQuestion: {
              low: 1,
              high: 5,
              lowLabel: 'Poor',
              highLabel: 'Excellent'
            }
          }
        }
      },
      {
        title: 'Would you recommend us to others?',
        questionItem: {
          question: {
            required: true,
            choiceQuestion: {
              type: 'RADIO',
              options: [
                { value: 'Definitely' },
                { value: 'Probably' },
                { value: 'Not sure' },
                { value: 'Probably not' },
                { value: 'Definitely not' }
              ]
            }
          }
        }
      },
      {
        title: 'Any additional comments or suggestions?',
        questionItem: {
          question: {
            required: false,
            textQuestion: { paragraph: true }
          }
        }
      }
    ];

    return this.createFormWithQuestions(
      { title, description },
      questions
    );
  }

  /**
   * Create a feedback form for assessments
   */
  async createAssessmentFeedbackForm(assessmentTitle: string): Promise<CreateFormResponse> {
    const questions: QuestionItem[] = [
      {
        title: 'Student Name',
        questionItem: {
          question: {
            required: true,
            textQuestion: { paragraph: false }
          }
        }
      },
      {
        title: 'How challenging was this assessment?',
        questionItem: {
          question: {
            required: true,
            choiceQuestion: {
              type: 'RADIO',
              options: [
                { value: 'Too easy' },
                { value: 'Just right' },
                { value: 'Challenging but fair' },
                { value: 'Too difficult' }
              ]
            }
          }
        }
      },
      {
        title: 'Rate your understanding of the topic (1-10)',
        questionItem: {
          question: {
            required: true,
            scaleQuestion: {
              low: 1,
              high: 10,
              lowLabel: 'No understanding',
              highLabel: 'Complete understanding'
            }
          }
        }
      },
      {
        title: 'What did you find most helpful in this assessment?',
        questionItem: {
          question: {
            required: false,
            textQuestion: { paragraph: true }
          }
        }
      },
      {
        title: 'What could be improved?',
        questionItem: {
          question: {
            required: false,
            textQuestion: { paragraph: true }
          }
        }
      }
    ];

    return this.createFormWithQuestions(
      {
        title: `Feedback: ${assessmentTitle}`,
        description: `Please provide your feedback on the "${assessmentTitle}" assessment.`
      },
      questions
    );
  }

  /**
   * Get form details with error handling
   */
  async getFormDetails(formId: string) {
    await this.initialize();

    try {
      return await this.client.getForm(formId);
    } catch {
      throw new FormNotFoundError(formId);
    }
  }

  /**
   * Get form responses with summary statistics
   */
  async getFormResponsesSummary(formId: string) {
    await this.initialize();

    const responses = await this.client.getResponses(formId);
    const form = await this.getFormDetails(formId);

    return {
      form: {
        title: form.info?.title || undefined,
        description: form.info?.description || undefined,
        questionCount: form.items?.length || 0
      },
      responses: {
        total: responses.responses?.length || 0,
        data: responses.responses || []
      }
    };
  }

  /**
   * Handle form creation for the current form generation page
   */
  async handleCreateForm(request: FormCreationRequest): Promise<{
    success: boolean;
    formId?: string;
    formUrl?: string;
    error?: string;
  }> {
    try {
      await this.initialize();
      
      const form = await this.client.createForm(request);
      
      return {
        success: true,
        formId: form.formId || undefined,
        formUrl: form.responderUri || undefined
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
}
