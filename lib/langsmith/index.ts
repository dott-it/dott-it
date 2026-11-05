import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { AISuggestions, Answers, FeedbackSection } from "@/app/types";
import { parseModelFeedbackJson } from "@/lib/langsmith/parse-feedback-json";

// Initialize the LLM for educational assessment
const llm = new ChatOpenAI({
  model: "gpt-4.1-mini",
  temperature: 0.3, // Lower temperature for more consistent educational feedback
});

function unavailableAiSuggestions(): AISuggestions {
  return {
    id: '',
    studentAnswerId: '',
    rubricScore: '0/0',
    rubricEvaluation: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    feedback: [{
      id: '',
      feedbackId: '',
      discarted: false,
      used: false,
      type: 'error',
      section: 'Error',
      content: 'Unable to generate AI feedback. Please review manually.',
      order: 1
    }]
  };
}


/**
 * Generate AI suggestions for student assessment responses
 * Uses RAG with assessment instructions as context
 */
export async function generateAiResponse(
  instructions: string,
  studentAnswers: Answers[]
): Promise<AISuggestions> {
  try {
    // Filter out non-question answers (like student name)
    const questionAnswers = studentAnswers.filter(answer => 
      (answer.title.match(/^Question/) || answer.title.match(/^Directions/))||!(answer.title.toLowerCase().includes('student name')||answer.title.toLowerCase().includes('hour')||answer.title.toLowerCase().includes('name') || answer.title.toLowerCase().includes('Please write your name in this format: Last Name, First Name')) && 
      answer.value && 
      typeof answer.value === 'string' && 
      answer.value.trim() !== ''
    );

    if (questionAnswers.length === 0) {
      return {
        id: '', // Will be set by the database
        studentAnswerId: '', // Will be set by the database
        rubricScore: '0/0',
        
        rubricEvaluation: [{
          id: '',
          criterion: '',
          evaluation: '',
          points: '',
          rationale: ''
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
        feedback: [{
          id: '',
          feedbackId: '',
          discarted: false,
          used: false,
          type: 'general',
          section: 'No responses found',
          content: 'No valid responses were found to evaluate.',
          order: 1
        }]
      };
    }

 
    const questionstitle = questionAnswers.map((answer) => 
      ` (${answer.title})`
    ).join('\n\n')

    // Generate rubric score
    const prompt = `

    [Role and responsibilities]
You are a teacher evaluating a CER (Claim, Evidence, Reasoning) assessment. Read the student response below and provide feedback. Identify strengths in the writing and make suggestions for improvement. Make specific connections between student writing and the task criteria. 

[Context]
This assessment is made up of 3 parts in response to a scientific question. The 3 parts are: Claim, Evidence, Reasoning. The claim has a correct answer and typically reflects the scientific concept. The evidence are data to support the claim.  
Reasoning reflects the student's ability to make logical and scientific connection between the evidence and the claim. 

[Instructions]
1. Use the following "+" when evaluating reasoning responses.
+Includes logic statements that link the claim, evidence and science concepts (for example, using words like “because”, “therefore”, etc).
+Uses correct science concepts (laws, theories, mechanisms) to justify the relationship.
+Clearly explains the cause-and-effect link between claim and evidence.

2. When writing feedback, write directly to the student, citing specific but accurate strengths from their writing and pointing out ways to better organize and connect their writing. (i.e. "You provided strong evidence for... by stating that...") Use only verbatim examples from the student's writing. DO NOT MAKE ANYTHING UP. 

3. Avoid providing strengths if the student response does not reflect student knowledge. 

4. The student is in "learning mode" so use suggestions to elicit their understanding or probe deeper, but don't solve the explanation for them (i.e. Socratic style). Use clear and concise language and an encouraging, supportive tone. 

5. Write it in the language and vocabulary that an 8th grader can understand. Do not mention rubric and avoid using scientific jargons. 

6. Select up to 4 strengths and 4 suggestions that are the most, providing more feedback around reasoning. 

7. Identify ways to characterize the student's response. Use these questions to help characterize them. Does the claim demonstrate student knowledge? Do the evidence provided reflect key concept? Did the student show good understanding and knowledge by logically connecting the evidence to the claim? Did the student use logical statements such as "Because", "therefore," etc to communicate the connection?

STUDENT INSTRUCTIONS:

${questionstitle}
REVIEWER INSTRUCTIONS:
${instructions}
STUDENT RESPONSE:
${questionAnswers.map((answer) => 
  ` (${answer.title}): ${answer.value}`
).join('\n\n')}

Feedback directed to the student in an encouraging and strengths-based tone.
{
  "title": "feedback",
  "description": "Feedback directed to the student in an encouraging and strengths-based tone.",
  "type": "object",
  "properties": {
    "strengths": {
      "type": "array",
      "description": "Feedback, addressed to the student, describing the strengths seen in their writing, incorporating verbatim use of the student's text and specific reference to the assignment criteria. Use only the student response for evaluation of strengths.",
      "items": {
        "type": "string"
      }
    },
    "suggestions": {
      "type": "array",
      "description": "Guidance to the student on how to improve their writing, making specific reference to the assignment criteria and encouraging deeper connections, use of evidence, and organization.",
      "items": {
        "type": "string"
      }
    },
    "rubric_evaluations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "criterion": {
            "type": "string",
            "description": "name of the rubric criterion evaluated"
          },
          "evaluation": {
            "type": "string",
            "description": "category from the rubric that most closely matches the student sample"
          },
          "points": {
            "type": "string",
            "description": "points assigned, per the rubric"
          },
          "rationale": {
            "type": "string",
            "description": "reasoning behind the evaluation, citing evidence from student response"
          }
        },
        "required": []
      }
    },
    "characterization": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "characterizing the response quality in context of CER"
    }
  },
  "required": []
}
`;

    const promptResponse = await llm.invoke(prompt);

    console.log(promptResponse)
  
    const feedbackContent = promptResponse.content?.toString().trim() || '';

    console.log(feedbackContent)

    const parsedFeedback = parseModelFeedbackJson(feedbackContent);
    if (!parsedFeedback) {
      console.error('Error parsing feedback JSON');
      console.error('Raw feedback content:', feedbackContent);
      return unavailableAiSuggestions();
    }

    console.log(parsedFeedback)
    console.log('parsedFeedback')
    console.log(parsedFeedback.rubric_evaluations)
    // Convert to FeedbackSection format
    const feedbackSections: FeedbackSection[] = [];
    let order = 1;

    // Add strengths
    if (parsedFeedback.strengths) {
      for (const item of parsedFeedback.strengths) {
        feedbackSections.push({
          id: '',
          feedbackId: '',
          discarted: false,
          used: false,
          type: 'strength',
          section:'',
          content: item,
          order: order++
        });
      }
    }

    // Add suggestions
    if (parsedFeedback.suggestions) {
      for (const item of parsedFeedback.suggestions) {
        feedbackSections.push({
          id: '',
          feedbackId: '',
          discarted: false,
          used: false,
          type:  'suggestion',
          section:'',
          content: item,
          order: order++
        });
      }
    }
    

    // If no feedback sections were created, add a default one
    if (feedbackSections.length === 0) {
      feedbackSections.push({
        id: '',
        feedbackId: '',
        discarted: false,
        used: false,
        type: 'general',
        section: 'Feedback',
        content: 'Please review this submission and provide manual feedback.',
        order: 1
      });
    }

    return {
      id: '', // Will be set by the database
      studentAnswerId: '', // Will be set by the database
      createdAt: new Date(),
      updatedAt: new Date(),
      rubricScore: '0/0',
      rubricEvaluation:parsedFeedback.rubric_evaluations ,
      feedback: feedbackSections
    };

  } catch (error) {
    console.error('Error generating AI response:', error);
    return unavailableAiSuggestions();
  }
}
