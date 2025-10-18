// Real class data from current_assignments.json
import currentAssignmentsData from '../../data/current_assignments.json';

// Type definitions for the JSON data
interface ScheduleSession {
  days: string[];
  start_time: string;
  end_time: string;
  building: string;
  room: string;
}

interface CourseData {
  schedule: ScheduleSession[];
}

interface AssignmentEvent {
  assignment: string;
  due_date: string;
  course: string;
}

interface CurrentAssignmentsData {
  generated_at: string;
  total_events: number;
  courses: { [key: string]: CourseData };
  events: AssignmentEvent[];
}

export interface CalendarEvent {
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

// Course color mapping
const courseColors: { [key: string]: string } = {
  'MATH 320': '#4F46E5', // Indigo
  'MATH 321': '#059669', // Green
  'MATH 344': '#DC2626', // Red
  'MATH 345': '#D97706', // Orange
  'CS 580': '#7C3AED',   // Purple
  'CS 452': '#0891B2'    // Cyan
};

export function getAllCalendarEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const data = currentAssignmentsData as CurrentAssignmentsData;

  // Add class schedule events from real data
  Object.entries(data.courses).forEach(([courseCode, courseData]) => {
    courseData.schedule.forEach((session, sessionIndex) => {
      session.days.forEach(day => {
        events.push({
          id: `${courseCode}-${day}-${sessionIndex}`,
          title: courseCode,
          startTime: session.start_time,
          endTime: session.end_time,
          location: `${session.building} ${session.room}`,
          color: courseColors[courseCode] || '#6B7280',
          type: 'class',
          day: day
        });
      });
    });
  });

  // Add assignment deadlines from real data
  data.events.forEach((assignment, index) => {
    events.push({
      id: `assignment-${index}`,
      title: `${assignment.course}: ${assignment.assignment}`,
      startTime: '23:59',
      endTime: '23:59',
      color: courseColors[assignment.course] || '#6B7280',
      type: 'deadline',
      date: assignment.due_date
    });
  });

  return events;
}

export function getUpcomingDeadlines(limit = 5, currentDate = new Date()): CalendarEvent[] {
  const events = getAllCalendarEvents();
  const currentDateString = currentDate.toISOString().split('T')[0];
  
  const deadlines = events.filter(e => {
    if (e.type !== 'deadline' || !e.date) return false;
    return e.date >= currentDateString;
  });
  
  // Sort by date
  return deadlines.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  }).slice(0, limit);
}

export function getRelativeTimeDisplay(dueDate: string, currentDate = new Date()): string {
  // Parse dates as local dates to avoid timezone issues
  const due = new Date(dueDate + 'T00:00:00');
  const current = new Date(currentDate);
  
  // Set time to start of day for accurate day comparison
  due.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - current.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays < 0) return "Overdue";
  return `Due in ${diffDays} days`;
}
