import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  History, 
  Eye, 
  RotateCcw, 
  User, 
  Clock,
  FileText,
  Book,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

interface CourseChangeLogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChangeLogEntry {
  id: number;
  course_id: number;
  admin_user_name: string;
  admin_user_email: string;
  change_type: string;
  change_description: string;
  affected_chapter_title?: string;
  affected_lesson_title?: string;
  course_snapshot: any;
  course_title: string;
  created_at: string;
  // For backwards compatibility with revert functionality
  isRevert?: boolean;
  revertedFromLogId?: number;
}

export function CourseChangeLog({ open, onOpenChange }: CourseChangeLogProps) {
  // Debug at the very top to confirm component is mounting
  console.log('CourseChangeLog component MOUNTED with props:', { open, onOpenChange: typeof onOpenChange });
  
  const [selectedEntry, setSelectedEntry] = useState<ChangeLogEntry | null>(null);
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  const [revertingEntry, setRevertingEntry] = useState<ChangeLogEntry | null>(null);
  const [lessonContent, setLessonContent] = useState<any>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log('CourseChangeLog component rendered, open:', open);

  // Fetch change log entries
  const { data: changeLogData, isLoading, error } = useQuery({
    queryKey: ["/api/admin/course-change-log"],
    enabled: open,
    refetchOnMount: true,
    staleTime: 0,  // Always refetch, don't use cache
    cacheTime: 0,  // Don't cache the result
  });

  console.log('CourseChangeLog query state:', { 
    isLoading, 
    error: error?.message, 
    hasData: !!changeLogData,
    queryEnabled: open 
  });

  // Debug when open state changes
  if (open) {
    console.log('CourseChangeLog dialog should be open - making API request');
  }

  const changeLogEntries = changeLogData?.logs || [];

  // Add debugging for the actual data received
  console.log('CourseChangeLog data received:', { 
    changeLogData, 
    entriesCount: changeLogEntries.length,
    entries: changeLogEntries,
    error: error?.message 
  });

  // Revert mutation
  const revertMutation = useMutation({
    mutationFn: async (logId: number) => {
      return await apiRequest("POST", `/api/admin/course-change-log/${logId}/revert`);
    },
    onSuccess: () => {
      toast({
        title: "Content Reverted",
        description: "Course content has been successfully reverted to the selected savepoint.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-change-log"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      setShowRevertDialog(false);
      setRevertingEntry(null);
    },
    onError: (error: any) => {
      toast({
        title: "Revert Failed",
        description: error.message || "Failed to revert course content.",
        variant: "destructive",
      });
    },
  });

  const formatAustralianTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      // Format in Australian Eastern Time (AEST/AEDT)
      return formatInTimeZone(date, "Australia/Sydney", "d MMMM yyyy, h:mm a 'AEST'");
    } catch (error) {
      return dateString;
    }
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'course_update':
        return <GraduationCap className="h-4 w-4" />;
      case 'chapter_update':
      case 'chapter_created':
      case 'chapter_modified':
        return <Book className="h-4 w-4" />;
      case 'lesson_update':
      case 'lesson_updated':
      case 'lesson_modified':
      case 'lesson_created':
        return <FileText className="h-4 w-4" />;
      case 'revert':
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getChangeTypeBadge = (entry: ChangeLogEntry) => {
    if (entry.isRevert) {
      return <Badge variant="outline" className="text-orange-600 border-orange-200">Revert</Badge>;
    }
    
    switch (entry.change_type) {
      case 'course_update':
        return <Badge variant="outline" className="text-blue-600 border-blue-200">Course</Badge>;
      case 'chapter_update':
        return <Badge variant="outline" className="text-green-600 border-green-200">Chapter</Badge>;
      case 'lesson_update':
      case 'lesson_updated':
      case 'lesson_modified':
      case 'lesson_created':
        return <Badge variant="outline" className="text-purple-600 border-purple-200">Lesson</Badge>;
      case 'chapter_added':
      case 'chapter_created':
      case 'chapter_modified':
        return <Badge variant="outline" className="text-green-600 border-green-200">Chapter</Badge>;
      case 'content_update':
        return <Badge variant="outline" className="text-blue-600 border-blue-200">Content</Badge>;
      case 'pricing_change':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200">Pricing</Badge>;
      case 'deletion_test':
        return <Badge variant="outline" className="text-red-600 border-red-200">Test</Badge>;
      case 'test_entry':
        return <Badge variant="outline" className="text-gray-600 border-gray-200">Test</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-600 border-gray-200">Update</Badge>;
    }
  };

  const handleViewContent = async (entry: ChangeLogEntry) => {
    setSelectedEntry(entry);
    setShowContentDialog(true);
    
    // If this is a lesson modification, fetch the current lesson content
    if (entry.change_type === 'lesson_modified' && entry.course_snapshot?.lesson_id) {
      setLoadingContent(true);
      try {
        const lessonData = await apiRequest("GET", `/api/lessons/${entry.course_snapshot.lesson_id}/content`);
        setLessonContent(lessonData);
      } catch (error) {
        console.error('Error fetching lesson content:', error);
        toast({
          title: "Error",
          description: "Could not load lesson content for preview.",
          variant: "destructive",
        });
      } finally {
        setLoadingContent(false);
      }
    } else {
      setLessonContent(null);
    }
  };

  const handleRevertClick = (entry: ChangeLogEntry) => {
    setRevertingEntry(entry);
    setShowRevertDialog(true);
  };

  const handleRevertConfirm = () => {
    if (revertingEntry) {
      revertMutation.mutate(revertingEntry.id);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Course Content Change Log
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <ScrollArea className="flex-1 pr-4">
              {changeLogEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <History className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">No changes recorded yet</p>
                  <p className="text-sm">Content changes will appear here when admins save course updates</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {changeLogEntries.map((entry: ChangeLogEntry, index: number) => (
                    <Card key={entry.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getChangeTypeIcon(entry.change_type)}
                              {getChangeTypeBadge(entry)}
                              <span className="text-sm font-medium text-gray-900">
                                {entry.admin_user_name}
                              </span>
                              <span className="text-sm text-gray-500">
                                {entry.change_description}
                              </span>
                            </div>

                            {entry.course_title && (
                              <div className="text-sm text-gray-600 mb-2">
                                <span>Course: <span className="font-medium">{entry.course_title}</span></span>
                              </div>
                            )}

                            {(entry.affected_chapter_title || entry.affected_lesson_title) && (
                              <div className="text-sm text-gray-600 mb-2">
                                {entry.affected_chapter_title && (
                                  <span>Chapter: <span className="font-medium">{entry.affected_chapter_title}</span></span>
                                )}
                                {entry.affected_chapter_title && entry.affected_lesson_title && <span className="mx-2">•</span>}
                                {entry.affected_lesson_title && (
                                  <span>Lesson: <span className="font-medium">{entry.affected_lesson_title}</span></span>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatAustralianTime(entry.created_at)}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {entry.admin_user_email}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewContent(entry)}
                              className="text-sm"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Content
                            </Button>
                            
                            {!entry.isRevert && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevertClick(entry)}
                                className="text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Revert to This
                              </Button>
                            )}
                          </div>
                        </div>

                        {entry.isRevert && entry.revertedFromLogId && (
                          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                            <div className="flex items-center gap-2 text-orange-700 text-sm">
                              <AlertCircle className="h-4 w-4" />
                              This change reverted content to a previous savepoint
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Content Preview Dialog */}
      <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Content Preview - {selectedEntry ? formatAustralianTime(selectedEntry.created_at) : ''}
            </DialogTitle>
          </DialogHeader>

          {selectedEntry && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {/* Change Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Change Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Admin:</span> {selectedEntry.admin_user_name}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {selectedEntry.admin_user_email}
                      </div>
                      <div>
                        <span className="font-medium">Change Type:</span> {selectedEntry.change_type}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {formatAustralianTime(selectedEntry.created_at)}
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="font-medium">Description:</span> {selectedEntry.change_description}
                    </div>
                    <div className="mt-4">
                      <span className="font-medium">Course:</span> {selectedEntry.course_title}
                    </div>
                  </CardContent>
                </Card>

                {/* Content Details */}
                {selectedEntry.affected_chapter_title && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Affected Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium">Chapter:</span> {selectedEntry.affected_chapter_title}
                        </div>
                        {selectedEntry.affected_lesson_title && (
                          <div>
                            <span className="font-medium">Lesson:</span> {selectedEntry.affected_lesson_title}
                          </div>
                        )}
                        {selectedEntry.course_snapshot?.content_length && (
                          <div>
                            <span className="font-medium">Content Length:</span> {selectedEntry.course_snapshot.content_length} characters
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Current Lesson Content (if lesson modification) */}
                {selectedEntry.change_type === 'lesson_modified' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Current Lesson Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingContent ? (
                        <div className="flex items-center justify-center p-8">
                          <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                          <span className="ml-3">Loading lesson content...</span>
                        </div>
                      ) : lessonContent ? (
                        <div className="space-y-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-2">Video Content</h4>
                            {lessonContent.videoUrl && (
                              <div className="text-sm text-blue-800">
                                <span className="font-medium">Video URL:</span> {lessonContent.videoUrl}
                              </div>
                            )}
                          </div>
                          
                          {lessonContent.content && (
                            <div className="bg-gray-50 border rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-2">Text Content</h4>
                              <div className="prose prose-sm max-w-none text-gray-700 max-h-64 overflow-y-auto" 
                                   dangerouslySetInnerHTML={{ __html: lessonContent.content }} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-500 p-4">
                          No current lesson content available for preview.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Technical Snapshot (for debugging) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Change Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-xs overflow-auto max-h-32 whitespace-pre-wrap text-gray-600">
                        {JSON.stringify(selectedEntry.course_snapshot, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Revert Confirmation Dialog */}
      <AlertDialog open={showRevertDialog} onOpenChange={setShowRevertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Revert Course Content
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revert the course content to this savepoint?
              {revertingEntry && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="font-medium">Savepoint Details:</div>
                  <div>Time: {formatAustralianTime(revertingEntry.created_at)}</div>
                  <div>Admin: {revertingEntry.admin_user_name}</div>
                  <div>Change: {revertingEntry.change_description}</div>
                </div>
              )}
              <div className="mt-3 text-orange-600">
                <strong>Warning:</strong> This will replace the current course content with the content from this savepoint. This action will be logged and can be reverted again if needed.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevertConfirm}
              disabled={revertMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {revertMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Reverting...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Revert Content
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}