'use client'

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { CalendarView } from '@/app/components/CalendarView';
import { AIAdvisorPanel } from '@/app/components/AIAdvisorPanel';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  color: string;
  type: 'class' | 'event' | 'deadline';
  day?: string;
  date?: string;
}

import { CoursePlanningTab } from '@/app/components/CoursePlanningTab';
import { CampusEventsWidget } from '@/app/components/CampusEventsWidget';
import { Calendar, BookOpen, GraduationCap } from 'lucide-react';
import { getAllCalendarEvents, getUpcomingDeadlines, getRelativeTimeDisplay } from '@/app/utils/scheduleUtils';

const PANEL_HEIGHT = 287; // px: Height for Events and AI panels
const CALENDAR_HEIGHT = 900; // px: Height for calendar
const DEADLINES_HEIGHT = CALENDAR_HEIGHT - PANEL_HEIGHT; // 100px: Fills remaining space to align with calendar bottom

import { ScrollArea } from '@/app/components/ui/scroll-area';

function UpcomingDeadlinesPanel({ maxItems = 20 }) {
  const deadlines = getUpcomingDeadlines(maxItems, new Date(2025, 9, 18));
  return (
    <Card
      className="bg-slate-900/95 backdrop-blur-md border-slate-800/50 shadow-2xl p-4 flex flex-col"
      style={{
        height: DEADLINES_HEIGHT,
        minHeight: DEADLINES_HEIGHT,
        maxHeight: DEADLINES_HEIGHT,
        width: '100%',
      }}
    >
      <h4 className="mb-3 text-white flex-shrink-0">Upcoming Deadlines</h4>
      <ScrollArea className="flex-1 overflow-auto">
        <div className="space-y-2 pr-4">
          {deadlines.length === 0 && (
            <div className="text-slate-400 text-sm text-center py-16">
              No upcoming deadlines found.
            </div>
          )}
          {deadlines.map(deadline => (
            <div 
              key={deadline.id} 
              className="flex items-center justify-between p-2 rounded-md border-l-4"
              style={{
                backgroundColor: deadline.color, // Full vibrant color to match calendar events
                borderLeftColor: deadline.color
              }}
            >
              <div className="flex-1">
                <div className="text-slate-100">{deadline.title}</div>
                <div className="text-xs text-slate-100">
                  {deadline.date &&
                    new Date(deadline.date + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                </div>
              </div>
              <Badge 
                variant="outline" 
                className="border-slate-600 text-slate-300"
                style={{
                  borderColor: deadline.color,
                  color: deadline.color
                }}
              >
                {deadline.date && getRelativeTimeDisplay(deadline.date, new Date(2025, 9, 18))}
              </Badge>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  
  // AI Advisor state
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize calendar events on mount
  useEffect(() => {
    setCalendarEvents(getAllCalendarEvents());
  }, []);

  // Load saved messages from localStorage on mount
  useEffect(() => {
    // Clear any corrupted localStorage data first
    try {
      const savedMessages = localStorage.getItem('ai-chat-messages');
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      }
    } catch (error) {
      console.error('Failed to load saved messages, clearing localStorage:', error);
      // Clear all localStorage to fix corruption
      localStorage.clear();
    }
  }, []);

  // Save messages to localStorage whenever messages change (limit to last 50 messages)
  useEffect(() => {
    if (messages.length > 0) {
      try {
        const messagesToSave = messages.slice(-50); // Keep only last 50 messages
        localStorage.setItem('ai-chat-messages', JSON.stringify(messagesToSave));
      } catch (error) {
        console.error('Failed to save messages to localStorage:', error);
        // Clear localStorage if it's full
        localStorage.removeItem('ai-chat-messages');
      }
    }
  }, [messages]);

  // Add event to calendar
  const addEvent = useCallback((event: CalendarEvent) => {
    setCalendarEvents(prev => [...prev, event]);
  }, []);

  // Clear localStorage function for debugging
  const clearLocalStorage = () => {
    localStorage.clear();
    setMessages([]);
    console.log('localStorage cleared');
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-700/50">
                <GraduationCap className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-white">First Year Student Accelerator</h1>
                <p className="text-slate-300">Your unified academic productivity hub</p>
              </div>
            </div>
            <button 
              onClick={clearLocalStorage}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Clear Storage
            </button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 shadow-lg">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
              <Calendar className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="course-planning" className="flex items-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
              <BookOpen className="w-4 h-4" />
              <span>Course Planning</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab: Calendar | Events+Chatbot atop Deadlines */}
          <TabsContent value="dashboard" className="mt-0">
            <div className="grid grid-cols-2 gap-6">
              {/* Left: Calendar View - 50% width */}
              <div className="col-span-1">
                <Card className="p-6 h-[900px] bg-slate-900/95 backdrop-blur-md border-slate-800/50 shadow-2xl">
                  <CalendarView events={calendarEvents} addEvent={addEvent} />
                </Card>
              </div>

              {/* Right Panel: Events + AI side-by-side, Deadlines below - 50% width */}
              <div className="col-span-1 flex flex-col gap-6">
                {/* Top row: Events and AI side-by-side */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Events */}
                  <div className="col-span-1">
                    <Card className="bg-slate-900/95 backdrop-blur-md border-slate-800/50 shadow-2xl p-4 h-[800px] flex flex-col overflow-hidden">
                      <CampusEventsWidget />
                    </Card>
                  </div>
                  {/* AI Panel */}
                  <div className="col-span-1">
                    <Card className="h-[800px] bg-slate-900/95 backdrop-blur-md border-slate-800/50 shadow-2xl p-6 flex flex-col overflow-hidden">
                      <AIAdvisorPanel 
                        messages={messages}
                        setMessages={setMessages}
                        input={input}
                        setInput={setInput}
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                        addEvent={addEvent}
                      />
                    </Card>
                  </div>
                </div>

                {/* Bottom: Upcoming Deadlines - full width */}
                <div className="w-full">
                  <UpcomingDeadlinesPanel maxItems={20} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Course Planning Tab */}
          <TabsContent value="course-planning" className="mt-0">
            <Card className="p-6 h-[800px] bg-slate-900/95 backdrop-blur-md border-slate-800/50 shadow-2xl">
              <CoursePlanningTab />
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-slate-400">
          <p>Spring 2025 Semester • Last updated: January 20, 2025</p>
          <p className="mt-1 text-xs">
            Data sources: Static schedules & course catalog • Live campus events feed
          </p>
        </div>
      </div>
    </div>
  );
}