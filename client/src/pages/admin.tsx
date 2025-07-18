import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Shield, 
  BarChart3, 
  Users, 
  FileText, 
  GraduationCap, 
  Bell,
  Settings,
  Database
} from "lucide-react";
import drGollyLogo from "@assets/Dr Golly-Sleep-Logo-FA (1)_1752041757370.png";

// Import admin components
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminUserManagement } from "@/components/admin/AdminUserManagement";
import { AdminBlogManagement } from "@/components/admin/AdminBlogManagement";
import { AdminCourseManagement } from "@/components/admin/AdminCourseManagement";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { AdminUserSettings } from "@/components/admin/AdminUserSettings";
import { EnhancedCourseManagement } from "@/components/admin/EnhancedCourseManagement";
import { EnhancedBlogManagement } from "@/components/admin/EnhancedBlogManagement";
import { AdminBlogManagementSimple } from "@/components/admin/AdminBlogManagementSimple";
import AdminContentManager from "@/components/admin/AdminContentManager";


export default function AdminPanel() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Check if user is admin
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["/api/admin/check"],
    retry: false,
    enabled: !!user,
  });

  if (isLoading || checkingAdmin) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">You must be logged in to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Admin Access Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              You do not have admin permissions to access this panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center min-w-0">
              <Link href="/">
                <img 
                  src={drGollyLogo} 
                  alt="Dr. Golly" 
                  className="h-8 w-auto object-contain mr-3 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Badge variant="secondary" className="bg-[#6B9CA3] text-white text-xs sm:text-sm">
                Admin
              </Badge>
              <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[100px] sm:max-w-none">
                {user.firstName} {user.lastName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 mb-6 overflow-x-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Blog Posts</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Courses</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="admin-settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Admin Users</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="blog" className="mt-6">
            <AdminBlogManagementSimple />
          </TabsContent>

          <TabsContent value="courses" className="mt-6">
            <AdminCourseManagement />
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <AdminContentManager />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <AdminUserManagement />
          </TabsContent>


          <TabsContent value="notifications" className="mt-6">
            <AdminNotifications />
          </TabsContent>

          <TabsContent value="admin-settings" className="mt-6">
            <AdminUserSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}