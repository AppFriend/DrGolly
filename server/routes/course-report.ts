import { Router } from "express";
import { storage } from "../storage";

const router = Router();

// Export course structure report as CSV
router.get("/course-structure-report", async (req, res) => {
  try {
    // Get course overview data
    const courseOverview = await storage.getCourseStructureReport();
    
    // Create CSV content
    let csvContent = "Course Structure Report\n\n";
    
    // Course Overview Section
    csvContent += "Course Overview\n";
    csvContent += "Course ID,Course Title,Total Chapters,Total Lessons,Populated Lessons,Population %\n";
    
    courseOverview.forEach(course => {
      csvContent += `${course.course_id},"${course.course_title}",${course.total_chapters},${course.total_lessons},${course.populated_lessons},${course.population_percentage}%\n`;
    });
    
    // Summary Statistics
    const totalCourses = courseOverview.length;
    const totalChapters = courseOverview.reduce((sum, course) => sum + course.total_chapters, 0);
    const totalLessons = courseOverview.reduce((sum, course) => sum + course.total_lessons, 0);
    const totalPopulated = courseOverview.reduce((sum, course) => sum + course.populated_lessons, 0);
    const overallPercentage = totalLessons > 0 ? ((totalPopulated / totalLessons) * 100).toFixed(1) : 0;
    
    csvContent += "\n\nSummary Statistics\n";
    csvContent += "Metric,Value\n";
    csvContent += `Total Courses,${totalCourses}\n`;
    csvContent += `Total Chapters,${totalChapters}\n`;
    csvContent += `Total Lessons,${totalLessons}\n`;
    csvContent += `Populated Lessons,${totalPopulated}\n`;
    csvContent += `Overall Population Rate,${overallPercentage}%\n`;
    
    // Course Breakdown
    csvContent += "\n\nCourse Breakdown\n";
    csvContent += "Course,Average Lessons per Chapter,Total Chapters,Total Lessons\n";
    
    courseOverview.forEach(course => {
      const avgLessonsPerChapter = course.total_chapters > 0 ? (course.total_lessons / course.total_chapters).toFixed(1) : 0;
      csvContent += `"${course.course_title}",${avgLessonsPerChapter},${course.total_chapters},${course.total_lessons}\n`;
    });
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="course-structure-report.csv"');
    
    res.send(csvContent);
    
  } catch (error) {
    console.error("Error generating course structure report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

export default router;