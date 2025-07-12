import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Baby, Calendar, Clock, TrendingUp, Video, Timer, Moon, Sun, Gift, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { Child, GrowthEntry, DevelopmentMilestone, DevelopmentTracking, FeedEntry, SleepEntry, ConsultationBooking } from "@shared/schema";

export default function Track() {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeChild, setActiveChild] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("growth");

  // Check URL parameters for section navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    if (section) {
      setActiveTab(section);
    }
  }, []);

  // Fetch user's children
  const { data: children = [], isLoading: isChildrenLoading } = useQuery({
    queryKey: ["/api/children"],
    enabled: isAuthenticated,
  });

  // Set first child as active by default
  useEffect(() => {
    if (children.length > 0 && !activeChild) {
      setActiveChild(children[0].id);
    }
  }, [children, activeChild]);

  // Authorization check
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isAuthLoading, toast]);

  if (isAuthLoading || isChildrenLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200"></div>
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="bg-white border-b border-gray-100 p-4">
          <h1 className="text-lg font-semibold flex items-center font-heading">
            <TrendingUp className="mr-2 h-5 w-5 text-[#83CFCC]" />
            Track
          </h1>
        </div>
        <div className="text-center py-12 px-4">
          <Baby className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2 font-heading">No Children Added</h2>
          <p className="text-gray-600 mb-6 font-sans">
            Add your children in the Family section to start tracking their growth and development.
          </p>
        </div>
      </div>
    );
  }

  const activeChildData = children.find((child: Child) => child.id === activeChild);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4">
        <h1 className="text-lg font-semibold flex items-center font-heading">
          <TrendingUp className="mr-2 h-5 w-5 text-[#83CFCC]" />
          Track
        </h1>
      </div>

      <div className="p-4">
        {/* Child Selector */}
        {children.length > 1 && (
          <div className="mb-4">
            <Label>Select Child</Label>
            <div className="relative">
              <select
                value={activeChild || ""}
                onChange={(e) => setActiveChild(parseInt(e.target.value))}
                className="w-full p-2 pl-12 border border-gray-300 rounded-md mt-1 appearance-none bg-white"
              >
                {children.map((child: Child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                {(() => {
                  const selectedChild = children.find(c => c.id === activeChild);
                  return selectedChild?.profilePicture ? (
                    <img 
                      src={selectedChild.profilePicture} 
                      alt={selectedChild.name} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-[#83CFCC]/10 rounded-full flex items-center justify-center">
                      <Baby className="h-4 w-4 text-[#83CFCC]" />
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Active Child Info */}
        {activeChildData && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#83CFCC]/10 rounded-full flex items-center justify-center">
                  <Baby className="h-6 w-6 text-[#83CFCC]" />
                </div>
                <div>
                  <h3 className="font-semibold font-heading">{activeChildData.name}</h3>
                  <p className="text-sm text-gray-600 font-sans">
                    Born: {new Date(activeChildData.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tracking Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="growth" className="text-xs">Growth</TabsTrigger>
            <TabsTrigger value="development" className="text-xs">Dev</TabsTrigger>
            <TabsTrigger value="feed" className="text-xs">Feed</TabsTrigger>
            <TabsTrigger value="sleep" className="text-xs">Sleep</TabsTrigger>
            <TabsTrigger value="review" className="text-xs">Review</TabsTrigger>
          </TabsList>
          
          <TabsContent value="growth">
            <GrowthTracking childId={activeChild} />
          </TabsContent>
          
          <TabsContent value="development">
            <DevelopmentTracking childId={activeChild} />
          </TabsContent>
          
          <TabsContent value="feed">
            <FeedingTracking childId={activeChild} />
          </TabsContent>
          
          <TabsContent value="sleep">
            <SleepTracking childId={activeChild} />
          </TabsContent>
          
          <TabsContent value="review">
            <ConsultationBooking />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function GrowthTracking({ childId }: { childId: number | null }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    weight: "",
    height: "",
    headCircumference: "",
    date: new Date().toISOString().split('T')[0]
  });

  // Fetch child data
  const { data: children = [] } = useQuery({
    queryKey: ["/api/children"],
  });
  
  const childData = children.find((child: any) => child.id === childId);

  // Fetch growth entries
  const { data: growthEntries = [], isLoading } = useQuery({
    queryKey: ["/api/children", childId, "growth"],
    enabled: !!childId,
  });

  // Add growth entry mutation
  const addGrowthMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest('POST', `/api/children/${childId}/growth`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "growth"] });
      setFormData({ weight: "", height: "", headCircumference: "", date: new Date().toISOString().split('T')[0] });
      toast({
        title: "Success",
        description: "Growth entry added successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add growth entry.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.weight && !formData.height && !formData.headCircumference) {
      toast({
        title: "Error",
        description: "Please enter at least one measurement.",
        variant: "destructive",
      });
      return;
    }
    addGrowthMutation.mutate(formData);
  };

  if (!childId) return <div>Please select a child to track growth.</div>;

  return (
    <div className="space-y-4">
      {/* Add New Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">
            Add Growth Entry{childData?.name ? ` for ${childData.name}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="4.5"
                />
              </div>
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                  placeholder="52.5"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="headCircumference">Head Circumference (cm)</Label>
              <Input
                id="headCircumference"
                type="number"
                step="0.1"
                value={formData.headCircumference}
                onChange={(e) => setFormData(prev => ({ ...prev, headCircumference: e.target.value }))}
                placeholder="35.2"
              />
            </div>
            
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={addGrowthMutation.isPending}
              className="w-full bg-[#83CFCC] hover:bg-[#095D66]"
            >
              {addGrowthMutation.isPending ? "Adding..." : "Add Entry"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Growth History */}
      <div className="space-y-2">
        <h3 className="font-semibold font-heading">Growth History</h3>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : growthEntries.length > 0 ? (
          growthEntries.map((entry: GrowthEntry) => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold font-heading">
                      {new Date(entry.date).toLocaleDateString()}
                    </p>
                    <div className="text-sm text-gray-600 space-y-1">
                      {entry.weight && <p>Weight: {entry.weight} kg</p>}
                      {entry.height && <p>Height: {entry.height} cm</p>}
                      {entry.headCircumference && <p>Head: {entry.headCircumference} cm</p>}
                    </div>
                  </div>
                  <TrendingUp className="h-5 w-5 text-[#83CFCC]" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No growth entries yet</p>
        )}
      </div>
    </div>
  );
}

function DevelopmentTracking({ childId }: { childId: number | null }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch milestones
  const { data: milestones = [] } = useQuery({
    queryKey: ["/api/milestones"],
  });

  // Fetch child's development tracking
  const { data: tracking = [], isLoading } = useQuery({
    queryKey: ["/api/children", childId, "development"],
    enabled: !!childId,
  });

  // Update milestone tracking
  const updateTrackingMutation = useMutation({
    mutationFn: async ({ milestoneId, status }: { milestoneId: number; status: 'yes' | 'sometimes' | 'not_yet' }) => {
      return await apiRequest('POST', `/api/children/${childId}/development`, { 
        milestoneId, 
        status,
        achievedDate: status === 'yes' ? new Date().toISOString() : null 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "development"] });
      toast({
        title: "Success",
        description: "Milestone updated successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update milestone.",
        variant: "destructive",
      });
    },
  });

  const getMilestoneStatus = (milestoneId: number) => {
    return tracking.find((t: DevelopmentTracking) => t.milestoneId === milestoneId);
  };

  if (!childId) return <div>Please select a child to track development.</div>;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold font-heading">Development Milestones</h3>
      
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      ) : milestones.length > 0 ? (
        milestones.map((milestone: DevelopmentMilestone) => {
          const status = getMilestoneStatus(milestone.id);
          const currentStatus = status?.status || null;
          
          return (
            <Card key={milestone.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="h-4 w-4 text-[#83CFCC]" />
                      <h4 className="font-semibold font-heading">{milestone.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                    <p className="text-xs text-gray-500">
                      Age range: {milestone.ageRangeStart}-{milestone.ageRangeEnd} months
                    </p>
                    {status?.achievedDate && (
                      <p className="text-xs text-green-600 mt-1">
                        Achieved: {new Date(status.achievedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {/* Three pill options */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateTrackingMutation.mutate({ 
                          milestoneId: milestone.id, 
                          status: 'yes' 
                        })}
                        disabled={updateTrackingMutation.isPending}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          currentStatus === 'yes' 
                            ? 'bg-green-600 text-white border-green-600' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => updateTrackingMutation.mutate({ 
                          milestoneId: milestone.id, 
                          status: 'sometimes' 
                        })}
                        disabled={updateTrackingMutation.isPending}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          currentStatus === 'sometimes' 
                            ? 'bg-yellow-500 text-white border-yellow-500' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Sometimes
                      </button>
                      <button
                        onClick={() => updateTrackingMutation.mutate({ 
                          milestoneId: milestone.id, 
                          status: 'not_yet' 
                        })}
                        disabled={updateTrackingMutation.isPending}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          currentStatus === 'not_yet' 
                            ? 'bg-gray-500 text-white border-gray-500' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Not Yet
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <p className="text-gray-500 text-center py-8">No milestones available</p>
      )}
    </div>
  );
}

function FeedingTracking({ childId }: { childId: number | null }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [feedType, setFeedType] = useState<"breast" | "bottle">("breast");
  
  // Left breast timer state
  const [leftIsActive, setLeftIsActive] = useState(false);
  const [leftStartTime, setLeftStartTime] = useState<Date | null>(null);
  const [leftTimer, setLeftTimer] = useState(0);
  const [leftTotalDuration, setLeftTotalDuration] = useState(0);
  
  // Right breast timer state
  const [rightIsActive, setRightIsActive] = useState(false);
  const [rightStartTime, setRightStartTime] = useState<Date | null>(null);
  const [rightTimer, setRightTimer] = useState(0);
  const [rightTotalDuration, setRightTotalDuration] = useState(0);
  
  // Session tracking
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // Left breast timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (leftIsActive && leftStartTime) {
      interval = setInterval(() => {
        setLeftTimer(Math.floor((Date.now() - leftStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [leftIsActive, leftStartTime]);

  // Right breast timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (rightIsActive && rightStartTime) {
      interval = setInterval(() => {
        setRightTimer(Math.floor((Date.now() - rightStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [rightIsActive, rightStartTime]);

  // Fetch feed entries
  const { data: feedEntries = [], isLoading } = useQuery({
    queryKey: ["/api/children", childId, "feeds"],
    enabled: !!childId,
  });

  // Add feed entry mutation
  const addFeedMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', `/api/children/${childId}/feeds`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "feeds"] });
      toast({
        title: "Success",
        description: "Feed entry added successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add feed entry.",
        variant: "destructive",
      });
    },
  });

  const startLeftTimer = () => {
    if (!sessionStartTime) {
      setSessionStartTime(new Date());
    }
    setLeftIsActive(true);
    setLeftStartTime(new Date());
    setLeftTimer(0);
  };

  const stopLeftTimer = () => {
    if (leftStartTime) {
      const duration = Math.floor((Date.now() - leftStartTime.getTime()) / 1000);
      setLeftTotalDuration(prev => prev + duration);
    }
    setLeftIsActive(false);
    setLeftStartTime(null);
  };

  const startRightTimer = () => {
    if (!sessionStartTime) {
      setSessionStartTime(new Date());
    }
    setRightIsActive(true);
    setRightStartTime(new Date());
    setRightTimer(0);
  };

  const stopRightTimer = () => {
    if (rightStartTime) {
      const duration = Math.floor((Date.now() - rightStartTime.getTime()) / 1000);
      setRightTotalDuration(prev => prev + duration);
    }
    setRightIsActive(false);
    setRightStartTime(null);
  };

  const logFeedSession = () => {
    // Stop any active timers first and get final durations
    let finalLeftDuration = leftTotalDuration;
    let finalRightDuration = rightTotalDuration;
    
    if (leftIsActive && leftStartTime) {
      const duration = Math.floor((Date.now() - leftStartTime.getTime()) / 1000);
      finalLeftDuration = leftTotalDuration + duration;
      setLeftTotalDuration(finalLeftDuration);
      setLeftIsActive(false);
      setLeftStartTime(null);
    }
    
    if (rightIsActive && rightStartTime) {
      const duration = Math.floor((Date.now() - rightStartTime.getTime()) / 1000);
      finalRightDuration = rightTotalDuration + duration;
      setRightTotalDuration(finalRightDuration);
      setRightIsActive(false);
      setRightStartTime(null);
    }
    
    const finalTotalDuration = finalLeftDuration + finalRightDuration;
    
    if (sessionStartTime && finalTotalDuration > 0) {
      console.log('Logging feed session:', {
        leftDuration: finalLeftDuration,
        rightDuration: finalRightDuration,
        totalDuration: finalTotalDuration,
        leftDurationMinutes: Math.floor(finalLeftDuration / 60),
        rightDurationMinutes: Math.floor(finalRightDuration / 60),
        totalDurationMinutes: Math.floor(finalTotalDuration / 60),
      });
      
      addFeedMutation.mutate({
        leftDuration: Math.floor(finalLeftDuration / 60), // Convert to minutes
        rightDuration: Math.floor(finalRightDuration / 60), // Convert to minutes
        totalDuration: Math.floor(finalTotalDuration / 60), // Convert to minutes
        feedDate: sessionStartTime.toISOString(),
      });
      
      // Reset session
      resetSession();
    }
  };

  const resetSession = () => {
    setLeftIsActive(false);
    setRightIsActive(false);
    setLeftStartTime(null);
    setRightStartTime(null);
    setLeftTimer(0);
    setRightTimer(0);
    setLeftTotalDuration(0);
    setRightTotalDuration(0);
    setSessionStartTime(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!childId) return <div>Please select a child to track feeding.</div>;

  return (
    <div className="space-y-4">
      {/* Feed Timer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Feed Timer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Feed Type</Label>
            <select
              value={feedType}
              onChange={(e) => setFeedType(e.target.value as "breast" | "bottle")}
              className="w-full p-2 border border-gray-300 rounded-md mt-1"
              disabled={leftIsActive || rightIsActive}
            >
              <option value="breast">Breastfeeding</option>
              <option value="bottle">Bottle</option>
            </select>
          </div>
          
          {feedType === "breast" ? (
            <div className="space-y-4">
              {/* Left and Right Breast Timers Side by Side */}
              <div className="grid grid-cols-2 gap-2">
                {/* Left Breast Timer */}
                <div className="border rounded-lg p-2 bg-gray-50">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-700 text-xs">Left Breast</h3>
                    <div className="text-xs text-gray-500">
                      Total: {formatTime(leftTotalDuration)}
                    </div>
                  </div>
                  <div className="text-center mb-2">
                    <div className="text-lg font-mono font-bold text-[#83CFCC]">
                      {formatTime(leftIsActive ? leftTimer : 0)}
                    </div>
                  </div>
                  <Button
                    onClick={leftIsActive ? stopLeftTimer : startLeftTimer}
                    className={`w-full text-xs py-1.5 ${leftIsActive ? 'bg-red-500 hover:bg-red-600' : 'bg-[#83CFCC] hover:bg-[#095D66]'}`}
                    disabled={rightIsActive && !leftIsActive}
                  >
                    <Timer className="mr-1 h-3 w-3" />
                    {leftIsActive ? 'Stop Left' : 'Start Left'}
                  </Button>
                </div>

                {/* Right Breast Timer */}
                <div className="border rounded-lg p-2 bg-gray-50">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-700 text-xs">Right Breast</h3>
                    <div className="text-xs text-gray-500">
                      Total: {formatTime(rightTotalDuration)}
                    </div>
                  </div>
                  <div className="text-center mb-2">
                    <div className="text-lg font-mono font-bold text-[#83CFCC]">
                      {formatTime(rightIsActive ? rightTimer : 0)}
                    </div>
                  </div>
                  <Button
                    onClick={rightIsActive ? stopRightTimer : startRightTimer}
                    className={`w-full text-xs py-1.5 ${rightIsActive ? 'bg-red-500 hover:bg-red-600' : 'bg-[#83CFCC] hover:bg-[#095D66]'}`}
                    disabled={leftIsActive && !rightIsActive}
                  >
                    <Timer className="mr-1 h-3 w-3" />
                    {rightIsActive ? 'Stop Right' : 'Start Right'}
                  </Button>
                </div>
              </div>

              {/* Session Summary */}
              {sessionStartTime && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h3 className="font-medium text-gray-700 mb-2">Feed Session</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Started: {sessionStartTime.toLocaleTimeString()}</div>
                    <div>Total Time: {formatTime(leftTotalDuration + rightTotalDuration)}</div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={logFeedSession}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                      disabled={leftTotalDuration === 0 && rightTotalDuration === 0}
                    >
                      Log Feed
                    </Button>
                    <Button
                      onClick={resetSession}
                      variant="outline"
                      className="flex-1"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-[#83CFCC] mb-4">
                0:00
              </div>
              <Button className="w-full bg-[#83CFCC] hover:bg-[#095D66]">
                <Timer className="mr-2 h-4 w-4" />
                Start Bottle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feed History */}
      <div className="space-y-2">
        <h3 className="font-semibold font-heading">Recent Feeds</h3>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : feedEntries.length > 0 ? (
          feedEntries.slice(0, 10).map((entry: FeedEntry) => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold font-heading">
                      Breastfeeding - {formatTime((entry.totalDuration || 0) * 60)}
                    </p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        Left: {formatTime((entry.leftDuration || 0) * 60)} | 
                        Right: {formatTime((entry.rightDuration || 0) * 60)}
                      </div>
                      <div>
                        {entry.feedDate ? new Date(entry.feedDate).toLocaleString() : 'No date'}
                      </div>
                    </div>
                  </div>
                  <Timer className="h-5 w-5 text-[#83CFCC]" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No feed entries yet</p>
        )}
      </div>
    </div>
  );
}

function SleepTracking({ childId }: { childId: number | null }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [completionData, setCompletionData] = useState({
    quality: "good" as "poor" | "fair" | "good" | "excellent",
    notes: ""
  });

  // Fetch sleep entries
  const { data: sleepEntries = [], isLoading } = useQuery({
    queryKey: ["/api/children", childId, "sleep"],
    enabled: !!childId,
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime.getTime());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  // Add sleep entry mutation
  const addSleepMutation = useMutation({
    mutationFn: async (data: { sleepStart: string; sleepEnd: string; quality: string; notes: string }) => {
      return await apiRequest('POST', `/api/children/${childId}/sleep`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "sleep"] });
      setShowCompletionForm(false);
      setCompletionData({ quality: "good", notes: "" });
      toast({
        title: "Success",
        description: "Sleep entry saved successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save sleep entry.",
        variant: "destructive",
      });
    },
  });

  const startTracking = () => {
    const now = new Date();
    setStartTime(now);
    setIsTracking(true);
    setElapsedTime(0);
    toast({
      title: "Sleep Tracking Started",
      description: "Timer is now running. Sweet dreams!",
    });
  };

  const stopTracking = () => {
    if (!startTime) return;
    setIsTracking(false);
    setShowCompletionForm(true);
    toast({
      title: "Sleep Tracking Stopped",
      description: "Please rate the sleep quality to finish logging.",
    });
  };

  const saveEntry = () => {
    if (!startTime) return;
    
    const endTime = new Date();
    const sleepData = {
      sleepStart: startTime.toISOString(),
      sleepEnd: endTime.toISOString(),
      quality: completionData.quality,
      notes: completionData.notes
    };
    
    addSleepMutation.mutate(sleepData);
    setStartTime(null);
    setElapsedTime(0);
  };

  const formatElapsedTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return "";
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diff = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (!childId) return <div>Please select a child to track sleep.</div>;

  return (
    <div className="space-y-4">
      {/* Sleep Timer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Sleep Timer</CardTitle>
        </CardHeader>
        <CardContent>
          {!isTracking && !showCompletionForm && (
            <div className="text-center space-y-4">
              <div className="p-8">
                <Moon className="h-16 w-16 text-[#83CFCC] mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Tap to start tracking sleep time</p>
                <Button 
                  onClick={startTracking}
                  className="w-full bg-[#83CFCC] hover:bg-[#095D66] py-4 text-lg"
                >
                  Start Sleep Timer
                </Button>
              </div>
            </div>
          )}

          {isTracking && (
            <div className="text-center space-y-6">
              <div className="p-8">
                <div className="text-6xl font-mono font-bold text-[#83CFCC] mb-2">
                  {formatElapsedTime(elapsedTime)}
                </div>
                <p className="text-gray-600 mb-4">Sleep in progress...</p>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm text-gray-500">Recording</span>
                </div>
                <Button 
                  onClick={stopTracking}
                  variant="outline"
                  className="w-full border-[#83CFCC] text-[#83CFCC] hover:bg-[#83CFCC] hover:text-white py-4 text-lg"
                >
                  Stop Sleep Timer
                </Button>
              </div>
            </div>
          )}

          {showCompletionForm && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-[#83CFCC]/10 rounded">
                <p className="text-lg font-semibold">Sleep Duration: {formatElapsedTime(elapsedTime)}</p>
                <p className="text-sm text-gray-600">Started at {startTime?.toLocaleTimeString()}</p>
              </div>
              
              <div>
                <Label htmlFor="quality">How was the sleep quality?</Label>
                <select
                  id="quality"
                  value={completionData.quality}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, quality: e.target.value as any }))}
                  className="w-full p-3 border border-gray-300 rounded-md mt-1"
                >
                  <option value="poor">😴 Poor</option>
                  <option value="fair">😐 Fair</option>
                  <option value="good">😊 Good</option>
                  <option value="excellent">😍 Excellent</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <textarea
                  id="notes"
                  value={completionData.notes}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any observations about the sleep..."
                  className="w-full p-3 border border-gray-300 rounded-md mt-1 h-20 resize-none"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setShowCompletionForm(false);
                    setStartTime(null);
                    setElapsedTime(0);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={saveEntry}
                  disabled={addSleepMutation.isPending}
                  className="flex-1 bg-[#83CFCC] hover:bg-[#095D66]"
                >
                  {addSleepMutation.isPending ? "Saving..." : "Save Entry"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sleep History */}
      <div className="space-y-2">
        <h3 className="font-semibold font-heading">Sleep History</h3>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : sleepEntries.length > 0 ? (
          sleepEntries.slice(0, 10).map((entry: SleepEntry) => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold font-heading">
                      {entry.sleepStart && entry.sleepEnd ? calculateDuration(entry.sleepStart, entry.sleepEnd) : "Duration not available"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {entry.sleepStart && entry.sleepEnd ? 
                        `${new Date(entry.sleepStart).toLocaleDateString()} - ${new Date(entry.sleepEnd).toLocaleDateString()}` : 
                        "Date not available"
                      }
                    </p>
                    <p className="text-xs text-gray-500 capitalize">Quality: {entry.quality}</p>
                    {entry.notes && <p className="text-xs text-gray-500">{entry.notes}</p>}
                  </div>
                  <Moon className="h-5 w-5 text-[#83CFCC]" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No sleep entries yet</p>
        )}
      </div>
    </div>
  );
}

function ConsultationBooking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    consultationType: "sleep-review" as "sleep-review" | "development",
    preferredDate: "",
    preferredTime: "",
    concerns: ""
  });

  // Fetch consultation bookings
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["/api/consultations"],
  });

  // Book consultation mutation
  const bookConsultationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest('POST', '/api/consultations', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
      setFormData({ consultationType: "sleep-review", preferredDate: "", preferredTime: "", concerns: "" });
      toast({
        title: "Success",
        description: "Consultation booked successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to book consultation.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.preferredDate || !formData.preferredTime) {
      toast({
        title: "Error",
        description: "Please select a preferred date and time.",
        variant: "destructive",
      });
      return;
    }
    bookConsultationMutation.mutate(formData);
  };

  return (
    <div className="space-y-4">
      {/* Gold Member Loyalty Benefits - Only show for Gold/Platinum users */}
      {(user?.subscriptionTier === 'gold' || user?.subscriptionTier === 'platinum') && (
        <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800 font-heading">Gold Member Benefits</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Gift className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">FREE Sleep Review valued at $250</span>
              </div>
              <p className="text-xs text-yellow-600">
                Thanks for your first month as a Gold member! You've unlocked exclusive benefits including complimentary sleep consultations.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Book Consultation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Book Sleep Review</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="consultationType">Consultation Type</Label>
              <select
                id="consultationType"
                value={formData.consultationType}
                onChange={(e) => setFormData(prev => ({ ...prev, consultationType: e.target.value as any }))}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              >
                <option value="sleep-review">Sleep Review</option>
                <option value="development">Development Consultation</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preferredDate">Preferred Date</Label>
                <Input
                  id="preferredDate"
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="preferredTime">Preferred Time</Label>
                <Input
                  id="preferredTime"
                  type="time"
                  value={formData.preferredTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="concerns">Concerns/Questions</Label>
              <textarea
                id="concerns"
                value={formData.concerns}
                onChange={(e) => setFormData(prev => ({ ...prev, concerns: e.target.value }))}
                placeholder="What would you like to discuss during the consultation?"
                className="w-full p-2 border border-gray-300 rounded-md mt-1 h-20 resize-none"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={bookConsultationMutation.isPending}
              className="w-full bg-[#83CFCC] hover:bg-[#095D66]"
            >
              {bookConsultationMutation.isPending ? "Booking..." : "Book Consultation"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Booked Consultations */}
      <div className="space-y-2">
        <h3 className="font-semibold font-heading">Your Consultations</h3>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : bookings.length > 0 ? (
          bookings.map((booking: ConsultationBooking) => (
            <Card key={booking.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold font-heading capitalize">
                      {booking.consultationType.replace('-', ' ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.preferredDate).toLocaleDateString()} at {booking.preferredTime}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">Status: {booking.status}</p>
                    {booking.concerns && <p className="text-xs text-gray-500 mt-1">{booking.concerns}</p>}
                  </div>
                  <Calendar className="h-5 w-5 text-[#83CFCC]" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No consultations booked yet</p>
        )}
      </div>
    </div>
  );
}