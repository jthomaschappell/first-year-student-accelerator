'use client'

import { useState, useEffect } from 'react';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Search, BookOpen, Star, Users, TrendingUp, Calendar, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { professorRatings } from '@/app/data/mockCourses';

// Define the course type based on our API response
interface Section {
  sectionNumber: string;
  instructorName: string | null;
  mode: string;
  times: Array<{
    days: string;
    startTime: string;
    endTime: string;
    building: string | null;
    room: string | null;
  }>;
}

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  description: string;
  prerequisites: string[];
  instructors: string[];
  schedule: string;
  department: string;
  level: string;
  sections: Section[];
}

// Define teacher rating interface
interface TeacherRating {
  id: string;
  legacyId: number;
  firstName: string;
  lastName: string;
  department: string;
  school: string;
  avgRating: number;
  avgDifficulty: number;
  numRatings: number;
  wouldTakeAgainPercent: number;
}

// Define scheduled section interface
interface ScheduledSection {
  id: string;
  courseCode: string;
  courseName: string;
  sectionNumber: string;
  instructorName: string | null;
  times: Array<{
    days: string;
    startTime: string;
    endTime: string;
    building: string | null;
    room: string | null;
  }>;
  color: string;
}

export function CoursePlanningTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [teacherRatings, setTeacherRatings] = useState<TeacherRating[]>([]);
  const [scheduledSections, setScheduledSections] = useState<ScheduledSection[]>([]);
  const [calendarView, setCalendarView] = useState<'daily' | 'weekly'>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 11)); // Nov 11, 2025

  // Load teacher ratings data on component mount
  useEffect(() => {
    const loadTeacherRatings = async () => {
      try {
        const response = await fetch('/api/teacher-ratings');
        const data = await response.json();
        setTeacherRatings(data);
      } catch (error) {
        console.error('Error loading teacher ratings:', error);
      }
    };
    loadTeacherRatings();
  }, []);

  // Fetch courses when search query changes
  useEffect(() => {
    const fetchCourses = async () => {
      if (!searchQuery.trim()) {
        setCourses([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/courses/search?q=${encodeURIComponent(searchQuery)}&limit=50`);
        const data = await response.json();
        setCourses(data.courses || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchCourses, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Helper function to find professor rating by name
  const findProfessorRating = (professorName: string): TeacherRating | null => {
    if (!professorName || !teacherRatings.length) return null;
    
    // Try exact match first
    let rating = teacherRatings.find(teacher => 
      `${teacher.firstName} ${teacher.lastName}`.trim() === professorName.trim()
    );
    
    // If no exact match, try partial match
    if (!rating) {
      const nameParts = professorName.trim().split(' ');
      if (nameParts.length >= 2) {
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        rating = teacherRatings.find(teacher => 
          teacher.firstName.trim() === firstName && 
          teacher.lastName.trim() === lastName
        );
      }
    }
    
    return rating || null;
  };

  // Helper function to get unique professors from course sections
  const getUniqueProfessors = (course: Course): string[] => {
    const professors = course.sections
      .map(section => section.instructorName)
      .filter((name): name is string => name !== null && name.trim() !== '' && name !== 'TBA')
      .filter((name, index, array) => array.indexOf(name) === index); // Remove duplicates
    
    return professors;
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-orange-600';
  };

  // Calendar helper functions
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
    // Check if time already has AM/PM
    if (time.includes('AM') || time.includes('PM')) {
      return time;
    }
    
    // Handle 24-hour format
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const parseTimeToMinutes = (timeStr: string) => {
    // Handle 12-hour format like "11:00 AM" or "2:00 PM"
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const ampm = timeMatch[3].toUpperCase();
      
      // Convert to 24-hour format
      if (ampm === 'PM' && hours !== 12) {
        hours += 12;
      } else if (ampm === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return hours * 60 + minutes;
    }
    
    // Fallback for 24-hour format like "11:00" or "14:00"
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const getEventPosition = (startTime: string, endTime: string) => {
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    
    // Debug logging
    console.log('Event times:', { startTime, endTime, startMinutes, endMinutes });
    
    // Calculate position relative to 7:00 AM (420 minutes)
    const startMinutesFrom7AM = startMinutes - 420; // 7:00 AM = 420 minutes
    const duration = endMinutes - startMinutes;
    
    const topPosition = (startMinutesFrom7AM / 60) * 80;
    const height = (duration / 60) * 80;
    
    console.log('Calculated position:', { startMinutesFrom7AM, duration, topPosition, height });
    
    return {
      top: `${topPosition}px`,
      height: `${height}px`
    };
  };

  const getWeekEvents = (day: string) => {
    const events = scheduledSections.flatMap(section => 
      section.times.flatMap(time => {
        const eventDay = time.days;
        if (!eventDay) return [];
        
        // Handle multiple day abbreviations (e.g., "MWF", "TTh", "M W F")
        const dayAbbreviations = eventDay.split(/\s+/).flatMap(dayStr => 
          dayStr.split(/(?=[A-Z])/).filter(abbr => abbr.length > 0)
        );
        const mappedDays = dayAbbreviations.map(abbr => dayAbbreviationMap[abbr] || abbr);
        
        // Create separate events for each day this course meets
        return mappedDays
          .filter(mappedDay => mappedDay === day)
          .map(mappedDay => ({
            id: `${section.id}-${mappedDay}-${time.startTime}`,
            title: `${section.courseCode} - Section ${section.sectionNumber}`,
            startTime: time.startTime,
            endTime: time.endTime,
            location: time.building && time.room ? `${time.building} ${time.room}` : 'TBA',
            color: section.color,
            type: 'class' as const,
            day: mappedDay
          }));
      })
    );
    
    // Debug logging
    if (scheduledSections.length > 0) {
      console.log(`Day: ${day}, Scheduled sections:`, scheduledSections.length, 'Events found:', events.length);
      if (events.length > 0) {
        console.log('Events for', day, ':', events.map(e => ({ title: e.title, time: e.startTime })));
      }
    }
    
    return events;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (calendarView === 'daily') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const formatDateHeader = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    if (calendarView === 'weekly') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - (currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('en-US', options);
  };

  // Section management functions
  const generateSectionId = (course: Course, section: Section) => {
    return `${course.id}-${section.sectionNumber}`;
  };

  const isSectionScheduled = (course: Course, section: Section) => {
    const sectionId = generateSectionId(course, section);
    return scheduledSections.some(s => s.id === sectionId);
  };

  const addSectionToSchedule = (course: Course, section: Section) => {
    const sectionId = generateSectionId(course, section);
    
    // Check if section is already scheduled to avoid duplicates
    if (scheduledSections.some(s => s.id === sectionId)) {
      return;
    }
    
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
    const color = colors[scheduledSections.length % colors.length];

    const newScheduledSection: ScheduledSection = {
      id: sectionId,
      courseCode: course.code,
      courseName: course.name,
      sectionNumber: section.sectionNumber,
      instructorName: section.instructorName,
      times: section.times,
      color: color
    };

    setScheduledSections(prev => {
      const updated = [...prev, newScheduledSection];
      console.log('Added section to schedule:', newScheduledSection);
      console.log('Total scheduled sections:', updated.length);
      return updated;
    });
    
    // Clear search query and show calendar
    setSearchQuery('');
    setSelectedCourse(null);
  };

  const removeSectionFromSchedule = (course: Course, section: Section) => {
    const sectionId = generateSectionId(course, section);
    setScheduledSections(prev => prev.filter(s => s.id !== sectionId));
  };

  const removeCourseFromSchedule = (courseCode: string) => {
    setScheduledSections(prev => prev.filter(s => s.courseCode !== courseCode));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex items-center gap-3 mb-6 flex-shrink-0">
        <BookOpen className="w-5 h-5 text-indigo-400" />
        <h2 className="text-white">Course Planning</h2>
      </div>

      {/* Search and Filters - Fixed */}
      <div className="space-y-3 mb-6 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses by name, code, or department..."
            className="pl-10 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
          />
        </div>
        
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
        {/* Course List - Left Column */}
        <ScrollArea className="flex-1 overflow-auto h-full">
          <div className="space-y-1.5 pr-4">
              {!searchQuery.trim() ? (
                <div className="h-full flex items-center justify-center py-16">
                  <div className="text-center text-slate-400">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Search for courses to get started</p>
                    <p className="text-sm mt-1">Try searching by course name, code, or department</p>
                  </div>
                </div>
              ) : loading ? (
                <div className="h-full flex items-center justify-center py-16">
                  <div className="text-center text-slate-400">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50 animate-pulse" />
                    <p>Searching courses...</p>
                  </div>
                </div>
              ) : courses.length === 0 ? (
                <div className="h-full flex items-center justify-center py-16">
                  <div className="text-center text-slate-400">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No courses found</p>
                    <p className="text-sm mt-1">Try adjusting your search terms</p>
                  </div>
                </div>
              ) : (
                courses.map(course => (
                  <Card
                    key={course.id}
                    className={`p-2 cursor-pointer transition-all hover:shadow-md ${
                      selectedCourse?.id === course.id ? 'bg-slate-700/80 border-indigo-500/50 shadow-md' : 'bg-slate-800/80 backdrop-blur-sm border-slate-700/50 hover:bg-slate-800'
                    }`}
                    onClick={() => setSelectedCourse(course)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs py-0">{course.code}</Badge>
                          <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs py-0">{course.level}</Badge>
                        </div>
                        <h4 className="mb-1 text-slate-100 text-sm">{course.name}</h4>
                        <p className="text-xs text-slate-400 mb-1 line-clamp-1">
                          {course.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{course.credits} credits</span>
                          <span>• {course.department}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
          </div>
        </ScrollArea>

        {/* Course Details / Calendar - Right Column */}
        <ScrollArea className="flex-1 overflow-auto h-full">
          {!searchQuery.trim() ? (
            /* Calendar View when no search query */
            <div className="flex flex-col h-full">
              {/* Calendar Header Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-white">My Schedule</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg">
                    <Button
                      variant={calendarView === 'daily' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setCalendarView('daily')}
                      className="px-3 data-[active=true]:bg-slate-700 data-[active=true]:text-white hover:bg-slate-700 hover:text-white text-slate-400"
                      data-active={calendarView === 'daily'}
                    >
                      Day
                    </Button>
                    <Button
                      variant={calendarView === 'weekly' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setCalendarView('weekly')}
                      className="px-3 data-[active=true]:bg-slate-700 data-[active=true]:text-white hover:bg-slate-700 hover:text-white text-slate-400"
                      data-active={calendarView === 'weekly'}
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
                {calendarView === 'weekly' ? (
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
                                  className="absolute left-1 right-1 rounded-md p-2 text-white pointer-events-auto overflow-hidden group"
                                  style={{
                                    top: position.top,
                                    height: position.height,
                                    backgroundColor: event.color,
                                    minHeight: '40px'
                                  }}
                                >
                                  <div className="flex justify-between items-start h-full">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs opacity-90">{formatTime(event.startTime)}</div>
                                      <div className="text-sm mt-1">{event.title}</div>
                                      {event.location && (
                                        <div className="text-xs opacity-75 mt-1 truncate">{event.location}</div>
                                      )}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeCourseFromSchedule(event.title.split(' - ')[0]);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2 p-1 rounded-full hover:bg-white/20 flex-shrink-0"
                                      title="Remove course from schedule"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Daily View */
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
                        {scheduledSections.flatMap(section => 
                          section.times
                            .filter(time => {
                              const dayName = weekDays[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1];
                              const eventDay = time.days;
                              if (!eventDay) return false;
                              
                              // Handle multiple day abbreviations (e.g., "MWF", "TTh", "M W F")
                              const dayAbbreviations = eventDay.split(/\s+/).flatMap(dayStr => 
                                dayStr.split(/(?=[A-Z])/).filter(abbr => abbr.length > 0)
                              );
                              const mappedDays = dayAbbreviations.map(abbr => dayAbbreviationMap[abbr] || abbr);
                              
                              return mappedDays.includes(dayName);
                            })
                            .map(time => {
                              const position = getEventPosition(time.startTime, time.endTime);
                              return (
                                <div
                                  key={`${section.id}-${time.days}-${time.startTime}`}
                                  className="absolute left-2 right-2 rounded-md p-3 text-white pointer-events-auto group"
                                  style={{
                                    top: position.top,
                                    height: position.height,
                                    backgroundColor: section.color
                                  }}
                                >
                                  <div className="flex justify-between items-start h-full">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm opacity-90">{formatTime(time.startTime)} - {formatTime(time.endTime)}</div>
                                      <h4 className="mt-1 text-white">{section.courseCode} - Section {section.sectionNumber}</h4>
                                      {time.building && time.room && (
                                        <div className="text-sm opacity-75 mt-2">{time.building} {time.room}</div>
                                      )}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeCourseFromSchedule(section.courseCode);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2 p-1 rounded-full hover:bg-white/20 flex-shrink-0"
                                      title="Remove course from schedule"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Scheduled Courses Summary */}
              {scheduledSections.length > 0 && (
                <Card className="mt-4 p-4 bg-slate-800/80 backdrop-blur-sm border-slate-700/50">
                  <h4 className="text-white mb-3">Scheduled Courses ({scheduledSections.length})</h4>
                  <div className="space-y-2">
                    {scheduledSections.map(section => (
                      <div key={section.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded-md">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: section.color }}
                          ></div>
                          <div>
                            <span className="text-sm text-slate-100">{section.courseCode} - Section {section.sectionNumber}</span>
                            <p className="text-xs text-slate-400">{section.courseName}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const course = courses.find(c => c.id === section.id.split('-')[0]);
                            if (course) {
                              const courseSection = course.sections.find(s => s.sectionNumber === section.sectionNumber);
                              if (courseSection) {
                                removeSectionFromSchedule(course, courseSection);
                              }
                            }
                          }}
                          className="border-red-600 text-red-400 hover:bg-red-600/20 hover:text-red-300 text-xs px-2 py-1 h-6"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          ) : selectedCourse ? (
              <div className="space-y-4 pr-4">
                {/* Professor Ratings Section */}
                {getUniqueProfessors(selectedCourse).length > 0 && (
                  <Card className="p-6 bg-slate-800/80 backdrop-blur-sm border-slate-700/50">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-white">Professors Teaching This Course</h3>
                    </div>
                    <div className="space-y-4">
                      {getUniqueProfessors(selectedCourse).map((professorName, index) => {
                        const rating = findProfessorRating(professorName);
                        return (
                          <div key={index} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="text-slate-100 font-medium">{professorName}</h4>
                                {rating && (
                                  <p className="text-xs text-slate-400 mt-1">{rating.department}</p>
                                )}
                              </div>
                              {rating ? (
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                                    {rating.numRatings} reviews
                                  </Badge>
                                </div>
                              ) : (
                                <Badge variant="outline" className="border-slate-600 text-slate-500 text-xs">
                                  No ratings
                                </Badge>
                              )}
                            </div>
                            
                            {rating && (
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-slate-400" />
                                  <div>
                                    <p className="text-slate-400 text-xs">Difficulty</p>
                                    <p className="text-slate-200 font-medium">{rating.avgDifficulty.toFixed(1)}/5</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-slate-400" />
                                  <div>
                                    <p className="text-slate-400 text-xs">Would Retake</p>
                                    <p className="text-slate-200 font-medium">{rating.wouldTakeAgainPercent.toFixed(0)}%</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Star className="w-4 h-4 text-slate-400" />
                                  <div>
                                    <p className="text-slate-400 text-xs">Overall</p>
                                    <p className={`font-medium ${getRatingColor(rating.avgRating)}`}>
                                      {rating.avgRating.toFixed(1)}/5
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                <Card className="p-6 bg-slate-800/80 backdrop-blur-sm border-slate-700/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Badge className="mb-2 bg-indigo-600">{selectedCourse.code}</Badge>
                      <h3 className="text-white">{selectedCourse.name}</h3>
                    </div>
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">{selectedCourse.credits} credits</Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-2 text-white">Description</h4>
                      <p className="text-slate-400">{selectedCourse.description}</p>
                    </div>

                    <div>
                      <h4 className="mb-2 text-white">Course Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5 border-slate-600 text-slate-300">Department</Badge>
                          <span className="text-slate-400">{selectedCourse.department}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5 border-slate-600 text-slate-300">Level</Badge>
                          <span className="text-slate-400">{selectedCourse.level}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5 border-slate-600 text-slate-300">Schedule</Badge>
                          <span className="text-slate-400">{selectedCourse.schedule}</span>
                        </div>
                        {selectedCourse.prerequisites.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5 border-slate-600 text-slate-300">Prerequisites</Badge>
                            <span className="text-slate-400">
                              {selectedCourse.prerequisites.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-3 text-white">Available Sections</h4>
                      <div className="space-y-3">
                        {selectedCourse.sections.map((section, index) => (
                          <Card key={`${section.sectionNumber}-${index}`} className="p-4 bg-slate-700/50 backdrop-blur-sm border-slate-600/50">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="text-sm text-slate-100">Section {section.sectionNumber}</h4>
                                <p className="text-xs text-slate-400">{section.mode}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {section.instructorName && (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                                      {section.instructorName}
                                    </Badge>
                                    {(() => {
                                      const rating = findProfessorRating(section.instructorName);
                                      return rating ? (
                                        <div className="flex items-center gap-3 text-xs">
                                          <div className={`flex items-center gap-1 ${getRatingColor(rating.avgRating)}`}>
                                            <Star className="w-3 h-3 fill-current" />
                                            <span className="font-medium">{rating.avgRating.toFixed(1)}</span>
                                          </div>
                                          <div className="text-slate-400">
                                            <span className="font-medium">{rating.numRatings}</span> reviews
                                          </div>
                                          <div className="text-slate-400">
                                            Difficulty: <span className="font-medium">{rating.avgDifficulty.toFixed(1)}/5</span>
                                          </div>
                                          <div className="text-slate-400">
                                            Retake: <span className="font-medium">{rating.wouldTakeAgainPercent.toFixed(0)}%</span>
                                          </div>
                                        </div>
                                      ) : null;
                                    })()}
                                  </div>
                                )}
                                {isSectionScheduled(selectedCourse, section) ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeSectionFromSchedule(selectedCourse, section)}
                                    className="border-red-600 text-red-400 hover:bg-red-600/20 hover:text-red-300 text-xs px-2 py-1 h-6"
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Remove
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addSectionToSchedule(selectedCourse, section)}
                                    className="border-green-600 text-green-400 hover:bg-green-600/20 hover:text-green-300 text-xs px-2 py-1 h-6"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              {section.times.map((time, timeIndex) => (
                                <div key={timeIndex} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-md">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="bg-slate-600/50 text-slate-300 text-xs">
                                      {time.days}
                                    </Badge>
                                    <span className="text-sm text-slate-200">
                                      {time.startTime} - {time.endTime}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    {time.building && time.room ? (
                                      <span className="text-xs text-slate-400">
                                        {time.building} {time.room}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-slate-500">TBA</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Show professor rating if available */}
                            {section.instructorName && professorRatings[section.instructorName as keyof typeof professorRatings] && (
                              <div className="mt-3 pt-3 border-t border-slate-600/50">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-slate-400">Professor Rating</span>
                                  <div className={`flex items-center gap-1 ${getRatingColor(professorRatings[section.instructorName as keyof typeof professorRatings].rating)}`}>
                                    <Star className="w-3 h-3 fill-current" />
                                    <span className="text-xs">{professorRatings[section.instructorName as keyof typeof professorRatings].rating.toFixed(1)}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                  <span>Difficulty: {professorRatings[section.instructorName as keyof typeof professorRatings].difficulty.toFixed(1)}/5</span>
                                  <span>•</span>
                                  <span>Would Retake: {professorRatings[section.instructorName as keyof typeof professorRatings].wouldTakeAgain}%</span>
                                </div>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center py-16">
                <div className="text-center text-slate-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a course to view details and professor ratings</p>
                </div>
              </div>
            )}
        </ScrollArea>
      </div>
    </div>
  );
}