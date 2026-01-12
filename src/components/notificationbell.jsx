import React, { useState, useRef, useEffect } from "react";
import { FiBell, FiX } from "react-icons/fi";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [showFullPage, setShowFullPage] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Toggle dropdown with force close on second click
  const toggleDropdown = () => {
    console.log('🔍 TOGGLE - Current state:', open);
    setOpen(prev => !prev);
    if (showFullPage) setShowFullPage(false); // Close full page if open
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      console.log('🔍 Closing dropdown - clicked outside');
      setOpen(false);
      setShowFullPage(false);
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setShowFullPage(false);
      }
    };
    if (open || showFullPage) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, showFullPage]);

  // Generic fetch function
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      console.warn("No auth token found");
      return null;
    }

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        console.error(`Failed to fetch ${url}:`, response.status);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      return null;
    }
  };

  // Fetch all notifications
  const fetchNotifications = async (isInitial = false) => {
    console.log('🔍 Fetching notifications...');
    // Only show loading on initial fetch or if no data
    if (isInitial || notifications.length === 0) {
      setLoading(true);
    }
    
    const allNotificationsData = await fetchWithAuth(
      `${API_BASE_URL}/notifications/all/`
    );

    console.log('🔍 Raw API response:', allNotificationsData);

    if (allNotificationsData) {
      let notificationsArray = [];
      
      if (Array.isArray(allNotificationsData)) {
        notificationsArray = allNotificationsData;
      } else if (allNotificationsData.notifications) {
        notificationsArray = allNotificationsData.notifications;
      } else if (allNotificationsData.results) {
        notificationsArray = allNotificationsData.results;
      } else {
        notificationsArray = [allNotificationsData];
      }

      console.log('🔍 Processing', notificationsArray.length, 'notifications');

      const standardizedNotifications = notificationsArray.map(notif => {
        return {
          id: notif.id || notif.notification_id || Math.random().toString(),
          title: notif.title || notif.message_content || notif.subject || 'New Notification',
          message: notif.message_content || notif.details || notif.description || notif.body || 'No details available',
          type: notif.type || notif.category || 'General',
          created_at: notif.created_at || notif.timestamp || notif.date_created || new Date().toISOString(),
          is_read: notif.is_read === false || notif.read === false ? false : (notif.is_read || notif.read || true),
          sender: notif.sender || notif.from_user || { username: 'System' },
          order_id: notif.order_id || notif.order?.id,
          customer_id: notif.customer_id || notif.customer?.id,
          vendor_id: notif.vendor_id || notif.vendor?.id,
          ...notif
        };
      }).filter(notif => notif.id);

      const sortedNotifications = standardizedNotifications.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      console.log('🔍 Setting', sortedNotifications.length, 'notifications');
      setNotifications(sortedNotifications);
      
      const unread = sortedNotifications.filter(n => !n.is_read).length;
      setUnreadCount(unread);
      console.log('🔍 Unread count:', unread);
    } else {
      console.log('🔍 No data from API, setting empty state');
      setNotifications([]);
      setUnreadCount(0);
    }

    setLoading(false);
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    const token = localStorage.getItem("authToken");
    
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/mark-read/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Optimistically update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        // Refetch to sync with backend
        await fetchNotifications();
      } else {
        console.error(`Failed to mark as read: ${response.status}`);
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const token = localStorage.getItem("authToken");
    
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/mark-all-read/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Optimistically update local state
        setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
        setUnreadCount(0);
        // Refetch to sync with backend
        await fetchNotifications();
      } else {
        console.error(`Failed to mark all as read: ${response.status}`);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Setup event listeners
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications on mount and every 60 seconds
  useEffect(() => {
    fetchNotifications(true); // Initial fetch with loading
    const interval = setInterval(() => fetchNotifications(false), 60000);
    return () => clearInterval(interval);
  }, []);

  // Format time ago
  const timeAgo = (dateString) => {
    try {
      const now = new Date();
      const date = new Date(dateString);
      if (isNaN(date.getTime())) throw new Error('Invalid date');
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Unknown time';
    }
  };

  // Loading state
  if (loading && notifications.length === 0) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button 
          className="relative p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow flex items-center justify-center"
          onClick={toggleDropdown}
        >
          <FiBell className="text-gray-600" size={20} />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            ...
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center group"
        aria-label={`${unreadCount} unread notifications`}
      >
        <FiBell 
          className={`text-gray-600 transition-colors ${unreadCount > 0 ? 'text-blue-600' : ''}`}
          size={20}
        />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center shadow-lg animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {open && !showFullPage && (
        <div 
          className="fixed top-16 right-4 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] max-h-[70vh] overflow-hidden"
          style={{ 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-600">
                  {unreadCount} unread • {notifications.length} total
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    unreadCount === 0 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-blue-600 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  Mark all read
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(70vh-120px)]">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FiBell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h4 className="text-lg font-medium mb-2">No notifications</h4>
                <p className="text-sm">You're all caught up!</p>
                <button 
                  onClick={() => fetchNotifications(false)}
                  className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Refresh
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.slice(0, 15).map((notification) => {
                  const isUnread = !notification.is_read;
                  
                  return (
                    <li
                      key={notification.id}
                      className={`
                        p-4 hover:bg-gray-50 transition-colors cursor-pointer
                        ${isUnread ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
                      `}
                      onClick={() => isUnread && markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 self-center">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isUnread ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className={`text-sm font-medium truncate ${
                              isUnread ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            {isUnread && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium"
                                title="Mark as read"
                              >
                                ✓
                              </button>
                            )}
                          </div>
                          <p className={`text-sm ${isUnread ? 'text-gray-800' : 'text-gray-600'} mb-2 line-clamp-2`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="capitalize">{notification.type}</span>
                            <span>{timeAgo(notification.created_at)}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {notification.order_id && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Order #{notification.order_id}
                              </span>
                            )}
                            {notification.customer_id && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Customer #{notification.customer_id}
                              </span>
                            )}
                            {notification.vendor_id && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                Vendor #{notification.vendor_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
                {notifications.length > 15 && (
                  <li className="p-4 text-center text-gray-500 text-sm border-t">
                    Showing 15 of {notifications.length} notifications
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="p-3 border-t bg-gray-50 text-center">
            <button
              onClick={() => {
                setOpen(false);
                setShowFullPage(true);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full"
            >
              View all notifications ({notifications.length})
            </button>
          </div>
        </div>
      )}

      {/* Full Page Notifications Modal */}
      {showFullPage && (
        <div className="fixed inset-0 z-[9999] bg-white md:bg-black md:bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">All Notifications</h2>
                  <p className="text-sm text-gray-600">
                    {unreadCount} unread • {notifications.length} total
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      unreadCount === 0 
                        ? 'text-gray-400 cursor-not-allowed bg-gray-100' 
                        : 'text-blue-600 bg-blue-100 hover:bg-blue-200'
                    }`}
                  >
                    Mark all read
                  </button>
                  <button
                    onClick={() => setShowFullPage(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <FiX size={24} />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="text-gray-500 mt-4 text-lg">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <FiBell className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No notifications</h3>
                  <p className="text-gray-500 mb-4">You're all caught up!</p>
                  <button 
                    onClick={() => fetchNotifications(false)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100"
                  >
                    Refresh
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notifications.map((notification) => {
                    const isUnread = !notification.is_read;
                    
                    return (
                      <div
                        key={notification.id}
                        className={`
                          p-6 rounded-lg border bg-white hover:shadow-md transition-all
                          ${isUnread ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                        `}
                        onClick={() => isUnread && markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 self-center">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                isUnread ? 'bg-blue-500' : 'bg-gray-300'
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className={`text-base font-semibold ${
                                isUnread ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h3>
                              {isUnread && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  title="Mark as read"
                                >
                                  ✓
                                </button>
                              )}
                            </div>
                            <p className={`text-sm ${
                              isUnread ? 'text-gray-800' : 'text-gray-600'
                            } mb-3`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                              <span className="capitalize">{notification.type}</span>
                              <span>{timeAgo(notification.created_at)}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {notification.order_id && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Order #{notification.order_id}
                                </span>
                              )}
                              {notification.customer_id && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Customer #{notification.customer_id}
                                </span>
                              )}
                              {notification.vendor_id && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Vendor #{notification.vendor_id}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 text-center">
              <button
                onClick={() => fetchNotifications(false)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100"
              >
                Refresh Notifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {(open || showFullPage) && (
        <div 
          className="fixed inset-0 z-[9998] bg-black bg-opacity-0 md:bg-opacity-50"
          onClick={() => {
            setOpen(false);
            setShowFullPage(false);
          }}
        />
      )}
    </div>
  );
};

export default NotificationBell;