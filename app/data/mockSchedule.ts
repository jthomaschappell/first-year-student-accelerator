// Mock static JSON data for class schedules and personal calendar
export const scheduleData = {
  semester: "Spring 2025",
  lastUpdated: "2025-01-15",
  classes: [
    {
      id: "cs101",
      name: "Introduction to Computer Science",
      code: "CS 101",
      instructor: "Dr. Sarah Chen",
      location: "Science Hall 204",
      schedule: [
        { day: "Monday", startTime: "09:00", endTime: "10:30" },
        { day: "Wednesday", startTime: "09:00", endTime: "10:30" },
        { day: "Friday", startTime: "09:00", endTime: "10:30" }
      ],
      color: "#4F46E5"
    },
    {
      id: "math201",
      name: "Calculus II",
      code: "MATH 201",
      instructor: "Prof. Michael Torres",
      location: "Math Building 101",
      schedule: [
        { day: "Tuesday", startTime: "11:00", endTime: "12:30" },
        { day: "Thursday", startTime: "11:00", endTime: "12:30" }
      ],
      color: "#059669"
    },
    {
      id: "eng150",
      name: "Critical Writing",
      code: "ENG 150",
      instructor: "Dr. Emily Rodriguez",
      location: "Arts Building 305",
      schedule: [
        { day: "Monday", startTime: "14:00", endTime: "15:30" },
        { day: "Wednesday", startTime: "14:00", endTime: "15:30" }
      ],
      color: "#DC2626"
    },
    {
      id: "hist101",
      name: "World History I",
      code: "HIST 101",
      instructor: "Prof. James Wilson",
      location: "Liberal Arts 210",
      schedule: [
        { day: "Tuesday", startTime: "13:00", endTime: "14:30" },
        { day: "Thursday", startTime: "13:00", endTime: "14:30" }
      ],
      color: "#D97706"
    }
  ],
  personalEvents: [
    {
      id: "study-group-1",
      title: "CS Study Group",
      date: "2025-01-20",
      startTime: "16:00",
      endTime: "18:00",
      location: "Library Room 3A",
      type: "study",
      color: "#8B5CF6"
    },
    {
      id: "office-hours-1",
      title: "Math Office Hours",
      date: "2025-01-21",
      startTime: "15:00",
      endTime: "16:00",
      location: "Math Building 205",
      type: "office-hours",
      color: "#059669"
    }
  ],
  courseTimelines: {
    cs101: [
      { id: "a1", title: "Assignment 1: Variables & Loops", dueDate: "2025-01-22", type: "assignment" },
      { id: "q1", title: "Quiz 1: Basics", dueDate: "2025-01-24", type: "quiz" },
      { id: "m1", title: "Midterm Exam", dueDate: "2025-02-15", type: "exam" }
    ],
    math201: [
      { id: "hw1", title: "Homework Set 1", dueDate: "2025-01-23", type: "assignment" },
      { id: "hw2", title: "Homework Set 2", dueDate: "2025-01-30", type: "assignment" }
    ],
    eng150: [
      { id: "essay1", title: "Essay 1: Rhetorical Analysis", dueDate: "2025-01-28", type: "assignment" },
      { id: "peer1", title: "Peer Review Session", dueDate: "2025-01-26", type: "other" }
    ],
    hist101: [
      { id: "reading1", title: "Reading Quiz 1", dueDate: "2025-01-25", type: "quiz" },
      { id: "paper1", title: "Historical Analysis Paper", dueDate: "2025-02-05", type: "assignment" }
    ]
  }
};
