import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Define the structure of the real course data
interface RealCourseData {
  course_name: string;
  full_title: string;
  curriculum_id: string;
  credit_hours: string;
  sections: Array<{
    section_number: string;
    instructor_name: string;
    mode: string;
    times: Array<{
      days: string;
      start_time: string;
      end_time: string;
      building: string;
      room: string;
    }> | null;
  }>;
}

// Define the expected output format
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

interface CourseSearchResult {
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!query.trim()) {
      return NextResponse.json({ courses: [] });
    }

    // Read the real course data
    const coursesPath = path.join(process.cwd(), 'data', 'courses.json');
    const coursesData: RealCourseData[] = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));

    // Normalize search query - remove extra spaces and make lowercase
    const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');

    // Transform and filter the data
    const transformedCourses: CourseSearchResult[] = coursesData
      .filter(course => {
        // Normalize course name and title for comparison
        const normalizedCourseName = course.course_name.toLowerCase().replace(/\s+/g, ' ');
        const normalizedTitle = course.full_title.toLowerCase();
        
        // Check if query matches course code (e.g., "c s" matches "C S 142")
        // or course title, or instructor name
        return (
          normalizedCourseName.includes(normalizedQuery) ||
          normalizedTitle.includes(normalizedQuery) ||
          course.sections.some(section => 
            section.instructor_name && 
            section.instructor_name.toLowerCase().includes(normalizedQuery)
          )
        );
      })
      .slice(0, limit)
      .map(course => {
        // Extract department code from course name (e.g., "C S 142" -> "C S")
        // Match everything before the last number group
        const deptMatch = course.course_name.match(/^([A-Za-z\s]+)/);
        const department = deptMatch ? deptMatch[1].trim() : course.course_name.split(' ')[0];

        // Determine level based on course number
        const numberMatch = course.course_name.match(/\d+/);
        const courseNumber = numberMatch ? parseInt(numberMatch[0]) : 0;
        
        let level = 'Introductory';
        if (courseNumber >= 500) {
          level = 'Graduate';
        } else if (courseNumber >= 400) {
          level = 'Senior';
        } else if (courseNumber >= 300) {
          level = 'Junior';
        } else if (courseNumber >= 200) {
          level = 'Sophomore';
        } else if (courseNumber >= 100) {
          level = 'Freshman';
        }

        // Get unique instructors (filter out null/undefined values)
        const instructors = Array.from(new Set(course.sections
          .map(section => section.instructor_name)
          .filter(name => name && name.trim())
        ));

        // Fallback if no instructors found
        if (instructors.length === 0) {
          instructors.push('TBA');
        }

        // Create schedule string (summary for display)
        // Find first section with valid times
        const sectionWithTimes = course.sections.find(s => s.times && s.times.length > 0);
        const schedule = sectionWithTimes?.times
          ? sectionWithTimes.times.map(time => 
              `${time.days} ${time.start_time}-${time.end_time}`
            ).join(', ')
          : 'Schedule TBD';

        // Transform sections to include detailed information
        const sections: Section[] = course.sections.map(section => ({
          sectionNumber: section.section_number,
          instructorName: section.instructor_name,
          mode: section.mode,
          times: section.times ? section.times.map(time => ({
            days: time.days,
            startTime: time.start_time,
            endTime: time.end_time,
            building: time.building,
            room: time.room
          })) : [] // Return empty array if times is null
        }));

        return {
          id: course.curriculum_id,
          code: course.course_name,
          name: course.full_title,
          credits: parseInt(course.credit_hours) || 3,
          description: `${course.full_title} - ${department} course`,
          prerequisites: [],
          instructors,
          schedule,
          department,
          level,
          sections
        };
      });

    return NextResponse.json({ courses: transformedCourses });
  } catch (error) {
    console.error('Error searching courses:', error);
    return NextResponse.json(
      { error: 'Failed to search courses' },
      { status: 500 }
    );
  }
}