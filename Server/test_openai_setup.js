/**
 * OpenAI API Setup Test Script
 * 测试 OpenAI API 配置是否正确
 * 
 * Usage:
 *   node test_openai_setup.js
 */

require('dotenv').config();

const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

console.log('='.repeat(60));
console.log('🤖 OpenAI API Configuration Test');
console.log('='.repeat(60));

// Check 1: API Key exists
console.log('\n📋 Check 1: API Key Configuration');
if (!API_KEY) {
  console.log('❌ FAILED: OPENAI_API_KEY not found in .env file');
  console.log('\n💡 How to fix:');
  console.log('   1. Create a .env file in the Server/ directory');
  console.log('   2. Add this line: OPENAI_API_KEY=sk-your-key-here');
  console.log('   3. Get your API key from: https://platform.openai.com/api-keys');
  process.exit(1);
} else if (API_KEY === 'sk-your-api-key-here' || API_KEY === 'your_openai_api_key_here') {
  console.log('❌ FAILED: API Key is still the placeholder value');
  console.log('\n💡 How to fix:');
  console.log('   Replace "your_openai_api_key_here" with your actual API key');
  console.log('   Get it from: https://platform.openai.com/api-keys');
  process.exit(1);
} else if (!API_KEY.startsWith('sk-')) {
  console.log('⚠️  WARNING: API Key format looks incorrect');
  console.log(`   Current value: ${API_KEY.substring(0, 10)}...`);
  console.log('   OpenAI keys usually start with "sk-"');
} else {
  console.log(`✅ PASSED: API Key found (${API_KEY.substring(0, 10)}...)`);
}

// Check 2: Model configuration
console.log('\n📋 Check 2: Model Configuration');
console.log(`✅ Model: ${MODEL}`);
if (MODEL.includes('gpt-4')) {
  console.log('   ⚠️  Note: GPT-4 is more expensive but more accurate');
} else {
  console.log('   ✅ GPT-3.5 is fast and cost-effective');
}

// Check 3: Node.js version
console.log('\n📋 Check 3: Node.js Version');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion < 18) {
  console.log(`❌ FAILED: Node.js ${nodeVersion} is too old`);
  console.log('   Fetch API requires Node.js 18 or higher');
  console.log('   Please upgrade: https://nodejs.org/');
  process.exit(1);
} else {
  console.log(`✅ PASSED: Node.js ${nodeVersion}`);
}

// Check 4: Test API connection
console.log('\n📋 Check 4: Testing API Connection...');
async function testAPIConnection() {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.log('❌ FAILED: API Connection Error');
      console.log('   Status:', response.status);
      console.log('   Error:', error.error?.message || 'Unknown error');
      
      if (response.status === 401) {
        console.log('\n💡 How to fix:');
        console.log('   Your API key is invalid or expired');
        console.log('   Get a new key from: https://platform.openai.com/api-keys');
      } else if (response.status === 429) {
        console.log('\n💡 How to fix:');
        console.log('   Rate limit exceeded or quota exhausted');
        console.log('   Check your usage: https://platform.openai.com/usage');
      }
      
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ PASSED: API Connection Successful');
    console.log(`   Available models: ${data.data.length}`);
    
    // Check if configured model is available
    const hasModel = data.data.some(m => m.id === MODEL);
    if (hasModel) {
      console.log(`   ✅ Model "${MODEL}" is available`);
    } else {
      console.log(`   ⚠️  Model "${MODEL}" not found in your account`);
      console.log('   Available GPT models:');
      data.data
        .filter(m => m.id.includes('gpt'))
        .slice(0, 5)
        .forEach(m => console.log(`      - ${m.id}`));
    }

  } catch (error) {
    console.log('❌ FAILED: Network Error');
    console.log('   Error:', error.message);
    console.log('\n💡 Possible causes:');
    console.log('   - No internet connection');
    console.log('   - Firewall blocking OpenAI API');
    console.log('   - OpenAI service is down');
    process.exit(1);
  }
}

// Check 5: Test recommendation API
async function testRecommendationAPI() {
  console.log('\n📋 Check 5: Testing AI Recommendation Logic...');
  
  try {
    const testPrompt = {
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond with a simple JSON object: {"status": "ok"}'
        },
        {
          role: 'user',
          content: 'Test message'
        }
      ],
      temperature: 0.7,
      max_tokens: 50,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(testPrompt),
    });

    if (!response.ok) {
      const error = await response.json();
      console.log('❌ FAILED: Chat Completion Error');
      console.log('   Status:', response.status);
      console.log('   Error:', error.error?.message || 'Unknown error');
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ PASSED: AI Chat Completion Working');
    console.log(`   Response received: ${data.choices[0].message.content.substring(0, 50)}...`);
    console.log(`   Tokens used: ${data.usage.total_tokens}`);
    console.log(`   Estimated cost: $${(data.usage.total_tokens / 1000 * 0.002).toFixed(6)}`);

  } catch (error) {
    console.log('❌ FAILED: Chat Completion Test Error');
    console.log('   Error:', error.message);
    process.exit(1);
  }
}

// Run all tests
(async () => {
  await testAPIConnection();
  await testRecommendationAPI();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 All Tests Passed!');
  console.log('='.repeat(60));
  console.log('\n✅ Your OpenAI API is configured correctly');
  console.log('✅ AI Recommendations are ready to use');
  console.log('\n💡 Next steps:');
  console.log('   1. Start the server: node server.js');
  console.log('   2. Open the web app: http://localhost:3000');
  console.log('   3. Login and click "🤖 Get AI Recommendations"');
  console.log('\n📚 For more info, see: AI_RECOMMENDATIONS_SETUP.md');
  console.log('='.repeat(60));
})();


