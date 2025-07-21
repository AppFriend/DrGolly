import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Play, AlertTriangle, CheckCircle, RefreshCw, Edit2, Save, X } from "lucide-react";

interface ContentIntegrityReport {
  totalLessons: number;
  aiGeneratedCount: number;
  authenticVideoCount: number;
  authenticContentCount: number;
}

interface AIGeneratedLesson {
  id: number;
  title: string;
  content: string;
  courseId: number;
  chapterId: number;
  createdAt: string;
}

interface EditableItem {
  id: number;
  title: string;
  type: 'course' | 'chapter' | 'lesson';
}

export default function AdminContentManager() {
  const [report, setReport] = useState<ContentIntegrityReport | null>(null);
  const [aiLessons, setAiLessons] = useState<AIGeneratedLesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [editingItem, setEditingItem] = useState<EditableItem | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const { toast } = useToast();

  const fetchContentIntegrity = async () => {
    setLoading(true);
    try {
      const [integrityData, aiData] = await Promise.all([
        apiRequest('GET', '/api/admin/content-integrity').then(res => res.json()),
        apiRequest('GET', '/api/admin/ai-generated-content').then(res => res.json())
      ]);
      
      setReport(integrityData);
      setAiLessons(aiData);
    } catch (error) {
      console.error('Error fetching content integrity:', error);
      toast({
        title: "Error",
        description: "Failed to fetch content integrity report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const restoreContent = async () => {
    setRestoring(true);
    try {
      const result = await apiRequest('POST', '/api/admin/restore-content').then(res => res.json());
      
      toast({
        title: "Success",
        description: `Content restoration completed. ${result.result?.restoredCount || 0} lessons restored.`,
      });
      
      // Refresh the data
      await fetchContentIntegrity();
    } catch (error) {
      console.error('Error restoring content:', error);
      toast({
        title: "Error",
        description: "Failed to restore content",
        variant: "destructive"
      });
    } finally {
      setRestoring(false);
    }
  };

  const startEditing = (item: EditableItem) => {
    setEditingItem(item);
    setEditedTitle(item.title);
  };

  const saveTitle = async () => {
    if (!editingItem) return;
    
    try {
      const endpoint = editingItem.type === 'course' ? 
        `/api/admin/courses/${editingItem.id}/title` :
        editingItem.type === 'chapter' ?
        `/api/admin/chapters/${editingItem.id}/title` :
        `/api/admin/lessons/${editingItem.id}/title`;
      
      await apiRequest('PUT', endpoint, { title: editedTitle });
      
      toast({
        title: "Success",
        description: `${editingItem.type.charAt(0).toUpperCase() + editingItem.type.slice(1)} title updated successfully`,
      });
      
      // Update the lesson in the local state
      if (editingItem.type === 'lesson') {
        setAiLessons(prev => 
          prev.map(lesson => 
            lesson.id === editingItem.id 
              ? { ...lesson, title: editedTitle }
              : lesson
          )
        );
      }
      
      setEditingItem(null);
      setEditedTitle('');
    } catch (error) {
      console.error('Error updating title:', error);
      toast({
        title: "Error",
        description: "Failed to update title",
        variant: "destructive"
      });
    }
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditedTitle('');
  };

  useEffect(() => {
    fetchContentIntegrity();
  }, []);

  const getStatusBadge = (count: number, total: number, type: string) => {
    const percentage = (count / total) * 100;
    const variant = percentage > 80 ? "destructive" : percentage > 50 ? "default" : "secondary";
    
    return (
      <Badge variant={variant} className="ml-2">
        {count} ({percentage.toFixed(1)}%)
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Content Integrity Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading content integrity report...</span>
            </div>
          ) : report ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900">Total Lessons</h3>
                  <p className="text-2xl font-bold text-blue-600">{report.totalLessons}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-900">AI Generated Content</h3>
                  <p className="text-2xl font-bold text-red-600">
                    {report.aiGeneratedCount}
                    {getStatusBadge(report.aiGeneratedCount, report.totalLessons, 'ai')}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900">Video Content</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {report.authenticVideoCount}
                    {getStatusBadge(report.authenticVideoCount, report.totalLessons, 'video')}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-900">Authentic Content</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {report.authenticContentCount}
                    {getStatusBadge(report.authenticContentCount, report.totalLessons, 'authentic')}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={restoreContent}
                  disabled={restoring}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {restoring ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Restoring Content...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Restore Authentic Content
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Failed to load content integrity report</p>
              <Button onClick={fetchContentIntegrity} variant="outline" className="mt-2">
                Retry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            AI Generated Lessons ({aiLessons.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aiLessons.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-green-700">No AI-generated content found!</p>
              <p className="text-gray-500">All lessons contain authentic content.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {aiLessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                  <div className="flex-1 min-w-0">
                    {editingItem?.id === lesson.id && editingItem?.type === 'lesson' ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="flex-1"
                          placeholder="Enter lesson title"
                        />
                        <Button size="sm" onClick={saveTitle}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-red-900 truncate">{lesson.title}</p>
                          <p className="text-sm text-red-700">
                            Lesson ID: {lesson.id} | Course ID: {lesson.courseId}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing({
                            id: lesson.id,
                            title: lesson.title,
                            type: 'lesson'
                          })}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}