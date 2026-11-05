import { google } from "googleapis";
import { NextResponse } from "next/server";

const TOPIC_NAME = `projects/teste-2b734/subscriptions/testsubscription`;

export async function POST() {
  try {
    // TODO: Authenticate with Google APIs
    const auth = new google.auth.GoogleAuth({
      // Scopes for both Forms and Pub/Sub
      scopes: [
        'https://www.googleapis.com/auth/forms.body',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/pubsub'
    ],
    });

    const forms = google.forms({ version: "v1", auth });

    // 1. Create a new form
    const createFormResponse = await forms.forms.create({
        requestBody: {
            info: {
                title: 'New Mock Student Form',
                documentTitle: 'Mock Student Form',
            },
        },
    });

    const formId = createFormResponse.data.formId;
    if (!formId) {
        return NextResponse.json({ error: 'Failed to create form' }, { status: 500 });
    }

    // 2. Set a watch on the form
    const watchResponse = await forms.forms.watches.create({
        formId: formId,
        requestBody: {
            watch: {
                target: {
                    topic: {
                        topicName: TOPIC_NAME,
                    },
                },
                eventType: 'RESPONSES',
            },
        },
    });

    return NextResponse.json({ 
        message: 'Form created and watch set successfully',
        formId: formId,
        watch: watchResponse.data 
    }, { status: 200 });

  } catch (error) {
    console.error('Error in Google Forms API endpoint:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
