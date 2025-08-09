import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Clock, Users, Database, Shield } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MigrationStatus {
  enabled: boolean;
  cohort: string;
  tempPassword: string;
  csvFile: string;
}

interface MigrationReport {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors: string[];
  details: any[];
}

export default function AdminMigration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('status');

  // Check migration feature status
  const { data: migrationStatus, isLoading: statusLoading } = useQuery<MigrationStatus>({
    queryKey: ['/api/admin/migration/status'],
    retry: false,
  });

  // Dry run mutation
  const dryRunMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/migration/dry-run');
      return response.json();
    },
    onSuccess: (data: MigrationReport) => {
      toast({
        title: "Dry Run Complete",
        description: `Analysis complete: ${data.totalProcessed} records processed`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/migration'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Dry Run Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test run mutation
  const testRunMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/migration/test-run');
      return response.json();
    },
    onSuccess: (data: MigrationReport) => {
      toast({
        title: "Test Run Complete",
        description: `${data.successCount}/${data.totalProcessed} users migrated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/migration'] });
      setSelectedTab('test-results');
    },
    onError: (error: Error) => {
      toast({
        title: "Test Run Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Full migration mutation
  const fullMigrationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/migration/execute');
      return response.json();
    },
    onSuccess: (data: MigrationReport) => {
      toast({
        title: "Migration Complete",
        description: `${data.successCount}/${data.totalProcessed} users migrated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/migration'] });
      setSelectedTab('results');
    },
    onError: (error: Error) => {
      toast({
        title: "Migration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Migration Control Panel</h1>
          <p className="text-gray-600">Legacy customer migration system for CSV cohort 2025-08-09</p>
        </div>

        {/* Feature Status Alert */}
        <Alert className={migrationStatus?.enabled ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <Shield className={`h-4 w-4 ${migrationStatus?.enabled ? "text-green-600" : "text-red-600"}`} />
          <AlertTitle className={migrationStatus?.enabled ? "text-green-800" : "text-red-800"}>
            Migration Feature {migrationStatus?.enabled ? "ENABLED" : "DISABLED"}
          </AlertTitle>
          <AlertDescription className={migrationStatus?.enabled ? "text-green-700" : "text-red-700"}>
            {migrationStatus?.enabled 
              ? `Ready to process ${migrationStatus.cohort} cohort with temp password authentication`
              : "Migration feature is currently disabled. Check environment variables."
            }
          </AlertDescription>
        </Alert>

        {migrationStatus?.enabled && (
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="dry-run">Dry Run</TabsTrigger>
              <TabsTrigger value="test-run">Test Run</TabsTrigger>
              <TabsTrigger value="execute">Execute</TabsTrigger>
            </TabsList>

            {/* Status Tab */}
            <TabsContent value="status" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Migration Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cohort:</span>
                      <Badge variant="outline">{migrationStatus.cohort}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">CSV File:</span>
                      <span className="text-sm font-mono">{migrationStatus.csvFile}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Temp Password:</span>
                      <span className="text-sm font-mono">{migrationStatus.tempPassword}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Safety Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Rollback protection enabled</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Duplicate email detection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Audit logging active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Medical content protected</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Dry Run Tab */}
            <TabsContent value="dry-run" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dry Run Analysis</CardTitle>
                  <CardDescription>
                    Analyze the CSV file without making any changes to the database.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => dryRunMutation.mutate()}
                    disabled={dryRunMutation.isPending}
                    className="w-full"
                  >
                    {dryRunMutation.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing CSV...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Run Dry Run Analysis
                      </>
                    )}
                  </Button>

                  {dryRunMutation.data && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Analysis Results</h4>
                      <div className="space-y-1 text-sm text-blue-800">
                        <div>Total records in CSV: {dryRunMutation.data.totalProcessed}</div>
                        <div>Valid for migration: {dryRunMutation.data.successCount}</div>
                        <div>Issues found: {dryRunMutation.data.errorCount}</div>
                      </div>
                      {dryRunMutation.data.errors.length > 0 && (
                        <div className="mt-2">
                          <h5 className="font-medium text-blue-900">Issues:</h5>
                          <ul className="list-disc list-inside text-sm text-blue-800">
                            {dryRunMutation.data.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Test Run Tab */}
            <TabsContent value="test-run" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Test Migration</CardTitle>
                  <CardDescription>
                    Migrate 3 specific users to test the system before full execution.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Test Run Warning</AlertTitle>
                    <AlertDescription>
                      This will create real user accounts for the first 3 CSV entries. Use rollback if needed.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={() => testRunMutation.mutate()}
                    disabled={testRunMutation.isPending}
                    className="w-full"
                    variant="outline"
                  >
                    {testRunMutation.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Running Test Migration...
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Run Test Migration (3 users)
                      </>
                    )}
                  </Button>

                  {testRunMutation.data && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Test Results</h4>
                      <div className="space-y-1 text-sm text-green-800">
                        <div>Users processed: {testRunMutation.data.totalProcessed}</div>
                        <div>Successfully migrated: {testRunMutation.data.successCount}</div>
                        <div>Errors: {testRunMutation.data.errorCount}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Execute Tab */}
            <TabsContent value="execute" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Full Migration Execution</CardTitle>
                  <CardDescription>
                    Execute the complete migration for all users in the CSV file.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>PRODUCTION MIGRATION WARNING</AlertTitle>
                    <AlertDescription>
                      This will migrate ALL users from the CSV file. Ensure test run was successful first.
                      A rollback savepoint has been created: "Stable prior to 50 users migrated - 09/08"
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={() => fullMigrationMutation.mutate()}
                    disabled={fullMigrationMutation.isPending}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    {fullMigrationMutation.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Executing Full Migration...
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Execute Full Migration
                      </>
                    )}
                  </Button>

                  {fullMigrationMutation.data && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Migration Complete</h4>
                      <div className="space-y-1 text-sm text-green-800">
                        <div>Total users processed: {fullMigrationMutation.data.totalProcessed}</div>
                        <div>Successfully migrated: {fullMigrationMutation.data.successCount}</div>
                        <div>Errors: {fullMigrationMutation.data.errorCount}</div>
                      </div>
                      {fullMigrationMutation.data.errorCount > 0 && (
                        <div className="mt-2">
                          <h5 className="font-medium text-red-900">Errors:</h5>
                          <ul className="list-disc list-inside text-sm text-red-800">
                            {fullMigrationMutation.data.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}