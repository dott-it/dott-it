// Script temporário para testar o service de update
const testUpdateService = async () => {
  // Primeiro, vamos tentar criar um assessment para testar
  console.log('🧪 Testando service de update de assessment...')
  
  try {
    // Tentar criar um assessment primeiro
    const createResponse = await fetch('http://localhost:3000/api/assessments/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Assessment for Update',
        type: 'Formative',
        subject: 'Science',
        grade: 8,
        studentInstructions: 'Test instructions'
      })
    })
    
    const createResult = await createResponse.json()
    console.log('📝 Resultado da criação:', createResult)
    
    if (createResult.id) {
      const assessmentId = createResult.id
      console.log(`✅ Assessment criado com ID: ${assessmentId}`)
      
      // Agora testar o update
      console.log('🔄 Testando update...')
      const updateResponse = await fetch(`http://localhost:3000/api/assessments/${assessmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'live',
          instructions: 'Instruções atualizadas para teste',
          numberOfQuestions: 10
        })
      })
      
      const updateResult = await updateResponse.json()
      console.log('✅ Resultado do update:', updateResult)
      
      if (updateResponse.ok) {
        console.log('🎉 Teste do service de update PASSOU!')
        console.log('📊 Dados atualizados:', {
          status: updateResult.status,
          instructions: updateResult.instructions,
          numberOfQuestions: updateResult.numberOfQuestions
        })
      } else {
        console.log('❌ Teste do service de update FALHOU!')
        console.log('Erro:', updateResult)
      }
    } else {
      console.log('❌ Não foi possível criar assessment para testar')
      console.log('Erro:', createResult)
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

// Executar o teste
testUpdateService()
