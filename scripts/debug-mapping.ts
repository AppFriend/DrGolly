import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

/**
 * Debug the mapping process
 */
export async function debugMapping() {
  console.log("Debugging CSV mapping...");
  
  try {
    // Read and parse the rich content CSV
    const csvContent = readFileSync('attached_assets/export_All-submodules-modified--_2025-07-11_00-30-29_1752197687502.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log("CSV Headers:", Object.keys(records[0]));
    console.log(`Total records: ${records.length}`);
    
    // Find Vernix specifically
    const vernixRecords = records.filter(record => 
      record['Title of rich text ']?.toLowerCase().includes('vernix')
    );
    
    console.log(`\nFound ${vernixRecords.length} Vernix records:`);
    vernixRecords.forEach((record, index) => {
      console.log(`\nVernix Record ${index + 1}:`);
      console.log(`- Title: "${record['Title of rich text ']}"`);
      console.log(`- Content length: ${record['text']?.length || 0}`);
      console.log(`- Content preview: "${record['text']?.substring(0, 150)}..."`);
      console.log(`- Video URL: "${record['Video URL'] || 'None'}"`);
    });
    
    // Find records with substantial content
    const substantialRecords = records.filter(record => {
      const content = record['text']?.trim();
      return content && 
             content.length > 100 && 
             !content.includes('(deleted thing)') &&
             !content.includes('mnbkjbbfvjhhvjhcdc') &&
             record['Title of rich text ']?.trim();
    });
    
    console.log(`\nFound ${substantialRecords.length} substantial content records`);
    console.log("Sample titles:");
    substantialRecords.slice(0, 20).forEach(record => {
      console.log(`- "${record['Title of rich text ']}"`);
    });
    
  } catch (error) {
    console.error("Error debugging mapping:", error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  debugMapping();
}