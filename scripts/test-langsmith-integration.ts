import "dotenv/config";

// Dados de teste simulando uma resposta do Google Forms
const testFormData = {
  items: [
    {
      questionItem: {
        question: {
          questionId: "q1"
        }
      },
      title: "Question 1: Explain the relationship between producers, consumers, and decomposers"
    },
    {
      questionItem: {
        question: {
          questionId: "q2"
        }
      },
      title: "Question 2: Describe how energy flows through a food chain"
    },
    {
      questionItem: {
        question: {
          questionId: "q3"
        }
      },
      title: "Question 3: Give examples of producers, consumers, and decomposers"
    },
    {
      questionItem: {
        question: {
          questionId: "name"
        }
      },
      title: "Student Name"
    }
  ]
};

const testResponseData = [
  {
    responseId: "test-response-123",
    respondentEmail: "test@example.com",
    lastSubmittedTime: new Date().toISOString(),
    answers: {
      "q1": {
        textAnswers: {
          answers: [{
            value: "Producers make their own food using sunlight. Consumers eat other organisms to get energy. Decomposers break down dead organisms and return nutrients to the soil."
          }]
        }
      },
      "q2": {
        textAnswers: {
          answers: [{
            value: "Energy flows from the sun to producers, then to primary consumers, then to secondary consumers. Each level gets less energy because some is lost as heat."
          }]
        }
      },
      "q3": {
        textAnswers: {
          answers: [{
            value: "Producers: grass, trees, algae. Consumers: rabbits, wolves, humans. Decomposers: bacteria, fungi, worms."
          }]
        }
      },
      "name": {
        textAnswers: {
          answers: [{
            value: "João Silva"
          }]
        }
      }
    }
  }
];

async function testEndpoint() {
  console.log("🧪 Testing Complete LangSmith Integration...\n");
  
  try {
    // Simular chamada para o endpoint
    const response = await fetch('http://localhost:3000/api/forms/test-form-id/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formData: testFormData,
        responseData: testResponseData
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log("✅ Endpoint test successful!");
      console.log("📊 Response:", result);
    } else {
      console.error("❌ Endpoint test failed:", result);
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.log("\n💡 Make sure your Next.js server is running:");
    console.log("   npm run dev");
  }
}

// Executar o teste
testEndpoint();
