'use client'

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getUpcomingDeadlines, getRelativeTimeDisplay } from '@/app/utils/scheduleUtils';

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

interface CalendarViewProps {
  events: CalendarEvent[];
}

export function CalendarView({ events }: CalendarViewProps) {
  const [view, setView] = useState<'daily' | 'weekly'>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 20)); // Jan 20, 2025 (Monday)

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM

  // Map day abbreviations to full day names
  const dayAbbreviationMap: { [key: string]: string } = {
    'M': 'Monday',
    'T': 'Tuesday', 
    'W': 'Wednesday',
    'Th': 'Thursday',
    'F': 'Friday'
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getEventPosition = (startTime: string, endTime: string) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    const startMinutes = (startH - 7) * 60 + startM;
    const duration = (endH * 60 + endM) - (startH * 60 + startM);
    
    return {
      top: `${(startMinutes / 60) * 80}px`,
      height: `${(duration / 60) * 80}px`
    };
  };

  const getCurrentDayEvents = () => {
    const dayName = weekDays[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1];
    return events.filter(event => {
      if (event.date === currentDate.toISOString().split('T')[0]) return true;
      
      // Handle day abbreviations
      const eventDay = event.day;
      if (!eventDay) return false;
      
      const mappedDay = dayAbbreviationMap[eventDay] || eventDay;
      return mappedDay === dayName;
    });
  };

  const getWeekEvents = (day: string) => {
    return events.filter(event => {
      // Handle both full day names and abbreviations
      const eventDay = event.day;
      if (!eventDay) return false;
      
      // If event has abbreviation, map it to full day name
      const mappedDay = dayAbbreviationMap[eventDay] || eventDay;
      return mappedDay === day;
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'daily') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const formatDateHeader = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    if (view === 'weekly') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - (currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('en-US', options);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <h2 className="text-white">My Schedule</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg">
            <Button
              variant={view === 'daily' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('daily')}
              className="px-3 data-[active=true]:bg-slate-700 data-[active=true]:text-white hover:bg-slate-700 hover:text-white text-slate-400"
              data-active={view === 'daily'}
            >
              Day
            </Button>
            <Button
              variant={view === 'weekly' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('weekly')}
              className="px-3 data-[active=true]:bg-slate-700 data-[active=true]:text-white hover:bg-slate-700 hover:text-white text-slate-400"
              data-active={view === 'weekly'}
            >
              Week
            </Button>
          </div>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={() => navigateDate('prev')} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-slate-300">{formatDateHeader()}</span>
        <Button variant="outline" size="sm" onClick={() => navigateDate('next')} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        {view === 'weekly' ? (
          <div className="grid grid-cols-6 gap-2 min-w-[800px]">
            {/* Time Column */}
            <div className="col-span-1">
              <div className="h-12 border-b border-slate-700/50"></div>
              {hours.map(hour => (
                <div key={hour} className="h-20 border-b border-slate-700/50 flex items-start justify-end pr-2 text-slate-500">
                  <span className="text-sm">{hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'PM' : 'AM'}</span>
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDays.slice(0, 5).map(day => (
              <div key={day} className="relative">
                <div className="h-12 border-b border-l border-slate-700/50 flex items-center justify-center">
                  <span className="text-slate-300">{day.slice(0, 3)}</span>
                </div>
                <div className="relative">
                  {hours.map(hour => (
                    <div key={hour} className="h-20 border-b border-l border-slate-700/50"></div>
                  ))}
                  {/* Events for this day */}
                  <div className="absolute inset-0 pointer-events-none">
                    {getWeekEvents(day).map(event => {
                      const position = getEventPosition(event.startTime, event.endTime);
                      return (
                        <div
                          key={event.id}
                          className="absolute left-1 right-1 rounded-md p-2 text-white pointer-events-auto overflow-hidden"
                          style={{
                            top: position.top,
                            height: position.height,
                            backgroundColor: event.color,
                            minHeight: '40px'
                          }}
                        >
                          <div className="text-xs opacity-90">{formatTime(event.startTime)}</div>
                          <div className="text-sm mt-1">{event.title}</div>
                          {event.location && (
                            <div className="text-xs opacity-75 mt-1 truncate">{event.location}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-2">
            {/* Time Column */}
            <div className="col-span-1">
              {hours.map(hour => (
                <div key={hour} className="h-20 border-b border-slate-700/50 flex items-start justify-end pr-2 text-slate-500">
                  <span className="text-sm">{hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'PM' : 'AM'}</span>
                </div>
              ))}
            </div>

            {/* Single Day Column */}
            <div className="col-span-5 relative">
              {hours.map(hour => (
                <div key={hour} className="h-20 border-b border-l border-slate-700/50"></div>
              ))}
              {/* Events for current day */}
              <div className="absolute inset-0 pointer-events-none">
                {getCurrentDayEvents().map(event => {
                  const position = getEventPosition(event.startTime, event.endTime);
                  return (
                    <div
                      key={event.id}
                      className="absolute left-2 right-2 rounded-md p-3 text-white pointer-events-auto"
                      style={{
                        top: position.top,
                        height: position.height,
                        backgroundColor: event.color
                      }}
                    >
                      <div className="text-sm opacity-90">{formatTime(event.startTime)} - {formatTime(event.endTime)}</div>
                      <h4 className="mt-1 text-white">{event.title}</h4>
                      {event.location && (
                        <div className="text-sm opacity-75 mt-2">{event.location}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Deadlines */}
      <Card className="mt-4 p-4 bg-slate-800/80 backdrop-blur-sm border-slate-700/50">
        <h4 className="mb-3 text-white">Upcoming Deadlines</h4>
        <div className="space-y-2">
          {getUpcomingDeadlines(5, new Date(2025, 9, 18)).map(deadline => (
            <div key={deadline.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded-md">
              <div className="flex-1">
                <div className="text-slate-100">{deadline.title}</div>
                <div className="text-sm text-slate-400">
                  {deadline.date && new Date(deadline.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })} • {deadline.date && getRelativeTimeDisplay(deadline.date, new Date(2025, 9, 18))}
                </div>
              </div>
              <Badge variant="outline" className="border-slate-600 text-slate-300">{deadline.type}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
