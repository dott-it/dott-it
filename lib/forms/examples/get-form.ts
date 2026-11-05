import { GoogleFormsClient } from '../forms-client';

export async function getFormDetails(formId: string): Promise<void> {
  const client = new GoogleFormsClient();
  await client.initialize();

  try {
    const form = await client.getForm(formId);
    
    console.log('Form Title:', form.info?.title || 'No title');
    console.log('Form Description:', form.info?.description || 'No description');
    console.log('Number of items:', form.items ? form.items.length : 0);
    
    if (form.items) {
      for (const [index, item] of form.items.entries()) {
        console.log(`Question ${index + 1}:`, item.title || 'Untitled question');
        
        // Display question type
        const question = item.questionItem?.question;
        if (question?.textQuestion) {
          console.log(`  Type: Text ${question.textQuestion.paragraph ? '(Paragraph)' : '(Short)'}`);
        } else if (question?.choiceQuestion) {
          console.log(`  Type: ${question.choiceQuestion.type}`);
          console.log(`  Options: ${question.choiceQuestion.options?.map(opt => opt.value).join(', ')}`);
        } else if (question?.scaleQuestion) {
          console.log(`  Type: Scale (${question.scaleQuestion.low}-${question.scaleQuestion.high})`);
        }
        console.log(`  Required: ${question?.required ? 'Yes' : 'No'}\n`);
      }
    }
  } catch (error) {
    console.error('❌ Error getting form details:', (error as Error).message);
    throw error;
  }
}

export async function runGetFormCLI(): Promise<void> {
  const formId = process.argv[2];
  
  if (!formId || formId === 'your-form-id-here') {
    throw new Error('Please provide a form ID as argument: npm run forms:get -- YOUR_FORM_ID');
  }
  
  await getFormDetails(formId);
}
