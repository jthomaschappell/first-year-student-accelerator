'use client'

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Badge } from '@/app/components/ui/badge';
import { Sparkles, Send, Clock, BookOpen, Calendar as CalendarIcon, Lightbulb } from 'lucide-react';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reasoning?: string[];
  proposals?: Proposal[];
}

interface Proposal {
  id: string;
  type: 'study-block' | 'calendar-event' | 'focus-area';
  title: string;
  description: string;
  time?: string;
  duration?: string;
}

export function AIAdvisorPanel() {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI study advisor. I can help you plan your day, suggest study strategies, and answer questions about your courses. What would you like to focus on today?",
      timestamp: new Date(),
      reasoning: [
        "It's Monday morning, typically a good time for planning the week ahead",
        "You have CS 101 at 9:00 AM today",
        "Assignment 1 for CS 101 is due in 2 days"
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock AI responses based on common queries
  const generateMockResponse = (query: string): AIMessage => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('today') || lowerQuery.includes('focus')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Based on your schedule and upcoming deadlines, here's what I recommend focusing on today:",
        timestamp: new Date(),
        reasoning: [
          "You have CS 101 Assignment 1 due on Wednesday (in 2 days)",
          "Your Calculus II homework is due Thursday",
          "You have a 2-hour gap between classes from 11:00 AM to 1:00 PM today",
          "Your CS study group meets at 4:00 PM, which is a good opportunity to review"
        ],
        proposals: [
          {
            id: 'p1',
            type: 'study-block',
            title: 'Work on CS Assignment 1',
            description: 'Focus on completing the variables and loops assignment. Aim to finish at least 60% today.',
            time: '11:00 AM',
            duration: '90 minutes'
          },
          {
            id: 'p2',
            type: 'study-block',
            title: 'Review Calculus concepts',
            description: 'Go through homework problems and identify areas that need clarification for office hours tomorrow.',
            time: '2:00 PM',
            duration: '45 minutes'
          },
          {
            id: 'p3',
            type: 'focus-area',
            title: 'Prepare questions for study group',
            description: 'List any CS concepts you want to discuss during the study group session.',
            time: '3:30 PM',
            duration: '15 minutes'
          }
        ]
      };
    }
    
    if (lowerQuery.includes('professor') || lowerQuery.includes('instructor')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I can help you understand your professors' teaching styles. Which instructor would you like to know more about?",
        timestamp: new Date(),
        reasoning: [
          "Dr. Sarah Chen (CS 101) has a 4.8 rating - known for clear explanations",
          "Prof. Michael Torres (Math 201) has a 4.5 rating but is challenging (4.1 difficulty)",
          "Dr. Emily Rodriguez (ENG 150) is highly rated for constructive feedback"
        ]
      };
    }
    
    if (lowerQuery.includes('math') || lowerQuery.includes('calculus')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "For your Calculus II course, I recommend:",
        timestamp: new Date(),
        reasoning: [
          "Prof. Torres moves quickly through material",
          "Homework sets are essential for exam preparation",
          "Office hours on Tuesday at 3:00 PM are highly beneficial"
        ],
        proposals: [
          {
            id: 'p1',
            type: 'calendar-event',
            title: 'Attend Math Office Hours',
            description: 'Visit Prof. Torres to clarify integration techniques before the homework is due.',
            time: 'Tuesday, 3:00 PM',
            duration: '30 minutes'
          },
          {
            id: 'p2',
            type: 'study-block',
            title: 'Complete Homework Set 1',
            description: 'Work through all problems. Flag difficult ones to discuss in office hours.',
            time: 'Today, 6:00 PM',
            duration: '2 hours'
          }
        ]
      };
    }
    
    // Default response
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: "I'm here to help! I can assist with planning your study schedule, understanding your courses, preparing for exams, and optimizing your academic routine. What specific aspect would you like help with?",
      timestamp: new Date(),
      reasoning: [
        "You have 4 courses this semester with varying difficulty levels",
        "Multiple assignments due this week",
        "Good balance of STEM and humanities courses"
      ]
    };
  };

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateMockResponse(input);
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const getProposalIcon = (type: Proposal['type']) => {
    switch (type) {
      case 'study-block':
        return <BookOpen className="w-4 h-4" />;
      case 'calendar-event':
        return <CalendarIcon className="w-4 h-4" />;
      case 'focus-area':
        return <Lightbulb className="w-4 h-4" />;
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
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                <Card className={`p-4 ${message.role === 'user' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg' : 'bg-slate-800/80 backdrop-blur-sm border-slate-700/50 text-slate-100'}`}>
                  <p>{message.content}</p>
                  
                  {message.reasoning && message.reasoning.length > 0 && (
                    <div className={`mt-4 pt-4 ${message.role === 'user' ? 'border-t border-white/20' : 'border-t border-slate-700/50'}`}>
                      <div className={`flex items-center gap-2 mb-2 ${message.role === 'user' ? 'text-white/80' : 'text-slate-400'}`}>
                        <Lightbulb className="w-4 h-4" />
                        <span className="text-sm">Why I suggest this:</span>
                      </div>
                      <ul className={`space-y-1 text-sm ${message.role === 'user' ? 'text-white/70' : 'text-slate-400'}`}>
                        {message.reasoning.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className={message.role === 'user' ? 'text-white' : 'text-indigo-400'}>•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {message.proposals && message.proposals.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {message.proposals.map(proposal => (
                        <Card key={proposal.id} className="p-3 bg-slate-700/50 backdrop-blur-sm border-slate-600/50">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-md bg-indigo-500/20 text-indigo-400">
                              {getProposalIcon(proposal.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm text-slate-100">{proposal.title}</h4>
                                <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                                  {proposal.type.replace('-', ' ')}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-400 mt-1">{proposal.description}</p>
                              {proposal.time && (
                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {proposal.time}
                                  </div>
                                  {proposal.duration && <span>• {proposal.duration}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
                <div className="text-xs text-slate-500 mt-1 px-2">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
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
      </div>
    </div>
  );
}
