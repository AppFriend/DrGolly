import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Check, ExternalLink, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { LoadingAnimation } from "@/components/ui/loading-animation";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: string;
  isRead: boolean;
  actionText?: string;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const queryClient = useQueryClient();

  // Fetch user notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: isOpen,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => 
      apiRequest('/api/notifications/mark-all-read', {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'normal':
        return 'border-l-brand-teal';
      case 'low':
        return 'border-l-gray-400';
      default:
        return 'border-l-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'birthday':
        return '🎂';
      case 'discount':
        return '💰';
      case 'welcome':
        return '👋';
      case 'system':
        return '⚙️';
      default:
        return '📢';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <div className="flex items-center gap-2">
            {notifications.some((n: Notification) => !n.isRead) && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-sm text-brand-teal hover:text-brand-teal/80 font-medium"
                disabled={markAllAsReadMutation.isPending}
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <LoadingAnimation size="md" message="Loading notifications..." />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">🔔</div>
              <p className="text-lg font-medium">No notifications yet</p>
              <p className="text-sm">We'll notify you when there's something new!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(notification.priority)} ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {getCategoryIcon(notification.category)}
                        </span>
                        <h3 className={`font-medium ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} />
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </div>
                        
                        {notification.actionText && (
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="text-xs text-brand-teal hover:text-brand-teal/80 font-medium flex items-center gap-1"
                          >
                            {notification.actionText}
                            <ExternalLink size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                        className="ml-2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                        disabled={markAsReadMutation.isPending}
                      >
                        <Check size={16} className="text-green-600" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer Close Button */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}