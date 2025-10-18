// Mock course catalog and Rate My Professors data
export const courseCatalogData = [
  {
    id: "cs102",
    code: "CS 102",
    name: "Data Structures",
    credits: 4,
    description: "Introduction to fundamental data structures including arrays, linked lists, stacks, queues, trees, and graphs. Emphasizes algorithm analysis and problem-solving.",
    prerequisites: ["CS 101"],
    instructors: ["Dr. Sarah Chen", "Dr. Robert Park"],
    schedule: "MWF 10:00-11:30 or TR 13:00-14:30",
    department: "Computer Science",
    level: "Intermediate"
  },
  {
    id: "math202",
    code: "MATH 202",
    name: "Linear Algebra",
    credits: 3,
    description: "Vector spaces, linear transformations, matrices, determinants, eigenvalues and eigenvectors, and applications.",
    prerequisites: ["MATH 201"],
    instructors: ["Prof. Michael Torres", "Dr. Lisa Wang"],
    schedule: "TR 09:00-10:30",
    department: "Mathematics",
    level: "Intermediate"
  },
  {
    id: "phys101",
    code: "PHYS 101",
    name: "Physics I: Mechanics",
    credits: 4,
    description: "Introduction to classical mechanics covering kinematics, Newton's laws, energy, momentum, rotational motion, and oscillations. Includes lab component.",
    prerequisites: ["MATH 201"],
    instructors: ["Prof. Jennifer Lee", "Dr. David Martinez"],
    schedule: "MWF 11:00-12:30 + Lab",
    department: "Physics",
    level: "Introductory"
  },
  {
    id: "econ101",
    code: "ECON 101",
    name: "Principles of Microeconomics",
    credits: 3,
    description: "Introduction to microeconomic theory including supply and demand, market structures, consumer behavior, and producer theory.",
    prerequisites: [],
    instructors: ["Prof. Amanda Brown", "Dr. Kevin Zhang"],
    schedule: "TR 14:00-15:30",
    department: "Economics",
    level: "Introductory"
  },
  {
    id: "bio101",
    code: "BIO 101",
    name: "Introduction to Biology",
    credits: 4,
    description: "Survey of biological principles including cell structure, genetics, evolution, ecology, and physiology. Lab component included.",
    prerequisites: [],
    instructors: ["Dr. Rachel Green", "Prof. Thomas Anderson"],
    schedule: "TR 10:00-11:30 + Lab",
    department: "Biology",
    level: "Introductory"
  },
  {
    id: "psych101",
    code: "PSYCH 101",
    name: "Introduction to Psychology",
    credits: 3,
    description: "Overview of psychology as a science including cognition, development, personality, social psychology, and mental health.",
    prerequisites: [],
    instructors: ["Dr. Maria Garcia", "Prof. John Smith"],
    schedule: "MWF 13:00-14:00",
    department: "Psychology",
    level: "Introductory"
  },
  {
    id: "art110",
    code: "ART 110",
    name: "Drawing Fundamentals",
    credits: 3,
    description: "Introduction to drawing techniques and concepts. Emphasis on observation, composition, and various drawing media.",
    prerequisites: [],
    instructors: ["Prof. Alex Rivera"],
    schedule: "MW 15:00-17:00",
    department: "Art",
    level: "Introductory"
  },
  {
    id: "phil201",
    code: "PHIL 201",
    name: "Ethics",
    credits: 3,
    description: "Examination of major ethical theories and their application to contemporary moral issues.",
    prerequisites: [],
    instructors: ["Dr. Catherine White", "Prof. Daniel Kim"],
    schedule: "TR 11:00-12:30",
    department: "Philosophy",
    level: "Intermediate"
  }
];

export const professorRatings = {
  "Dr. Sarah Chen": {
    rating: 4.8,
    difficulty: 3.2,
    wouldTakeAgain: 92,
    reviews: [
      "Excellent professor! Clear explanations and very helpful in office hours.",
      "Challenging but fair. Really cares about student success.",
      "Best CS professor I've had. Makes complex topics understandable."
    ],
    tags: ["Clear explanations", "Helpful", "Tough grader", "Caring"]
  },
  "Prof. Michael Torres": {
    rating: 4.5,
    difficulty: 4.1,
    wouldTakeAgain: 78,
    reviews: [
      "Very knowledgeable but moves fast. Need to keep up with homework.",
      "Office hours are a must. Tests are hard but curved.",
      "Great at explaining difficult concepts if you ask questions."
    ],
    tags: ["Knowledgeable", "Fast-paced", "Curved tests", "Accessible"]
  },
  "Dr. Emily Rodriguez": {
    rating: 4.7,
    difficulty: 2.8,
    wouldTakeAgain: 89,
    reviews: [
      "Makes writing actually interesting. Feedback is very constructive.",
      "Fair grader and gives helpful comments on drafts.",
      "Passionate about teaching and it shows."
    ],
    tags: ["Engaging", "Helpful feedback", "Fair grader", "Passionate"]
  },
  "Prof. James Wilson": {
    rating: 4.2,
    difficulty: 2.5,
    wouldTakeAgain: 82,
    reviews: [
      "Interesting lectures but attendance is mandatory.",
      "Readings are relevant and exams are straightforward.",
      "Good storyteller, makes history come alive."
    ],
    tags: ["Interesting", "Attendance matters", "Good lecturer", "Fair exams"]
  },
  "Dr. Robert Park": {
    rating: 4.6,
    difficulty: 3.5,
    wouldTakeAgain: 85,
    reviews: [
      "Expects a lot but you learn a ton. Worth the effort.",
      "Clear rubrics and expectations. Very organized.",
      "Challenging assignments but prepares you well for advanced courses."
    ],
    tags: ["Organized", "High expectations", "Prepares you well", "Clear"]
  },
  "Dr. Lisa Wang": {
    rating: 4.9,
    difficulty: 3.0,
    wouldTakeAgain: 95,
    reviews: [
      "Amazing! Makes math fun and approachable.",
      "Patient and willing to explain things multiple ways.",
      "Best math professor. Highly recommend."
    ],
    tags: ["Amazing", "Patient", "Makes math fun", "Approachable"]
  }
};
