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
      const search = teacherName.toLowerCase();
      filtered = filtered.filter((teacher: any) => 
        teacher.firstName.toLowerCase().includes(search) || 
        teacher.lastName.toLowerCase().includes(search)
      );
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
