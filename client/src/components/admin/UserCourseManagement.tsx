import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Trash2, 
  Plus, 
  BookOpen, 
  Calendar, 
  DollarSign,
  ShoppingCart,
  X
} from "lucide-react";
import { Course } from "@shared/schema";

interface UserCourseManagementProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

interface CoursePurchase {
  id: number;
  userId: string;
  courseId: number;
  status: string;
  amount: number;
  currency: string;
  purchasedAt: string;
  course: Course;
}

export default function UserCourseManagement({ userId, userName, onClose }: UserCourseManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's purchased courses
  const { data: userCourses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/admin/users", userId, "courses"],
    queryFn: () => apiRequest("GET", `/api/admin/users/${userId}/courses`),
    staleTime: 0,
  });

  // Fetch all available courses
  const { data: allCourses = [], isLoading: allCoursesLoading } = useQuery({
    queryKey: ["/api/admin/courses"],
    queryFn: () => apiRequest("GET", "/api/admin/courses"),
    staleTime: 0,
  });

  // Add course mutation
  const addCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/courses`, {
        courseId
      });
    },
    onSuccess: () => {
      toast({
        title: "Course Added",
        description: "Course successfully added to user.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "courses"] });
      setIsAddDialogOpen(false);
      setSelectedCourseId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error Adding Course",
        description: error.message || "Failed to add course to user.",
        variant: "destructive",
      });
    },
  });

  // Remove course mutation
  const removeCourseMutation = useMutation({
    mutationFn: async (purchaseId: number) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}/courses/${purchaseId}`);
    },
    onSuccess: () => {
      toast({
        title: "Course Removed",
        description: "Course successfully removed from user.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "courses"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Removing Course",
        description: error.message || "Failed to remove course from user.",
        variant: "destructive",
      });
    },
  });

  // Get available courses that user doesn't have
  const availableCourses = allCourses.filter(course => 
    !userCourses.some((purchase: CoursePurchase) => 
      purchase.courseId === course.id && purchase.status === 'completed'
    )
  );

  const handleAddCourse = () => {
    if (selectedCourseId) {
      addCourseMutation.mutate(selectedCourseId);
    }
  };

  const handleRemoveCourse = (purchaseId: number) => {
    removeCourseMutation.mutate(purchaseId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPrice = (amount: number) => {
    return amount === 0 ? "Free" : `$${(amount / 100).toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Course Management: {userName}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-teal-600" />
              <h3 className="text-lg font-medium">
                Purchased Courses ({userCourses.length})
              </h3>
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Course to User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Select Course
                    </label>
                    <Select 
                      value={selectedCourseId?.toString() || ""} 
                      onValueChange={(value) => setSelectedCourseId(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a course to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.title} - {course.category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddCourse}
                      disabled={!selectedCourseId || addCourseMutation.isPending}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      {addCourseMutation.isPending ? "Adding..." : "Add Course"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {coursesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto" />
              <p className="mt-2 text-sm text-gray-600">Loading courses...</p>
            </div>
          ) : userCourses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No courses purchased yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Click "Add Course" to grant access to courses.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userCourses.map((purchase: CoursePurchase) => (
                <Card key={purchase.id} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-lg">
                            {purchase.course?.title || "Unknown Course"}
                          </h4>
                          <Badge 
                            variant={purchase.status === 'completed' ? 'default' : 'secondary'}
                            className={purchase.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {purchase.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {purchase.course?.category || "Unknown"}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formatPrice(purchase.amount)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(purchase.purchasedAt)}
                          </div>
                        </div>
                        
                        {purchase.course?.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {purchase.course.description}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveCourse(purchase.id)}
                        disabled={removeCourseMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}