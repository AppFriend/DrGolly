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
  const [selectedEntry, setSelectedEntry] = useState<ChangeLogEntry | null>(null);
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  const [revertingEntry, setRevertingEntry] = useState<ChangeLogEntry | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch change log entries
  const { data: changeLogData, isLoading } = useQuery({
    queryKey: ["/api/admin/course-change-log"],
    enabled: open,
  });

  const changeLogEntries = changeLogData?.logs || [];

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
        return <Book className="h-4 w-4" />;
      case 'lesson_update':
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
        return <Badge variant="outline" className="text-purple-600 border-purple-200">Lesson</Badge>;
      case 'chapter_added':
        return <Badge variant="outline" className="text-green-600 border-green-200">Chapter</Badge>;
      case 'content_update':
        return <Badge variant="outline" className="text-blue-600 border-blue-200">Content</Badge>;
      case 'pricing_change':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200">Pricing</Badge>;
      case 'deletion_test':
        return <Badge variant="outline" className="text-red-600 border-red-200">Test</Badge>;
      default:
        return <Badge variant="outline">Update</Badge>;
    }
  };

  const handleViewContent = (entry: ChangeLogEntry) => {
    setSelectedEntry(entry);
    setShowContentDialog(true);
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

                {/* Course Snapshot */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Content Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                        {JSON.stringify(selectedEntry.courseSnapshot, null, 2)}
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