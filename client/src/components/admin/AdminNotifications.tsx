import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Image,
  Send,
  Clock
} from "lucide-react";

interface AdminNotification {
  id: number;
  heading: string;
  body: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function AdminNotifications() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/admin/notifications"],
  });

  const createNotificationMutation = useMutation({
    mutationFn: (notification: Partial<AdminNotification>) =>
      apiRequest("POST", "/api/admin/notifications", notification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({
        title: "Success",
        description: "Notification created successfully",
      });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateNotificationMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<AdminNotification> }) =>
      apiRequest("PATCH", `/api/admin/notifications/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({
        title: "Success",
        description: "Notification updated successfully",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({
        title: "Success",
        description: "Notification deleted successfully",
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

  const handleCreateNotification = (notificationData: Partial<AdminNotification>) => {
    createNotificationMutation.mutate(notificationData);
  };

  const handleUpdateNotification = (updates: Partial<AdminNotification>) => {
    if (!selectedNotification) return;
    updateNotificationMutation.mutate({ id: selectedNotification.id, updates });
  };

  const handleDeleteNotification = (id: number) => {
    if (confirm("Are you sure you want to delete this notification?")) {
      deleteNotificationMutation.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications Center</h2>
          <p className="text-muted-foreground">
            Create and manage push notifications for all users
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#6B9CA3] hover:bg-[#095D66]">
              <Plus className="h-4 w-4 mr-2" />
              Create Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Notification</DialogTitle>
            </DialogHeader>
            <NotificationForm
              onSubmit={handleCreateNotification}
              isLoading={createNotificationMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Active Notifications ({notifications?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {notifications?.map((notification: AdminNotification) => (
                <div
                  key={notification.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start space-x-4 flex-1">
                    {notification.imageUrl && (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Image className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{notification.heading}</h3>
                        <Badge variant="outline" className="text-green-600">
                          Active
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{notification.body}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Created {formatDate(notification.createdAt)}
                        </span>
                        {notification.imageUrl && (
                          <span className="flex items-center gap-1">
                            <Image className="h-3 w-3" />
                            Has image
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedNotification(notification)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Notification</DialogTitle>
                        </DialogHeader>
                        {selectedNotification && (
                          <NotificationForm
                            notification={selectedNotification}
                            onSubmit={handleUpdateNotification}
                            isLoading={updateNotificationMutation.isPending}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteNotification(notification.id)}
                      disabled={deleteNotificationMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

interface NotificationFormProps {
  notification?: AdminNotification;
  onSubmit: (data: Partial<AdminNotification>) => void;
  isLoading: boolean;
}

function NotificationForm({ notification, onSubmit, isLoading }: NotificationFormProps) {
  const [formData, setFormData] = useState({
    heading: notification?.heading || "",
    body: notification?.body || "",
    imageUrl: notification?.imageUrl || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="heading">Notification Heading</Label>
        <Input
          id="heading"
          value={formData.heading}
          onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
          placeholder="Enter notification title..."
          required
        />
      </div>

      <div>
        <Label htmlFor="body">Notification Body</Label>
        <Textarea
          id="body"
          value={formData.body}
          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          placeholder="Enter notification message..."
          rows={4}
          required
        />
      </div>

      <div>
        <Label htmlFor="imageUrl">Image URL (Optional)</Label>
        <Input
          id="imageUrl"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Send className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {notification ? "Update" : "Send"} Notification
            </>
          )}
        </Button>
      </div>
    </form>
  );
}