import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, X, Plus, DollarSign, Calendar, Eye } from "lucide-react";

interface Course {
  id: string;
  title: string;
  price: number;
  category: string;
  thumbnailUrl: string;
}

interface UserCourse {
  id: string;
  courseId: string;
  userId: string;
  purchasedAt: string;
  amount: number;
  status: string;
  course: Course;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  firstName?: string;
  lastName?: string;
}

interface UserCourseManagementProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserCourseManagement({ user, isOpen, onClose }: UserCourseManagementProps) {
  const [selectedCourse, setSelectedCourse] = useState<UserCourse | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userCourses, isLoading: coursesLoading } = useQuery({
    queryKey: [`/api/admin/users/${user.id}/courses`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/users/${user.id}/courses`);
      return await response.json();
    },
    enabled: isOpen,
  });

  const { data: availableCourses } = useQuery({
    queryKey: ["/api/courses"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/courses");
      return await response.json();
    },
    enabled: isOpen,
  });

  const addCourseMutation = useMutation({
    mutationFn: ({ courseId }: { courseId: string }) =>
      apiRequest("POST", `/api/admin/users/${user.id}/courses`, { courseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${user.id}/courses`] });
      toast({
        title: "Success",
        description: "Course added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeCourseMutation = useMutation({
    mutationFn: ({ courseId }: { courseId: string }) =>
      apiRequest("DELETE", `/api/admin/users/${user.id}/courses/${courseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${user.id}/courses`] });
      toast({
        title: "Success",
        description: "Course removed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddCourse = (courseId: string) => {
    addCourseMutation.mutate({ courseId });
  };

  const handleRemoveCourse = (courseId: string) => {
    removeCourseMutation.mutate({ courseId });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "sleep":
        return "bg-blue-100 text-blue-800";
      case "nutrition":
        return "bg-green-100 text-green-800";
      case "health":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Management: {user.first_name || user.firstName} {user.last_name || user.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User's Purchased Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Purchased Courses ({userCourses?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : userCourses?.length > 0 ? (
                <div className="space-y-3">
                  {userCourses.map((userCourse: UserCourse) => (
                    <div
                      key={userCourse.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-gray-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">{userCourse.course?.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Badge className={getCategoryColor(userCourse.course?.category || "")}>
                              {userCourse.course?.category}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${userCourse.amount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(userCourse.purchasedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveCourse(userCourse.courseId)}
                        disabled={removeCourseMutation.isPending}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No courses purchased yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Courses to Add */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Course Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableCourses?.filter((course: Course) => 
                  !userCourses?.some((uc: UserCourse) => uc.courseId === course.id)
                ).map((course: Course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{course.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getCategoryColor(course.category)} text-xs`}>
                            {course.category}
                          </Badge>
                          <span className="text-xs text-gray-500">${course.price}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCourse(course.id)}
                      disabled={addCourseMutation.isPending}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}