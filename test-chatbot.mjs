import readline from 'readline';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const messages = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function checkServer() {
  const maxRetries = 10;
  const retryDelay = 2000;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'ping' }] })
      });
      
      const data = await response.json();
      if (data.message || data.error) {
        return true;
      }
    } catch (e) {
      // Server not ready
    }
    
    if (i < maxRetries - 1) {
      console.log(`\x1b[33mWaiting for server... (${i + 1}/${maxRetries})\x1b[0m`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  return false;
}

async function chat(userMessage) {
  messages.push({ role: 'user', content: userMessage });

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    const assistantMessage = data.message.content;
    messages.push({ role: 'assistant', content: assistantMessage });
    
    return assistantMessage;
  } catch (error) {
    // Remove the user message since we failed
    messages.pop();
    throw error;
  }
}

function prompt() {
  rl.question('\n\x1b[36mYou:\x1b[0m ', async (input) => {
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log('\x1b[33mGoodbye!\x1b[0m');
      rl.close();
      process.exit(0);
    }

    if (!input.trim()) {
      prompt();
      return;
    }

    try {
      const response = await chat(input);
      console.log(`\n\x1b[32mAssistant:\x1b[0m ${response}`);
    } catch (error) {
      console.error(`\x1b[31mError:\x1b[0m ${error.message}`);
    }

    prompt();
  });
}

console.log('\x1b[33m=== BYU Events & Assignments Chatbot ===\x1b[0m');
console.log('Checking server connection...\n');

const serverReady = await checkServer();

if (!serverReady) {
  console.error('\x1b[31mError: Could not connect to server at ' + baseUrl + '\x1b[0m');
  console.error('\x1b[31mMake sure the dev server is running: npm run dev\x1b[0m');
  process.exit(1);
}

console.log('\x1b[32m✓ Server connected\x1b[0m');
console.log('\nAsk about BYU events, teacher ratings, or assignments.');
console.log('Type "exit" or "quit" to end the conversation.\n');

prompt();

