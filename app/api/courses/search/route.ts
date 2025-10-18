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
    }>;
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

    // Transform and filter the data
    const transformedCourses: CourseSearchResult[] = coursesData
      .filter(course => {
        const searchLower = query.toLowerCase();
        return (
          course.course_name.toLowerCase().includes(searchLower) ||
          course.full_title.toLowerCase().includes(searchLower) ||
          course.sections.some(section => 
            section.instructor_name && section.instructor_name.toLowerCase().includes(searchLower)
          )
        );
      })
      .slice(0, limit)
      .map(course => {
        // Extract department from course code (e.g., "CS 101" -> "Computer Science")
        const departmentMap: { [key: string]: string } = {
          'CS': 'Computer Science',
          'MATH': 'Mathematics',
          'PHYS': 'Physics',
          'ECON': 'Economics',
          'BIO': 'Biology',
          'PSYCH': 'Psychology',
          'PSYC': 'Psychology',
          'ART': 'Art',
          'PHIL': 'Philosophy',
          'A HTG': 'American Heritage',
          'ENG': 'English',
          'HIST': 'History',
          'CHEM': 'Chemistry',
          'MUS': 'Music',
          'THEA': 'Theatre',
          'SPAN': 'Spanish',
          'FREN': 'French',
          'GERM': 'German',
          'RUSS': 'Russian',
          'CHIN': 'Chinese',
          'JAPN': 'Japanese',
          'KOR': 'Korean',
          'PORT': 'Portuguese',
          'ITAL': 'Italian',
          'LATIN': 'Latin',
          'GREEK': 'Greek',
          'HEB': 'Hebrew',
          'ARAB': 'Arabic',
          'ASL': 'American Sign Language',
          'ANTH': 'Anthropology',
          'SOC': 'Sociology',
          'POLI': 'Political Science',
          'GEOG': 'Geography',
          'GEOL': 'Geology',
          'ASTR': 'Astronomy',
          'ENGR': 'Engineering',
          'BUS': 'Business',
          'ACCT': 'Accounting',
          'FIN': 'Finance',
          'MKTG': 'Marketing',
          'MGMT': 'Management',
          'IS': 'Information Systems',
          'STAT': 'Statistics',
          'EDUC': 'Education',
          'NURS': 'Nursing',
          'COMM': 'Communications',
          'JCOM': 'Journalism',
          'REC': 'Recreation',
          'PE': 'Physical Education',
          'HLTH': 'Health',
          'NUTR': 'Nutrition',
          'FCS': 'Family Consumer Science',
          'TECH': 'Technology',
          'MFG': 'Manufacturing',
          'CONS': 'Construction',
          'AUTO': 'Automotive',
          'WELD': 'Welding',
          'ELEC': 'Electrical',
          'MECH': 'Mechanical',
          'CIVIL': 'Civil Engineering',
          'ARCH': 'Architecture',
          'LAND': 'Landscape Architecture',
          'PLAN': 'Urban Planning',
          'LAW': 'Law',
          'MED': 'Medicine',
          'DENT': 'Dentistry',
          'PHARM': 'Pharmacy',
          'VET': 'Veterinary',
          'AGR': 'Agriculture',
          'ANSC': 'Animal Science',
          'PLSC': 'Plant Science',
          'SOIL': 'Soil Science',
          'ENTO': 'Entomology',
          'PATH': 'Pathology',
          'MICRO': 'Microbiology',
          'BIOC': 'Biochemistry',
          'MOLB': 'Molecular Biology',
          'GEN': 'Genetics',
          'NEURO': 'Neuroscience',
          'LING': 'Linguistics',
          'REL': 'Religion',
          'THEO': 'Theology',
          'CHURCH': 'Church History',
          'SCRIPT': 'Scripture',
          'FAM': 'Family Studies',
          'MARRIAGE': 'Marriage and Family',
          'CHILD': 'Child Development',
          'ADOL': 'Adolescent Development',
          'ADULT': 'Adult Development',
          'AGING': 'Aging',
          'DEATH': 'Death and Dying',
          'GRIEF': 'Grief Counseling',
          'THERAPY': 'Therapy',
          'COUNSEL': 'Counseling',
          'SOCIAL': 'Social Work',
          'WELFARE': 'Welfare',
          'POLICY': 'Public Policy',
          'ADMIN': 'Administration',
          'LEAD': 'Leadership',
          'ORG': 'Organizational',
          'BEHAV': 'Behavior',
          'MOTIV': 'Motivation',
          'PERF': 'Performance',
          'EVAL': 'Evaluation',
          'ASSESS': 'Assessment',
          'TEST': 'Testing',
          'MEASURE': 'Measurement',
          'RESEARCH': 'Research',
          'METHOD': 'Methods',
          'STATS': 'Statistics',
          'ANALYSIS': 'Analysis',
          'DATA': 'Data',
          'INFO': 'Information',
          'SYSTEM': 'Systems',
          'NETWORK': 'Networking',
          'SECURITY': 'Security',
          'DATABASE': 'Database',
          'WEB': 'Web Development',
          'MOBILE': 'Mobile Development',
          'GAME': 'Game Development',
          'AI': 'Artificial Intelligence',
          'ML': 'Machine Learning',
          'ROBOT': 'Robotics',
          'AUTOMATION': 'Automation',
          'CONTROL': 'Control Systems',
          'SIGNAL': 'Signal Processing',
          'COMMUNICATION': 'Communication Systems',
          'ELECTRONICS': 'Electronics',
          'CIRCUIT': 'Circuits',
          'DIGITAL': 'Digital Systems',
          'ANALOG': 'Analog Systems',
          'POWER': 'Power Systems',
          'ENERGY': 'Energy Systems',
          'RENEWABLE': 'Renewable Energy',
          'ENVIRONMENTAL': 'Environmental',
          'SUSTAIN': 'Sustainability',
          'GREEN': 'Green Technology',
          'CLEAN': 'Clean Technology',
          'WATER': 'Water Systems',
          'WASTE': 'Waste Management',
          'POLLUTION': 'Pollution Control',
          'QUALITY': 'Quality Control',
          'SAFETY': 'Safety',
          'HEALTH': 'Health and Safety',
          'OCCUPATIONAL': 'Occupational Health',
          'INDUSTRIAL': 'Industrial',
          'MANUFACTURING': 'Manufacturing',
          'PRODUCTION': 'Production',
          'OPERATIONS': 'Operations',
          'SUPPLY': 'Supply Chain',
          'LOGISTICS': 'Logistics',
          'TRANSPORT': 'Transportation',
          'TRAFFIC': 'Traffic Engineering',
          'URBAN': 'Urban Planning',
          'REGIONAL': 'Regional Planning',
          'COMMUNITY': 'Community Development',
          'HOUSING': 'Housing',
          'REAL': 'Real Estate',
          'PROPERTY': 'Property',
          'ZONING': 'Zoning',
          'PERMIT': 'Permits',
          'CODE': 'Building Codes',
          'STANDARD': 'Standards',
          'REGULATION': 'Regulations',
          'COMPLIANCE': 'Compliance',
          'AUDIT': 'Auditing',
          'INSPECTION': 'Inspection',
          'MAINTENANCE': 'Maintenance',
          'REPAIR': 'Repair',
          'SERVICE': 'Service',
          'SUPPORT': 'Support',
          'HELP': 'Help Desk',
          'TRAINING': 'Training',
          'DEVELOPMENT': 'Development',
          'LEARNING': 'Learning',
          'TEACHING': 'Teaching',
          'INSTRUCTION': 'Instruction',
          'CURRICULUM': 'Curriculum',
          'SYLLABUS': 'Syllabus',
          'LESSON': 'Lesson Planning',
          'GRADING': 'Grading',
          'FEEDBACK': 'Feedback',
          'PRESENTATION': 'Presentation',
          'PUBLIC': 'Public Speaking',
          'WRITING': 'Writing',
          'READING': 'Reading',
          'LITERACY': 'Literacy',
          'LANGUAGE': 'Language Arts',
          'LITERATURE': 'Literature',
          'POETRY': 'Poetry',
          'DRAMA': 'Drama',
          'FICTION': 'Fiction',
          'NONFICTION': 'Non-fiction',
          'CREATIVE': 'Creative Writing',
          'JOURNALISM': 'Journalism',
          'MEDIA': 'Media',
          'BROADCAST': 'Broadcasting',
          'RADIO': 'Radio',
          'TELEVISION': 'Television',
          'FILM': 'Film',
          'CINEMA': 'Cinema',
          'VIDEO': 'Video Production',
          'AUDIO': 'Audio Production',
          'SOUND': 'Sound Design',
          'COMPOSITION': 'Composition',
          'THEORY': 'Music Theory',
          'HISTORY': 'Music History',
          'PERFORMANCE': 'Performance',
          'INSTRUMENT': 'Instrumental',
          'VOCAL': 'Vocal',
          'CHORAL': 'Choral',
          'ORCHESTRA': 'Orchestra',
          'BAND': 'Band',
          'JAZZ': 'Jazz',
          'CLASSICAL': 'Classical',
          'CONTEMPORARY': 'Contemporary',
          'WORLD': 'World Music',
          'ETHNIC': 'Ethnic Music',
          'FOLK': 'Folk Music',
          'POPULAR': 'Popular Music',
          'ROCK': 'Rock Music',
          'COUNTRY': 'Country Music',
          'BLUES': 'Blues',
          'GOSPEL': 'Gospel',
          'SPIRITUAL': 'Spiritual',
          'SACRED': 'Sacred Music',
          'LITURGICAL': 'Liturgical Music',
          'HYMN': 'Hymns',
          'SOLO': 'Solo Performance',
          'ENSEMBLE': 'Ensemble',
          'CHAMBER': 'Chamber Music',
          'QUARTET': 'String Quartet',
          'TRIO': 'Trio',
          'DUO': 'Duo',
          'ACCOMPANIMENT': 'Accompaniment',
          'PIANO': 'Piano',
          'ORGAN': 'Organ',
          'HARPSICHORD': 'Harpsichord',
          'CLAVICHORD': 'Clavichord',
          'CELESTA': 'Celesta',
          'GLOCKENSPIEL': 'Glockenspiel',
          'XYLOPHONE': 'Xylophone',
          'MARIMBA': 'Marimba',
          'VIBRAPHONE': 'Vibraphone',
          'CHIMES': 'Chimes',
          'BELLS': 'Bells',
          'CYMBALS': 'Cymbals',
          'DRUMS': 'Drums',
          'PERCUSSION': 'Percussion',
          'TIMPAN': 'Timpani',
          'SNARE': 'Snare Drum',
          'BASS': 'Bass Drum',
          'TOM': 'Tom-tom',
          'CRASH': 'Crash Cymbal',
          'RIDE': 'Ride Cymbal',
          'HI': 'Hi-hat',
          'COWBELL': 'Cowbell',
          'TRIANGLE': 'Triangle',
          'TAMBOURINE': 'Tambourine',
          'SHAKER': 'Shaker',
          'MARACAS': 'Maracas',
          'CASTANETS': 'Castanets',
          'CLAVES': 'Claves',
          'GUIRO': 'Guiro',
          'CABASA': 'Cabasa',
          'RAIN': 'Rain Stick',
          'OCEAN': 'Ocean Drum',
          'THUNDER': 'Thunder Sheet',
          'WIND': 'Wind Chimes',
          'CHIME': 'Chime Tree',
          'BELL': 'Bell Tree',
          'GONG': 'Gong',
          'TAM': 'Tam-tam',
          'CHINA': 'China Cymbal',
          'SPLASH': 'Splash Cymbal',
          'EFX': 'Effects Cymbal',
          'SIZZLE': 'Sizzle Cymbal',
          'RIVET': 'Rivet Cymbal',
          'SWISH': 'Swish Cymbal',
          'PANG': 'Pang Cymbal'
        };

        const courseCode = course.course_name.split(' ')[0];
        const department = departmentMap[courseCode] || courseCode;

        // Determine level based on course number
        const courseNumber = parseInt(course.course_name.split(' ')[1] || '0');
        let level = 'Introductory';
        if (courseNumber >= 300) {
          level = 'Advanced';
        } else if (courseNumber >= 200) {
          level = 'Intermediate';
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
        const schedule = course.sections.length > 0 
          ? course.sections[0].times.map(time => 
              `${time.days} ${time.start_time}-${time.end_time}`
            ).join(', ')
          : 'Schedule TBD';

        // Transform sections to include detailed information
        const sections: Section[] = course.sections.map(section => ({
          sectionNumber: section.section_number,
          instructorName: section.instructor_name,
          mode: section.mode,
          times: section.times.map(time => ({
            days: time.days,
            startTime: time.start_time,
            endTime: time.end_time,
            building: time.building,
            room: time.room
          }))
        }));

        return {
          id: course.curriculum_id,
          code: course.course_name,
          name: course.full_title,
          credits: parseInt(course.credit_hours) || 3,
          description: `${course.full_title} - ${department} course`,
          prerequisites: [], // We don't have prerequisite data in the real data
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
