'use client'

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Sparkles, Send } from 'lucide-react';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIAdvisorPanel() {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your BYU AI advisor. Ask me about campus events, courses, professor ratings, or your assignments!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const parseMessageContent = (content: string) => {
    // First check if this is a pre-formatted event artifact
    if (content.includes('<div class="event-artifact"')) {
      const eventArtifacts = [];
      let processedContent = content;
      
      // More robust regex that matches complete event-artifact divs with all nested content
      // This matches the opening tag and finds the matching closing tag by counting div depth
      const matches: string[] = [];
      let startPos = 0;
      
      while (true) {
        const startIndex = processedContent.indexOf('<div class="event-artifact"', startPos);
        if (startIndex === -1) break;
        
        // Find matching closing tag by counting div depth
        let depth = 0;
        let i = startIndex;
        let endIndex = -1;
        
        while (i < processedContent.length) {
          if (processedContent.substring(i, i + 4) === '<div') {
            depth++;
            i += 4;
          } else if (processedContent.substring(i, i + 6) === '</div>') {
            depth--;
            if (depth === 0) {
              endIndex = i + 6;
              break;
            }
            i += 6;
          } else {
            i++;
          }
        }
        
        if (endIndex !== -1) {
          const artifactHtml = processedContent.substring(startIndex, endIndex);
          matches.push(artifactHtml);
          eventArtifacts.push({
            placeholder: `__EVENT_${eventArtifacts.length}__`,
            html: artifactHtml
          });
          startPos = endIndex;
        } else {
          break;
        }
      }
      
      // Remove all matched artifacts from content
      matches.forEach(match => {
        processedContent = processedContent.replace(match, '');
      });

      // Extract any regular text content and clean it up
      const textContent = processedContent
        .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
        .trim();
      
      return {
        content: textContent ? [
          <div key="text" className="mb-4">
            {textContent}
          </div>
        ] : [],
        eventArtifacts
      };
    }

    // If not an event listing, process normally
    const eventArtifacts: Array<{ placeholder: string; html: string }> = [];
    let processedContent = content;
    
    // Extract and replace buttons with placeholders
    const buttons: Array<{ placeholder: string; onClick: string; text: string }> = [];
    processedContent = processedContent.replace(/<button[^>]*onclick="([^"]*)"[^>]*>(.*?)<\/button>/g, (match, onClick, buttonText) => {
      const placeholder = `__BUTTON_${buttons.length}__`;
      buttons.push({ placeholder, onClick, text: buttonText });
      return placeholder;
    });

    // Extract and replace images with placeholders
    const images: Array<{ placeholder: string; alt: string; url: string }> = [];
    processedContent = processedContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
      const placeholder = `__IMAGE_${images.length}__`;
      images.push({ placeholder, alt, url });
      return placeholder;
    });

    return {
      content: content.split('\n').map((line: string, lineIdx: number) => {
        const parts = line.split(/(__BUTTON_\d+__|__IMAGE_\d+__)/g);
        
        return (
          <div key={lineIdx} className="mb-2">
            {parts.map((part: string, partIdx: number) => {
              const button = buttons.find(b => b.placeholder === part);
              if (button) {
                return (
                  <Button
                    key={partIdx}
                    size="sm"
                    className="ml-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-full border-2 border-blue-300 shadow-md inline-flex items-center gap-2 font-medium"
                    onClick={() => {
                      console.log('add to calendar');
                    }}
                  >
                    {button.text}
                  </Button>
                );
              }
              
              const image = images.find(img => img.placeholder === part);
              if (image) {
                return (
                  <div key={partIdx} className="my-3">
                    <img 
                      src={image.url} 
                      alt={image.alt} 
                      className="rounded-lg max-w-full h-auto shadow-lg"
                      style={{ maxHeight: '300px', objectFit: 'cover' }}
                    />
                  </div>
                );
              }
              
              let textContent = part;
              textContent = textContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
              textContent = textContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">$1</a>');
              
              return <span key={partIdx} dangerouslySetInnerHTML={{ __html: textContent }} />;
            })}
          </div>
        );
      }),
      eventArtifacts
    };
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: messages.concat(userMessage).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await response.json();
      const aiMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        <h2 className="text-white">AI Study Advisor</h2>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 pr-4 mb-4">
        <div className="space-y-4">
          {messages.map(message => {
            const parsed = parseMessageContent(message.content);
            return (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  <Card className={`p-4 ${message.role === 'user' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg' : 'bg-slate-800/80 backdrop-blur-sm border-slate-700/50 text-slate-100'}`}>
                    <div className="whitespace-pre-wrap">
                      {/* Regular content */}
                      {parsed.content}
                      
                      {/* Event Artifacts - rendered inside chat message */}
                      {parsed.eventArtifacts.length > 0 && (
                        <div className="space-y-4 mt-4">
                          {parsed.eventArtifacts.map((artifact, idx) => (
                            <div 
                              key={idx}
                              className="transform transition-all duration-200 hover:scale-[1.02]"
                              dangerouslySetInnerHTML={{ __html: artifact.html }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                  <div className="text-xs text-slate-500 mt-1 px-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="p-4 bg-slate-800/80 backdrop-blur-sm border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-sm">Thinking...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything about your schedule or courses..."
          className="flex-1 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
        />
        <Button onClick={handleSend} disabled={!input.trim() || isLoading} className="bg-indigo-600 hover:bg-indigo-500">
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
          onClick={() => {
            setInput("What should I focus on today?");
          }}
        >
          What should I focus on today?
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
          onClick={() => {
            setInput("Help me plan my study time");
          }}
        >
          Plan my study time
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
          onClick={() => {
            setInput("Tell me about my professors");
          }}
        >
          About my professors
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
          onClick={() => {
            setInput("What events are happening this week?");
          }}
        >
          This week's events
        </Button>
      </div>
    </div>
  );
}
