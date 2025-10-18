import { scheduleData } from '../data/mockSchedule';

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

export function getAllCalendarEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // Add class schedule events
  scheduleData.classes.forEach(classItem => {
    classItem.schedule.forEach(session => {
      events.push({
        id: `${classItem.id}-${session.day}`,
        title: classItem.name,
        startTime: session.startTime,
        endTime: session.endTime,
        location: classItem.location,
        color: classItem.color,
        type: 'class',
        day: session.day
      });
    });
  });

  // Add personal events
  scheduleData.personalEvents.forEach(event => {
    events.push({
      id: event.id,
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      color: event.color,
      type: 'event',
      date: event.date
    });
  });

  // Add deadlines from course timelines
  Object.entries(scheduleData.courseTimelines).forEach(([courseId, timeline]) => {
    const course = scheduleData.classes.find(c => c.id === courseId);
    timeline.forEach(item => {
      events.push({
        id: item.id,
        title: `${course?.code || ''}: ${item.title}`,
        startTime: '23:59',
        endTime: '23:59',
        color: course?.color || '#6B7280',
        type: 'deadline',
        date: item.dueDate
      });
    });
  });

  return events;
}

export function getUpcomingDeadlines(limit = 5): CalendarEvent[] {
  const events = getAllCalendarEvents();
  const deadlines = events.filter(e => e.type === 'deadline');
  
  // Sort by date
  return deadlines.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  }).slice(0, limit);
}
