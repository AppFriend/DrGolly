import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Calendar, Clock, Award, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Track() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: userProgress, isLoading, error } = useQuery({
    queryKey: ["/api/user/progress"],
    enabled: !!user,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const calculateOverallProgress = () => {
    if (!userProgress || userProgress.length === 0) return 0;
    const totalProgress = userProgress.reduce((sum: number, item: any) => sum + item.progress, 0);
    return Math.round(totalProgress / userProgress.length);
  };

  const getCompletedCourses = () => {
    if (!userProgress) return 0;
    return userProgress.filter((item: any) => item.isCompleted).length;
  };

  const getStreakDays = () => {
    // Mock streak calculation - in real app, this would be calculated from actual data
    return 7;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dr-bg">
        <div className="animate-pulse p-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dr-bg pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4">
        <h1 className="text-lg font-semibold flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-dr-teal" />
          Your Progress
        </h1>
        <p className="text-sm text-gray-600">Track your learning journey and achievements</p>
      </div>

      {/* Progress Stats */}
      <div className="p-4 space-y-4">
        {/* Overall Progress */}
        <Card className="border-dr-teal/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Target className="h-5 w-5 mr-2 text-dr-teal" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="text-2xl font-bold text-dr-teal">{calculateOverallProgress()}%</span>
              </div>
              <Progress value={calculateOverallProgress()} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-dr-teal/10 rounded-lg p-3">
                  <div className="text-2xl font-bold text-dr-teal">{userProgress?.length || 0}</div>
                  <div className="text-xs text-gray-600">Started</div>
                </div>
                <div className="bg-green-100 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{getCompletedCourses()}</div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
                <div className="bg-orange-100 rounded-lg p-3">
                  <div className="text-2xl font-bold text-orange-600">{getStreakDays()}</div>
                  <div className="text-xs text-gray-600">Day Streak</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Clock className="h-5 w-5 mr-2 text-dr-teal" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userProgress?.slice(0, 5).map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-dr-teal rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{item.progress}%</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Course Progress</h4>
                      <p className="text-xs text-gray-500">
                        Last watched: {new Date(item.lastWatched).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {item.isCompleted && (
                    <Award className="h-5 w-5 text-green-500" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Learning Goals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-dr-teal" />
              Learning Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Weekly Goal</span>
                <span className="text-sm font-medium">3 courses</span>
              </div>
              <Progress value={66} className="h-2" />
              <div className="text-xs text-gray-500">2 of 3 courses completed this week</div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Award className="h-5 w-5 mr-2 text-dr-teal" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-dr-teal/10 rounded-lg p-3 text-center">
                <Award className="h-8 w-8 text-dr-teal mx-auto mb-2" />
                <div className="text-sm font-medium">First Course</div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-3 text-center">
                <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-400">Sleep Expert</div>
                <div className="text-xs text-gray-400">Locked</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-3 text-center">
                <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-400">Nutrition Pro</div>
                <div className="text-xs text-gray-400">Locked</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-3 text-center">
                <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-400">Streak Master</div>
                <div className="text-xs text-gray-400">Locked</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        {(!userProgress || userProgress.length === 0) && (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Your Learning Journey</h3>
            <p className="text-gray-500 mb-4">
              Begin watching courses to track your progress and earn achievements.
            </p>
            <button
              onClick={() => window.location.href = "/courses"}
              className="bg-dr-teal text-white px-6 py-2 rounded-lg hover:bg-dr-teal-dark transition-colors"
            >
              Browse Courses
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
