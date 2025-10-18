'use client'

import { useState } from 'react';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Search, BookOpen, Star, TrendingUp, Users, Clock } from 'lucide-react';
import { courseCatalogData, professorRatings } from '@/app/data/mockCourses';

export function CoursePlanningTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<typeof courseCatalogData[0] | null>(null);
  const [filterLevel, setFilterLevel] = useState<'all' | 'Introductory' | 'Intermediate'>('all');

  const filteredCourses = courseCatalogData.filter(course => {
    const matchesSearch = 
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLevel = filterLevel === 'all' || course.level === filterLevel;
    
    return matchesSearch && matchesLevel;
  });

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty >= 4.0) return 'Very Challenging';
    if (difficulty >= 3.0) return 'Moderate';
    return 'Manageable';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-5 h-5 text-indigo-400" />
        <h2 className="text-white">Course Planning</h2>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses by name, code, or department..."
            className="pl-10 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filterLevel === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterLevel('all')}
            className={filterLevel === 'all' ? 'bg-indigo-600 hover:bg-indigo-500' : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100'}
          >
            All Levels
          </Button>
          <Button
            variant={filterLevel === 'Introductory' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterLevel('Introductory')}
            className={filterLevel === 'Introductory' ? 'bg-indigo-600 hover:bg-indigo-500' : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100'}
          >
            Introductory
          </Button>
          <Button
            variant={filterLevel === 'Intermediate' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterLevel('Intermediate')}
            className={filterLevel === 'Intermediate' ? 'bg-indigo-600 hover:bg-indigo-500' : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100'}
          >
            Intermediate
          </Button>
        </div>
      </div>

      {/* Course List and Details */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
        {/* Course List */}
        <ScrollArea className="h-full">
          <div className="space-y-1.5 pr-4">
            {filteredCourses.map(course => (
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
            ))}
          </div>
        </ScrollArea>

        {/* Course Details */}
        <ScrollArea className="h-full">
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
                    <h4 className="mb-3 text-white">Instructors</h4>
                    <div className="space-y-3">
                      {selectedCourse.instructors.map(instructor => {
                        const rating = professorRatings[instructor];
                        return rating ? (
                          <Card key={instructor} className="p-4 bg-slate-700/50 backdrop-blur-sm border-slate-600/50">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="text-sm text-slate-100">{instructor}</h4>
                              </div>
                              <div className={`flex items-center gap-1 ${getRatingColor(rating.rating)}`}>
                                <Star className="w-4 h-4 fill-current" />
                                <span>{rating.rating.toFixed(1)}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-3">
                              <div className="text-center p-2 bg-slate-800/50 rounded-md">
                                <div className="text-xs text-slate-400 mb-1">Difficulty</div>
                                <div className="flex items-center justify-center gap-1 text-slate-200">
                                  <TrendingUp className="w-3 h-3" />
                                  <span className="text-sm">{rating.difficulty.toFixed(1)}/5</span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                  {getDifficultyLabel(rating.difficulty)}
                                </div>
                              </div>
                              <div className="text-center p-2 bg-slate-800/50 rounded-md">
                                <div className="text-xs text-slate-400 mb-1">Would Retake</div>
                                <div className="flex items-center justify-center gap-1 text-slate-200">
                                  <Users className="w-3 h-3" />
                                  <span className="text-sm">{rating.wouldTakeAgain}%</span>
                                </div>
                              </div>
                              <div className="text-center p-2 bg-slate-800/50 rounded-md">
                                <div className="text-xs text-slate-400 mb-1">Reviews</div>
                                <div className="flex items-center justify-center gap-1 text-slate-200">
                                  <Clock className="w-3 h-3" />
                                  <span className="text-sm">{rating.reviews.length}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-3">
                              {rating.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs bg-slate-600/50 text-slate-300">
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            <div className="space-y-2">
                              <div className="text-xs text-slate-400">Recent Reviews:</div>
                              {rating.reviews.slice(0, 2).map((review, idx) => (
                                <div key={idx} className="text-xs p-2 bg-slate-800/50 rounded-md text-slate-400 italic">
                                  "{review}"
                                </div>
                              ))}
                            </div>
                          </Card>
                        ) : (
                          <Card key={instructor} className="p-3 bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
                            <h4 className="text-sm text-slate-100">{instructor}</h4>
                            <p className="text-xs text-slate-400 mt-1">No ratings available</p>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
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
