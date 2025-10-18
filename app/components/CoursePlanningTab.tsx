'use client'

import { useState, useEffect } from 'react';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Search, BookOpen, Star } from 'lucide-react';
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

export function CoursePlanningTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

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


  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="flex flex-col h-full">
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
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course List - Left Column */}
        <div className="flex flex-col min-h-0">
          <ScrollArea className="flex-1">
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
        </div>

        {/* Course Details - Right Column */}
        <div className="flex flex-col min-h-0">
          <ScrollArea className="flex-1">
            {selectedCourse ? (
              <div className="space-y-4 pr-4">
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
                              {section.instructorName && (
                                <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                                  {section.instructorName}
                                </Badge>
                              )}
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
    </div>
  );
}