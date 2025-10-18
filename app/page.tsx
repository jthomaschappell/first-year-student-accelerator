'use client'

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { CalendarView } from '@/app/components/CalendarView';
import { AIAdvisorPanel } from '@/app/components/AIAdvisorPanel';
import { CoursePlanningTab } from '@/app/components/CoursePlanningTab';
import { CampusEventsWidget } from '@/app/components/CampusEventsWidget';
import { Calendar, BookOpen, GraduationCap } from 'lucide-react';
import { getAllCalendarEvents, getUpcomingDeadlines, getRelativeTimeDisplay } from '@/app/utils/scheduleUtils';

const DEADLINES_HEIGHT = 800; // px: Same as chatbot panel height, fixed for layout sync

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
      <h4 className="mb-3 text-white">Upcoming Deadlines</h4>
      <div
        className="flex-1 min-h-0 overflow-y-auto space-y-2 pb-2"
        style={{
          // The -48px accounts for (h4 title + padding)
          maxHeight: DEADLINES_HEIGHT - 48,
        }}
      >
        {deadlines.length === 0 && (
          <div className="text-slate-400 text-sm text-center py-16">No upcoming deadlines found.</div>
        )}
        {deadlines.map(deadline => (
          <div key={deadline.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-md">
            <div className="flex-1">
              <div className="text-slate-100">{deadline.title}</div>
              <div className="text-sm text-slate-400">
                {deadline.date &&
                  new Date(deadline.date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
              </div>
            </div>
            <Badge variant="outline" className="border-slate-600 text-slate-300">
              {deadline.date && getRelativeTimeDisplay(deadline.date, new Date(2025, 9, 18))}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const calendarEvents = getAllCalendarEvents();

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-700/50">
              <GraduationCap className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-white">First Year Student Accelerator</h1>
              <p className="text-slate-300">Your unified academic productivity hub</p>
            </div>
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
            <div className="flex flex-col xl:flex-row gap-6">
              {/* Main Content Area (Calendar) */}
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                  {/* Calendar View */}
                  <div className="xl:col-span-2">
                    <div className="space-y-4">
                      <Card className="p-6 h-[900px] bg-slate-900/95 backdrop-blur-md border-slate-800/50 shadow-2xl">
                        <CalendarView events={calendarEvents} />
                      </Card>
                    </div>
                  </div>

                  {/* Right Panel: Events + Chatbot, both same height, and Deadlines rectangle underneath */}
                  <div className="xl:col-span-1 flex flex-col gap-6 h-[900px] min-h-0">
                    {/* Stack Events + Chatbot, then Deadlines */}
                    <div className="flex-1 flex flex-col min-h-0 gap-6">
                      {/* Two columns: Events and AI side-by-side, each height = DEADLINES_HEIGHT */}
                      <div className="flex flex-col h-full min-h-0">
                        <div className="flex flex-col h-full min-h-0 gap-6 lg:flex-row xl:flex-col">
                          {/* Events */}
                          <div className="flex-1 min-h-0 overflow-y-auto">
                            <Card className="bg-slate-900/95 backdrop-blur-md border-slate-800/50 shadow-2xl p-4 h-[800px] flex flex-col min-h-0 overflow-hidden">
                              <CampusEventsWidget />
                            </Card>
                          </div>
                          {/* AI Panel */}
                          <div className="flex-1 min-h-0 overflow-y-hidden">
                            <Card className="h-[800px] bg-slate-900/95 backdrop-blur-md border-slate-800/50 shadow-2xl p-6 flex flex-col overflow-hidden">
                              <AIAdvisorPanel />
                            </Card>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Upcoming Deadlines bar/rectangle supports both above - spans full width & is always below */}
                    <div className="w-full">
                      <UpcomingDeadlinesPanel maxItems={20} />
                    </div>
                  </div>
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