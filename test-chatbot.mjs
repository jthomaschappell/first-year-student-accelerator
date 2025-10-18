import readline from 'readline';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const messages = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function chat(userMessage) {
  messages.push({ role: 'user', content: userMessage });

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });

  const data = await response.json();
  const assistantMessage = data.message.content;
  
  messages.push({ role: 'assistant', content: assistantMessage });
  
  return assistantMessage;
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
console.log('Ask about BYU events, teacher ratings, or assignments.');
console.log('Type "exit" or "quit" to end the conversation.\n');

prompt();

