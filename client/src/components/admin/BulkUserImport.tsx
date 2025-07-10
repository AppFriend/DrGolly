import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Users, Download, CheckCircle, AlertTriangle, Database } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

interface BulkImportResult {
  message: string;
  usersCreated: number;
  coursePurchasesCreated: number;
  processingTimeMs: number;
  sampleCredentials: Array<{
    email: string;
    temporaryPassword: string;
  }>;
}

export function BulkUserImport() {
  const [csvData, setCsvData] = useState("");
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (users: any[]) => {
      const response = await apiRequest("POST", "/api/admin/bulk-import", { users });
      return response as BulkImportResult;
    },
    onSuccess: (data) => {
      setImportResult(data);
      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.usersCreated} users and ${data.coursePurchasesCreated} course purchases in ${Math.round(data.processingTimeMs/1000)} seconds.`,
      });
      setCsvData("");
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import users. Please check your data format.",
        variant: "destructive",
      });
    },
  });

  const parseCsvData = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const user: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        // Map CSV headers to user schema - precise mapping for CSV migration
        switch (header.toLowerCase()) {
          case 'email':
            user.email = value;
            break;
          case 'first name':
          case 'firstname':
          case 'first_name':
            user.firstName = value;
            break;
          case 'last name':
          case 'lastname':
          case 'last_name':
            user.lastName = value;
            break;
          case 'first child dob':
          case 'firstchilddob':
            user.firstChildDob = value;
            break;
          case 'country':
            user.country = value;
            break;
          case 'user phone number':
          case 'phone':
            user.phone = value;
            break;
          case 'source':
          case 'signup_source':
          case 'signupsource':
            user.signupSource = value;
            break;
          case 'choose plan':
          case 'subscription_tier':
          case 'plan':
            user.subscriptionTier = value.toLowerCase() || 'free';
            break;
          case 'count courses':
          case 'countcourses':
            user.countCourses = parseInt(value) || 0;
            break;
          case 'courses purchased':
          case 'coursespurchased':
            user.coursesPurchased = value;
            break;
          case 'sign in count':
          case 'signincount':
            user.signInCount = parseInt(value) || 0;
            break;
          case 'last sign in':
          case 'lastsignin':
            user.lastSignIn = value;
            break;
          case 'account activated in app':
          case 'accountactivated':
            user.accountActivated = value.toLowerCase() === 'y' || value.toLowerCase() === 'yes';
            break;
          default:
            // Store unknown fields as is
            user[header] = value;
        }
      });
      
      return user;
    });
  };

  const handleImport = () => {
    if (!csvData.trim()) {
      toast({
        title: "Error",
        description: "Please enter CSV data to import",
        variant: "destructive",
      });
      return;
    }

    try {
      const users = parseCsvData(csvData);
      
      if (users.length === 0) {
        toast({
          title: "Error",
          description: "No valid user data found in CSV",
          variant: "destructive",
        });
        return;
      }

      if (users.length > 25000) {
        toast({
          title: "Error",
          description: "Maximum 25,000 users can be imported at once",
          variant: "destructive",
        });
        return;
      }

      importMutation.mutate(users);
    } catch (error) {
      toast({
        title: "Parse Error",
        description: "Invalid CSV format. Please check your data structure.",
        variant: "destructive",
      });
    }
  };

  const downloadSampleCredentials = () => {
    if (!importResult?.sampleCredentials) return;
    
    const csvContent = "email,temporaryPassword\n" + 
      importResult.sampleCredentials.map(cred => 
        `${cred.email},${cred.temporaryPassword}`
      ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_credentials.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Bulk User Import
          </CardTitle>
          <CardDescription>
            Import up to 20,000 users with automatic temporary password generation
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csvData">CSV Data</Label>
            <Textarea
              id="csvData"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="email,firstName,lastName,country,phone,signupSource,subscriptionTier&#10;user1@example.com,John,Doe,US,+1234567890,website,free&#10;user2@example.com,Jane,Smith,UK,+447123456789,referral,gold"
              className="min-h-[200px] font-mono text-sm"
            />
            <p className="text-sm text-gray-500">
              Required fields: email. Optional: firstName, lastName, country, phone, signupSource, subscriptionTier
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleImport}
              disabled={importMutation.isPending || !csvData.trim()}
              className="flex items-center gap-2"
            >
              {importMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import Users
                </>
              )}
            </Button>
            
            <div className="text-sm text-gray-500">
              {csvData.trim() && (
                <span>
                  {csvData.split('\n').length - 1} users ready for import
                </span>
              )}
            </div>
          </div>

          {importResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{importResult.message}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">
                        {importResult.usersCreated} users created
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={downloadSampleCredentials}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Sample Credentials
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Each user will receive a temporary password valid for 30 days. 
              They must use this password for first-time login and will be prompted to set a permanent password.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CSV Format Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium">Required Headers:</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside">
                <li><code>email</code> - User's email address (required)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium">Optional Headers:</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside">
                <li><code>firstName</code> - User's first name</li>
                <li><code>lastName</code> - User's last name</li>
                <li><code>country</code> - User's country</li>
                <li><code>phone</code> - User's phone number</li>
                <li><code>signupSource</code> - How they found the app</li>
                <li><code>subscriptionTier</code> - free, gold, or platinum</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium">Performance:</h4>
              <p className="text-sm text-gray-600">
                Optimized for 20,000+ users with batch processing and concurrent operations.
                Expected processing time: ~2-5 minutes for 20,000 users.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}