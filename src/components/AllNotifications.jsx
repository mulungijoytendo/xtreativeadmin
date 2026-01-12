import React, { useState, useEffect } from "react";

const AllNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async (url) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      console.warn("No auth token found. User might not be logged in.");
      return [];
    }

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch notifications from", url, "Status:", response.status, await response.text());
        return [];
      }

      const data = await response.json();
      console.log("Fetched notification data from", url, ":", data); // Debug log
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching notifications from", url, error);
      return [];
    }
  };

  useEffect(() => {
    const fetchAllNotifications = async () => {
      setLoading(true);
      const allNotifications = await fetchNotifications(
        `${API_BASE_URL}/notifications/all/`
      );
      const formattedNotifications = allNotifications.map((notif) => ({
        ...notif,
        message: notif.message || "No message",
        created_at: notif.created_at || new Date().toISOString(),
        read: notif.read || false,
        sender: notif.sender || { username: "Unknown" },
        avatar: notif.avatar || null,
      })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setNotifications(formattedNotifications);
      setLoading(false);
    };

    fetchAllNotifications();
  }, []);

  if (loading) {
    return <div className="p-4 text-gray-700">Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">All Notifications</h1>
      <ul className="divide-y">
        {notifications.length === 0 ? (
          <li className="p-3 text-sm text-gray-500">No notifications available</li>
        ) : (
          notifications.map((notification, index) => (
            <li key={index} className="p-3 flex items-center justify-between text-sm">
              <div className="flex items-center">
                {notification.avatar && (
                  <img src={notification.avatar} alt="avatar" className="w-8 h-8 rounded-full mr-2" />
                )}
                <span className={notification.read ? "text-gray-500" : "text-gray-700 font-medium"}>
                  {notification.message}
                </span>
              </div>
              {notification.sender?.username && (
                <span className="text-sm text-gray-500">{notification.sender.username}</span>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default AllNotifications;