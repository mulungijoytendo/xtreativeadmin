import React, { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendMessageError, setSendMessageError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No auth token found. Please log in.");
        const res = await fetch(`${API_BASE_URL}/users/list/`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Error fetching users: ${res.statusText}`);
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  /**
   * Send a chat message to a user. As admin, this will:
   *  1) Create or fetch a conversation via admin-user endpoint
   *  2) Post the message to the conversation messages endpoint
   * Returns the saved message object.
   */
  const sendMessage = async (content, toUserId) => {
    setSendingMessage(true);
    setSendMessageError(null);
    try {
      const token = localStorage.getItem("authToken");
      // 1) Create conversation as admin
      const convRes = await fetch(
        `${API_BASE_URL}/chatsapp/conversations/admin-user/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ user_id: toUserId }),
        }
      );
      if (!convRes.ok) throw new Error(`Error creating conversation: ${convRes.statusText}`);
      const convData = await convRes.json();
      const convId = convData.id;

      // 2) Send message to conversation
      const msgRes = await fetch(
        `${API_BASE_URL}/chatsapp/conversations/${convId}/messages/create/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content }),
        }
      );
      if (!msgRes.ok) throw new Error(`Error sending message: ${msgRes.statusText}`);
      const msgData = await msgRes.json();

      // Map API response into our message shape
      return {
        id: msgData.id,
        from: 'me',
        to: toUserId,
        text: msgData.content,
        time: new Date(msgData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: msgData.is_read,
        timestamp: msgData.timestamp,
      };
    } catch (err) {
      setSendMessageError(err.message);
      throw err;
    } finally {
      setSendingMessage(false);
    }
  };

  /** Helper to get username by id */
  const getUsernameById = (userId) => {
    const user = users.find((u) => u.id === Number(userId));
    return user ? user.username : "Unknown";
  };

  return (
    <UserContext.Provider
      value={{
        users,
        getUsernameById,
        loadingUsers,
        error,
        sendMessage,
        sendingMessage,
        sendMessageError,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};