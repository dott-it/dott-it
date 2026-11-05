import { GoogleFormsClient } from '../forms-client';
import { QuestionItem } from '../types/forms';

export async function createSampleForm(): Promise<void> {
  const client = new GoogleFormsClient();
  await client.initialize();

  try {
    // Create a new form
    const form = await client.createForm({
      title: 'Customer Feedback Survey',
      description: 'Please provide your feedback about our service'
    });

    if (!form.formId || !form.responderUri) {
      throw new Error('Form creation failed - missing required fields');
    }

    console.log('Form ID:', form.formId);
    console.log('Form URL:', form.responderUri);

    // Define questions
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
        title: 'How satisfied are you with our service?',
        questionItem: {
          question: {
            required: true,
            choiceQuestion: {
              type: 'RADIO',
              options: [
                { value: 'Very Satisfied' },
                { value: 'Satisfied' },
                { value: 'Neutral' },
                { value: 'Dissatisfied' },
                { value: 'Very Dissatisfied' }
              ]
            }
          }
        }
      },
      {
        title: 'Rate our service (1-10)',
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
    ];

    // Add all questions at once
    await client.addMultipleQuestions(form.formId, questions);

    console.log('✅ Form created with all questions!');
  } catch (error) {
    console.error('❌ Error in createSampleForm:', (error as Error).message);
    throw error;
  }
}
