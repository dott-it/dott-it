import { GoogleFormsClient } from '../forms-client';

export async function getFormResponses(formId: string): Promise<void> {
  const client = new GoogleFormsClient();
  await client.initialize();

  try {
    const responses = await client.getResponses(formId);
    
    console.log('Total responses:', responses.responses ? responses.responses.length : 0);
    
    if (responses.responses && responses.responses.length > 0) {
      for (const [index, response] of responses.responses.entries()) {
        console.log(`\n--- Response ${index + 1} ---`);
        console.log('Response ID:', response.responseId || 'No ID');
        console.log('Created:', response.createTime || 'No timestamp');
        console.log('Last submitted:', response.lastSubmittedTime || 'No timestamp');
        
        if (response.answers) {
          for (const [questionId, answer] of Object.entries(response.answers)) {
            const textAnswer = answer.textAnswers?.answers?.[0]?.value || 
                             'No answer provided';
            console.log(`Question ID ${questionId}: ${textAnswer}`);
          }
        } else {
          console.log('No answers found for this response');
        }
      }
    } else {
      console.log('No responses found for this form');
    }
  } catch (error) {
    console.error('❌ Error getting form responses:', (error as Error).message);
    throw error;
  }
}

export async function runGetResponsesCLI(): Promise<void> {
  const formId = process.argv[2];
  
  if (!formId || formId === 'your-form-id-here') {
    throw new Error('Please provide a form ID as argument: npm run forms:responses -- YOUR_FORM_ID');
  }
  
  await getFormResponses(formId);
}
