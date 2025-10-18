import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherName = searchParams.get('teacher_name');

    // Read the teacher ratings data
    const ratingsPath = path.join(process.cwd(), 'data', 'teacher_ratings.json');
    const ratingsData = JSON.parse(fs.readFileSync(ratingsPath, 'utf-8'));

    let filtered = ratingsData;

    // Filter by teacher name if provided
    if (teacherName) {
      const searchTerms = teacherName.toLowerCase().split(/\s+/).filter(term => term.length > 0);
      filtered = filtered.filter((teacher: any) => {
        const fullName = `${teacher.firstName} ${teacher.lastName}`.toLowerCase();
        const firstName = teacher.firstName.toLowerCase();
        const lastName = teacher.lastName.toLowerCase();
        
        // Check if all search terms are found in the full name
        return searchTerms.every((term: string) => {
          // First try exact full name match
          if (fullName.includes(term)) return true;
          
          // Then try partial matches - check if term is a substring of first or last name
          if (firstName.includes(term) || lastName.includes(term)) return true;
          
          // For multi-word terms, check if they span across first and last names
          // e.g., "Riley Nelson" should match "Charles Riley Nelson"
          if (term.includes(' ')) {
            const termParts = term.split(' ');
            if (termParts.length === 2) {
              const [firstPart, lastPart] = termParts;
              return (firstName.includes(firstPart) && lastName.includes(lastPart)) ||
                     (firstName.includes(lastPart) && lastName.includes(firstPart));
            }
          }
          
          return false;
        });
      });
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching teacher ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teacher ratings' },
      { status: 500 }
    );
  }
}
