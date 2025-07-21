import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { storage } from '../storage';
import { restoreAuthenticContent } from '../../scripts/restore-authentic-content';
import { completeContentRestoration } from '../../scripts/complete-content-restoration';

const router = Router();

// Admin content integrity report
router.get('/content-integrity', isAuthenticated, async (req, res) => {
  try {
    const report = await storage.getContentIntegrityReport();
    res.json(report);
  } catch (error) {
    console.error('Error fetching content integrity report:', error);
    res.status(500).json({ error: 'Failed to fetch content integrity report' });
  }
});

// Get AI generated lessons
router.get('/ai-generated-content', isAuthenticated, async (req, res) => {
  try {
    const lessons = await storage.getAIGeneratedLessons();
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching AI generated lessons:', error);
    res.status(500).json({ error: 'Failed to fetch AI generated lessons' });
  }
});

// Restore authentic content
router.post('/restore-content', isAuthenticated, async (req, res) => {
  try {
    const result = await completeContentRestoration();
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error restoring content:', error);
    res.status(500).json({ error: 'Failed to restore content' });
  }
});

// Update course title
router.put('/courses/:id/title', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    const updatedCourse = await storage.updateCourseTitle(Number(id), title);
    res.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course title:', error);
    res.status(500).json({ error: 'Failed to update course title' });
  }
});

// Update chapter title
router.put('/chapters/:id/title', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    const updatedChapter = await storage.updateChapterTitle(Number(id), title);
    res.json(updatedChapter);
  } catch (error) {
    console.error('Error updating chapter title:', error);
    res.status(500).json({ error: 'Failed to update chapter title' });
  }
});

// Update lesson title
router.put('/lessons/:id/title', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    const updatedLesson = await storage.updateLessonTitle(Number(id), title);
    res.json(updatedLesson);
  } catch (error) {
    console.error('Error updating lesson title:', error);
    res.status(500).json({ error: 'Failed to update lesson title' });
  }
});

export default router;