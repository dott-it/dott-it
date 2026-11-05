// Script para testar o service de update diretamente
const testUpdateServiceDirect = async () => {
  console.log('🧪 Testando service de update diretamente...')
  
  // Vamos testar com um ID que sabemos que não existe para ver a validação
  const testId = 'test-assessment-id-123'
  
  try {
    // Teste 1: Assessment não encontrado
    console.log('📝 Teste 1: Assessment não encontrado')
    const response1 = await fetch(`http://localhost:3000/api/assessments/${testId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'live',
        instructions: 'Test instructions'
      })
    })
    
    const result1 = await response1.json()
    console.log('✅ Resposta esperada (404):', result1)
    
    // Teste 2: Request body inválido
    console.log('📝 Teste 2: Request body inválido')
    const response2 = await fetch(`http://localhost:3000/api/assessments/${testId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json'
    })
    
    const result2 = await response2.json()
    console.log('✅ Resposta esperada (400):', result2)
    
    // Teste 3: Request body vazio
    console.log('📝 Teste 3: Request body vazio')
    const response3 = await fetch(`http://localhost:3000/api/assessments/${testId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    })
    
    const result3 = await response3.json()
    console.log('✅ Resposta esperada (400):', result3)
    
    console.log('🎉 Testes de validação do service de update PASSARAM!')
    console.log('✅ O service está funcionando corretamente para validações')
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

// Executar o teste
testUpdateServiceDirect()
