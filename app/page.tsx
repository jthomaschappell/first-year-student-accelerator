'use client'

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Card } from '@/app/components/ui/card';
import { CalendarView } from '@/app/components/CalendarView';
import { AIAdvisorPanel } from '@/app/components/AIAdvisorPanel';
import { CoursePlanningTab } from '@/app/components/CoursePlanningTab';
import { CampusEventsWidget } from '@/app/components/CampusEventsWidget';
import { Calendar, Sparkles, BookOpen, GraduationCap } from 'lucide-react';
import { getAllCalendarEvents } from '@/app/utils/scheduleUtils';

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

          {/* Dashboard Tab with AI Sidebar */}
          <TabsContent value="dashboard" className="mt-0">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Main Content Area */}
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Calendar View */}
                  <div className="xl:col-span-2">
                    <Card className="p-6 h-[800px] bg-slate-900/95 backdrop-blur-md border-slate-800/50 shadow-2xl">
                      <CalendarView events={calendarEvents} />
                    </Card>
                  </div>

                  {/* Campus Events */}
                  <div className="xl:col-span-1">
                    <div className="h-[800px]">
                      <CampusEventsWidget />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Advisor Sidebar */}
              <div className="w-full lg:w-[420px] xl:w-[480px]">
                <Card className="h-[800px] bg-slate-900/95 backdrop-blur-md border-slate-800/50 shadow-2xl p-6 flex flex-col overflow-hidden">
                  <AIAdvisorPanel />
                </Card>
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
