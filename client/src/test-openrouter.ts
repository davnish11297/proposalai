// Test OpenRouter AI integration
import { getOpenRouterChatCompletion } from './services/api';

async function testOpenRouter() {
  console.log('🧪 Testing OpenRouter AI integration...');
  
  try {
    const result = await getOpenRouterChatCompletion([
      { role: 'user', content: 'Hello! Can you tell me a short joke?' }
    ]);
    
    console.log('✅ OpenRouter test successful!');
    console.log('🤖 AI Response:', result.choices[0].message.content);
    
    return result;
  } catch (error) {
    console.error('❌ OpenRouter test failed:', error);
    throw error;
  }
}

// Run the test
testOpenRouter(); 