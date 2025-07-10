import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, Copy, Check, AlertCircle, FileText, Image, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ThinkificModule {
  title: string;
  description: string;
  content: string;
  contentType: 'text' | 'video';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  images?: string[];
}

interface ThinkificChapter {
  title: string;
  description: string;
  chapterNumber: string;
  orderIndex: number;
  modules: ThinkificModule[];
}

export default function ThinkificMigrationTool() {
  const [jsonContent, setJsonContent] = useState("");
  const [extractedData, setExtractedData] = useState<any>(null);
  const [currentChapter, setCurrentChapter] = useState<ThinkificChapter | null>(null);
  const [migrationProgress, setMigrationProgress] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const migrationMutation = useMutation({
    mutationFn: async (chapterData: ThinkificChapter) => {
      const response = await apiRequest("POST", "/api/admin/migrate-thinkific-chapter", chapterData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Chapter migrated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error) => {
      toast({
        title: "Migration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const populateContentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/populate-course-content", {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `${data.updatedModules} modules populated with content`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error) => {
      toast({
        title: "Population Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const parseJsonContent = () => {
    try {
      const parsed = JSON.parse(jsonContent);
      setExtractedData(parsed);
      toast({
        title: "Success",
        description: "JSON content parsed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON format",
        variant: "destructive",
      });
    }
  };

  const migrateChapter = async (chapter: ThinkificChapter) => {
    setMigrationProgress(prev => [...prev, `Starting migration of: ${chapter.title}`]);
    migrationMutation.mutate(chapter);
  };

  const downloadExtractorScript = () => {
    const script = `
// Thinkific Content Extractor - Paste this into browser console
// Navigate to your Thinkific course page first

(function() {
  window.extractCurrentPage = function() {
    const content = {
      title: document.querySelector('h1, .lesson-title')?.textContent?.trim() || '',
      content: document.querySelector('.lesson-content, .chapter-content, main')?.innerHTML || '',
      images: Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt,
        title: img.title
      })).filter(img => img.src && !img.src.includes('data:image')),
      videos: Array.from(document.querySelectorAll('video, iframe')).map(video => ({
        src: video.src,
        type: video.tagName.toLowerCase()
      })).filter(video => video.src)
    };
    
    console.log('Extracted content:', content);
    
    // Download as JSON
    const dataStr = JSON.stringify(content, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'page-content.json';
    link.click();
    
    return content;
  };
  
  console.log('Extractor ready! Run: extractCurrentPage()');
})();
    `;

    const blob = new Blob([script], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'thinkific-extractor.js';
    link.click();
  };

  const copyCredentials = () => {
    const credentials = `
Thinkific Login Credentials:
Username: tech@drgolly.com
Password: Welcome2025!
URL: https://www.drgollylearninghub.com/courses/take/drgolly-8/texts/22333055-welcome
    `;
    navigator.clipboard.writeText(credentials);
    toast({
      title: "Copied",
      description: "Credentials copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Thinkific Course Migration</h2>
          <p className="text-gray-600">Transfer "Preparation for Newborns" course content from Thinkific</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Preparation for Newborns
        </Badge>
      </div>

      <Tabs defaultValue="instructions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="extract">Extract Content</TabsTrigger>
          <TabsTrigger value="migrate">Migrate</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="instructions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Migration Instructions
              </CardTitle>
              <CardDescription>
                Follow these steps to migrate the Thinkific course content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-teal text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                  <div>
                    <h4 className="font-semibold">Access Thinkific Course</h4>
                    <p className="text-sm text-gray-600">Log into Thinkific using the credentials below</p>
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-mono">Username: tech@drgolly.com</p>
                      <p className="text-sm font-mono">Password: Welcome2025!</p>
                      <p className="text-sm font-mono">URL: https://www.drgollylearninghub.com/courses/take/drgolly-8/texts/22333055-welcome</p>
                    </div>
                    <Button 
                      onClick={copyCredentials} 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Credentials
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-teal text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                  <div>
                    <h4 className="font-semibold">Download Extractor Script</h4>
                    <p className="text-sm text-gray-600">Download and run the content extractor in your browser</p>
                    <Button 
                      onClick={downloadExtractorScript} 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Extractor
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-teal text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                  <div>
                    <h4 className="font-semibold">Extract Content</h4>
                    <p className="text-sm text-gray-600">
                      Navigate through each lesson in the course and run the extractor script in the browser console
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-teal text-white rounded-full flex items-center justify-center text-sm font-semibold">4</div>
                  <div>
                    <h4 className="font-semibold">Upload & Migrate</h4>
                    <p className="text-sm text-gray-600">
                      Upload the extracted JSON content and migrate it to the database
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extract" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Extract Content from Thinkific</CardTitle>
              <CardDescription>
                Paste the JSON content extracted from Thinkific using the browser console script
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">JSON Content</label>
                <Textarea
                  value={jsonContent}
                  onChange={(e) => setJsonContent(e.target.value)}
                  placeholder="Paste the extracted JSON content here..."
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={parseJsonContent} disabled={!jsonContent.trim()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Parse JSON
                </Button>
                {extractedData && (
                  <Badge variant="outline" className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Content Parsed
                  </Badge>
                )}
              </div>

              {extractedData && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h4 className="font-semibold mb-2">Extracted Data Preview:</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Title:</strong> {extractedData.title || 'No title'}</p>
                    <p><strong>Content Length:</strong> {extractedData.content?.length || 0} characters</p>
                    <p><strong>Images:</strong> {extractedData.images?.length || 0} found</p>
                    <p><strong>Videos:</strong> {extractedData.videos?.length || 0} found</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migrate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Migrate to Database</CardTitle>
              <CardDescription>
                Structure and migrate the extracted content to the course database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {extractedData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Chapter Title</label>
                      <Input
                        value={currentChapter?.title || extractedData.title || ''}
                        onChange={(e) => setCurrentChapter(prev => ({
                          ...prev,
                          title: e.target.value,
                          description: prev?.description || '',
                          chapterNumber: prev?.chapterNumber || '1',
                          orderIndex: prev?.orderIndex || 1,
                          modules: prev?.modules || []
                        }))}
                        placeholder="Enter chapter title"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Chapter Number</label>
                      <Input
                        value={currentChapter?.chapterNumber || '1'}
                        onChange={(e) => setCurrentChapter(prev => ({
                          ...prev,
                          chapterNumber: e.target.value,
                          title: prev?.title || '',
                          description: prev?.description || '',
                          orderIndex: prev?.orderIndex || 1,
                          modules: prev?.modules || []
                        }))}
                        placeholder="e.g., 1, 2, 3"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Chapter Description</label>
                    <Textarea
                      value={currentChapter?.description || ''}
                      onChange={(e) => setCurrentChapter(prev => ({
                        ...prev,
                        description: e.target.value,
                        title: prev?.title || '',
                        chapterNumber: prev?.chapterNumber || '1',
                        orderIndex: prev?.orderIndex || 1,
                        modules: prev?.modules || []
                      }))}
                      placeholder="Enter chapter description"
                    />
                  </div>

                  <div className="border rounded-md p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Content Preview
                    </h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p><strong>Content Type:</strong> {extractedData.videos?.length > 0 ? 'Video + Text' : 'Text'}</p>
                      <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded">
                        <div dangerouslySetInnerHTML={{ __html: extractedData.content?.substring(0, 500) + '...' }} />
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => currentChapter && migrateChapter(currentChapter)}
                    disabled={!currentChapter || migrationMutation.isPending}
                    className="w-full"
                  >
                    {migrationMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Migrating...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Migrate Chapter
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No content extracted yet. Go to the "Extract Content" tab first.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Migration Progress</CardTitle>
              <CardDescription>
                Track the progress of course content migration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {migrationProgress.length > 0 ? (
                <div className="space-y-2">
                  {migrationProgress.map((message, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      {message}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No migration progress yet. Start migrating content to see updates here.</p>
                </div>
              )}
              
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Quick Start</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Populate the first 3 modules of "Preparation for Newborns" with sample content to test the system:
                </p>
                <Button 
                  onClick={() => populateContentMutation.mutate()}
                  disabled={populateContentMutation.isPending}
                  className="w-full"
                >
                  {populateContentMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Populating Content...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Populate Sample Content
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}