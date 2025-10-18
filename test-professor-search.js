// Test script to verify improved professor search functionality
const fs = require('fs');
const path = require('path');

// Load the teacher ratings data
const ratingsPath = path.join(__dirname, 'data', 'teacher_ratings.json');
const ratingsData = JSON.parse(fs.readFileSync(ratingsPath, 'utf-8'));

// Improved search function (same logic as implemented in the API routes)
function searchProfessors(teacherName) {
  const searchTerms = teacherName.toLowerCase().split(/\s+/).filter(term => term.length > 0);
  
  return ratingsData.filter((t) => {
    const fullName = `${t.firstName} ${t.lastName}`.toLowerCase();
    const firstName = t.firstName.toLowerCase();
    const lastName = t.lastName.toLowerCase();
    
    // Check if all search terms are found in the full name
    return searchTerms.every((term) => {
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

// Test cases
console.log('Testing improved professor search functionality...\n');

// Test 1: Search for "Riley" - should find Riley Wilson and Riley Bassett
console.log('Test 1: Searching for "Riley"');
const results1 = searchProfessors('Riley');
console.log(`Found ${results1.length} results:`);
results1.forEach(prof => console.log(`  - ${prof.firstName} ${prof.lastName} (${prof.department})`));
console.log();

// Test 2: Search for "Nelson" - should find all Nelson professors
console.log('Test 2: Searching for "Nelson"');
const results2 = searchProfessors('Nelson');
console.log(`Found ${results2.length} results:`);
results2.slice(0, 5).forEach(prof => console.log(`  - ${prof.firstName} ${prof.lastName} (${prof.department})`));
if (results2.length > 5) console.log(`  ... and ${results2.length - 5} more`);
console.log();

// Test 3: Search for "Charles" - should find all Charles professors
console.log('Test 3: Searching for "Charles"');
const results3 = searchProfessors('Charles');
console.log(`Found ${results3.length} results:`);
results3.slice(0, 5).forEach(prof => console.log(`  - ${prof.firstName} ${prof.lastName} (${prof.department})`));
if (results3.length > 5) console.log(`  ... and ${results3.length - 5} more`);
console.log();

// Test 4: Search for "Riley Nelson" - should find professors where Riley is in first name and Nelson is in last name
console.log('Test 4: Searching for "Riley Nelson" (testing cross-name matching)');
const results4 = searchProfessors('Riley Nelson');
console.log(`Found ${results4.length} results:`);
results4.forEach(prof => console.log(`  - ${prof.firstName} ${prof.lastName} (${prof.department})`));
console.log();

// Test 5: Search for "Ann" - should find Ann Dee Ellis and other Ann professors
console.log('Test 5: Searching for "Ann"');
const results5 = searchProfessors('Ann');
console.log(`Found ${results5.length} results:`);
results5.slice(0, 5).forEach(prof => console.log(`  - ${prof.firstName} ${prof.lastName} (${prof.department})`));
if (results5.length > 5) console.log(`  ... and ${results5.length - 5} more`);
console.log();

// Test 6: Search for "Mary Ann" - should find Mary Ann professors
console.log('Test 6: Searching for "Mary Ann"');
const results6 = searchProfessors('Mary Ann');
console.log(`Found ${results6.length} results:`);
results6.forEach(prof => console.log(`  - ${prof.firstName} ${prof.lastName} (${prof.department})`));
console.log();

console.log('Search functionality test completed!');