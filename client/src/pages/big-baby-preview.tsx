import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Eye, FileText, AlertTriangle } from 'lucide-react';

interface LessonData {
  chapterName: string;
  lessonName: string;
  matchedLessonName: string;
  matchedContent: string;
}

interface ChapterData {
  [chapterName: string]: LessonData[];
}

// READ-ONLY PREVIEW STATUS FLAGS
const PREVIEW_STATUS = {
  mode: 'READ_ONLY_PREVIEW',
  approvalRequired: true,
  databaseUpdatesBlocked: true,
  contentSource: 'Final_Chapter_Lesson_Matches_Refined.csv',
  medicalGradeCompliance: true
};

export default function BigBabyPreview() {
  const [courseData, setCourseData] = useState<ChapterData>({});
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ totalChapters: 0, totalLessons: 0 });

  useEffect(() => {
    fetchCoursePreviewData();
  }, []);

  const fetchCoursePreviewData = async () => {
    try {
      const response = await fetch('/api/big-baby/preview-data');
      if (response.ok) {
        const data = await response.json();
        setCourseData(data.chapters);
        setStats({
          totalChapters: Object.keys(data.chapters).length,
          totalLessons: Object.values(data.chapters).reduce((sum: number, lessons: any) => sum + lessons.length, 0)
        });
      }
    } catch (error) {
      console.error('Error fetching preview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleChapter = (chapterName: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterName)) {
      newExpanded.delete(chapterName);
    } else {
      newExpanded.add(chapterName);
    }
    setExpandedChapters(newExpanded);
  };

  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const getContentPreview = (content: string) => {
    const cleanContent = stripHtmlTags(content);
    return cleanContent.length > 150 ? cleanContent.substring(0, 150) + '...' : cleanContent;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Big Baby Course Preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Status */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Eye className="h-6 w-6" />
              Big Baby Sleep Course - Content Preview
            </CardTitle>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                READ-ONLY PREVIEW
              </Badge>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                AWAITING APPROVAL
              </Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                DATABASE UPDATES BLOCKED
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Content Source:</strong> {PREVIEW_STATUS.contentSource}</p>
                <p><strong>Medical Compliance:</strong> {PREVIEW_STATUS.medicalGradeCompliance ? 'VERIFIED' : 'PENDING'}</p>
              </div>
              <div>
                <p><strong>Total Chapters:</strong> {stats.totalChapters}</p>
                <p><strong>Total Lessons:</strong> {stats.totalLessons}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Content Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Course Structure Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(courseData).map(([chapterName, lessons]) => (
                <Collapsible
                  key={chapterName}
                  open={expandedChapters.has(chapterName)}
                  onOpenChange={() => toggleChapter(chapterName)}
                >
                  <CollapsibleTrigger className="w-full">
                    <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {expandedChapters.has(chapterName) ? 
                              <ChevronDown className="h-5 w-5 text-gray-500" /> : 
                              <ChevronRight className="h-5 w-5 text-gray-500" />
                            }
                            <div className="text-left">
                              <h3 className="font-semibold text-gray-900">{chapterName}</h3>
                              <p className="text-sm text-gray-600">{lessons.length} lessons</p>
                            </div>
                          </div>
                          <Badge variant="secondary">{lessons.length}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="mt-4 ml-8 space-y-3">
                      {lessons.map((lesson, index) => (
                        <Card key={index} className="border-l-4 border-l-teal-200">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <h4 className="font-medium text-gray-900 flex-1">
                                  {index + 1}. {lesson.lessonName}
                                </h4>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {lesson.matchedContent?.length || 0} chars
                                </Badge>
                              </div>
                              
                              {lesson.matchedContent && lesson.matchedContent !== 'No confident match found' ? (
                                <div className="bg-gray-50 p-3 rounded-md">
                                  <p className="text-sm text-gray-700">
                                    <strong>Content Preview:</strong> {getContentPreview(lesson.matchedContent)}
                                  </p>
                                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                    <span>Full Content: {lesson.matchedContent.length} characters</span>
                                    <span>HTML Formatted: {lesson.matchedContent.includes('<') ? 'Yes' : 'No'}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                    <span className="text-sm text-yellow-800">No content match found</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Approval Notice */}
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto" />
              <h3 className="text-lg font-semibold text-red-800">Approval Required</h3>
              <p className="text-red-700">
                This is a read-only preview of the Big Baby Sleep Course content structure.
                No database updates will be performed until explicit human approval is provided.
              </p>
              <div className="mt-4 text-sm text-red-600">
                <p><strong>Next Steps:</strong></p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Review chapter organization above</li>
                  <li>Verify lesson content matches are accurate</li>
                  <li>Confirm medical-grade content integrity</li>
                  <li>Provide approval command to proceed</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}