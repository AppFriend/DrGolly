import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, AlertTriangle, XCircle, Database, Eye, Play, RefreshCw, Shield, Loader2 } from 'lucide-react';

interface VerificationItem {
  chapterName: string;
  lessonName: string;
  matchedLessonTitle: string;
  contentPreview: string;
  status: 'MATCHED' | 'NO_MATCH' | 'DUPLICATE';
}

interface VerificationData {
  status: string;
  totalLessons: number;
  matchedLessons: number;
  unmatchedLessons: number;
  duplicateLessons: number;
  verificationTable: VerificationItem[];
}

interface DatabaseIntegrity {
  courseExists: boolean;
  totalChapters: number;
  totalLessons: number;
  totalLessonContent: number;
  publishedStatus: boolean;
}

export default function BigBabyDatabaseManager() {
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [databaseIntegrity, setDatabaseIntegrity] = useState<DatabaseIntegrity | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchVerificationTable = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/big-baby/verification-table');
      if (response.ok) {
        const data = await response.json();
        setVerificationData(data);
      } else {
        setError('Failed to generate verification table');
      }
    } catch (err) {
      setError('Error fetching verification data');
    } finally {
      setLoading(false);
    }
  };

  const checkDatabaseStatus = async () => {
    setCheckingStatus(true);
    setError(null);
    try {
      const response = await fetch('/api/big-baby/database-status');
      if (response.ok) {
        const data = await response.json();
        setDatabaseIntegrity(data.databaseIntegrity);
      } else {
        setError('Failed to check database status');
      }
    } catch (err) {
      setError('Error checking database status');
    } finally {
      setCheckingStatus(false);
    }
  };

  const executeUpdate = async () => {
    setUpdating(true);
    setError(null);
    setUpdateResult(null);
    
    try {
      const response = await fetch('/api/big-baby/execute-database-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved: true }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setUpdateResult(`✅ ${result.message}`);
      } else {
        setError(`❌ ${result.error || 'Update failed'}`);
      }
    } catch (err) {
      setError('Error executing database update');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchVerificationTable();
    checkDatabaseStatus();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'MATCHED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'NO_MATCH':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'DUPLICATE':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'MATCHED':
        return 'bg-green-100 text-green-800';
      case 'NO_MATCH':
        return 'bg-red-100 text-red-800';
      case 'DUPLICATE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateCompletionPercentage = () => {
    if (!verificationData) return 0;
    return Math.round((verificationData.matchedLessons / verificationData.totalLessons) * 100);
  };

  const canExecuteUpdate = () => {
    if (!verificationData) return false;
    return verificationData.matchedLessons > 0 && verificationData.duplicateLessons === 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Database className="h-8 w-8 text-blue-600" />
            Big Baby Course Database Manager
          </h1>
          <p className="text-gray-600">
            Verify and update the Big Baby Sleep Course structure from the read-only preview
          </p>
        </div>

        {/* Database Status Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Database Integrity Status
              </CardTitle>
              <button
                onClick={checkDatabaseStatus}
                disabled={checkingStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {checkingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {checkingStatus ? 'Checking...' : 'Check Status'}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {databaseIntegrity ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="text-sm text-gray-600 mb-1">Course Status</div>
                  <div className={`text-lg font-semibold flex items-center gap-1 ${databaseIntegrity.courseExists ? 'text-green-600' : 'text-red-600'}`}>
                    {databaseIntegrity.courseExists ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {databaseIntegrity.courseExists ? 'Exists' : 'Missing'}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="text-sm text-gray-600 mb-1">Chapters</div>
                  <div className="text-lg font-semibold text-blue-600">{databaseIntegrity.totalChapters}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="text-sm text-gray-600 mb-1">Lessons</div>
                  <div className="text-lg font-semibold text-purple-600">{databaseIntegrity.totalLessons}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="text-sm text-gray-600 mb-1">Content Items</div>
                  <div className="text-lg font-semibold text-orange-600">{databaseIntegrity.totalLessonContent}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="text-sm text-gray-600 mb-1">Published</div>
                  <div className={`text-lg font-semibold flex items-center gap-1 ${databaseIntegrity.publishedStatus ? 'text-green-600' : 'text-yellow-600'}`}>
                    {databaseIntegrity.publishedStatus ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    {databaseIntegrity.publishedStatus ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Click "Check Status" to verify database integrity
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Cards */}
        {verificationData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Lessons</p>
                    <p className="text-2xl font-bold text-gray-900">{verificationData.totalLessons}</p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Matched</p>
                    <p className="text-2xl font-bold text-green-600">{verificationData.matchedLessons}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Unmatched</p>
                    <p className="text-2xl font-bold text-red-600">{verificationData.unmatchedLessons}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion</p>
                    <p className="text-2xl font-bold text-blue-600">{calculateCompletionPercentage()}%</p>
                  </div>
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full border-4 border-gray-200"></div>
                    <div 
                      className="w-8 h-8 rounded-full border-4 border-blue-600 absolute top-0 left-0"
                      style={{
                        clipPath: `inset(0 ${100 - calculateCompletionPercentage()}% 0 0)`
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Update Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={fetchVerificationTable}
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Generating...' : 'Refresh Verification Table'}
              </Button>

              <Button 
                onClick={executeUpdate}
                disabled={updating || !canExecuteUpdate()}
                className="bg-green-600 hover:bg-green-700"
              >
                {updating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {updating ? 'Updating Database...' : 'Execute Database Update'}
              </Button>
            </div>

            {!canExecuteUpdate() && verificationData && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Database update is disabled. Ensure there are matched lessons and no duplicate entries.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {updateResult && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{updateResult}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Verification Table */}
        {verificationData && (
          <Card>
            <CardHeader>
              <CardTitle>Verification Table - Manual Review Required</CardTitle>
              <p className="text-sm text-gray-600">
                Review the lesson matching before executing the database update
              </p>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chapter</TableHead>
                      <TableHead>Lesson Name</TableHead>
                      <TableHead>Matched Content</TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verificationData.verificationTable.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium max-w-32 truncate">
                          {item.chapterName}
                        </TableCell>
                        <TableCell className="max-w-48 truncate">
                          {item.lessonName}
                        </TableCell>
                        <TableCell className="max-w-48 truncate">
                          {item.matchedLessonTitle}
                        </TableCell>
                        <TableCell className="max-w-64 truncate text-sm text-gray-600">
                          {item.contentPreview}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(item.status)}
                              {item.status}
                            </div>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && !verificationData && (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-4 text-gray-600">Generating verification table from read-only preview...</p>
          </div>
        )}
      </div>
    </div>
  );
}