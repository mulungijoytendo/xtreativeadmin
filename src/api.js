const API_BASE_URL = "https://api-xtreative.onrender.com"; // your backend base URL

// Generic authenticated fetch helper
export const authFetch = async (path, options = {}) => {
  const token = localStorage.getItem("authToken"); // same key you already use

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    throw new Error("No auth token found. Please log in.");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.detail) message = data.detail;
    } catch {
      // ignore JSON parsing errors, keep default message
    }
    throw new Error(message);
  }

  // If no content
  if (res.status === 204) return null;

  return res.json();
};

// Generic fetch helper for public endpoints
export const publicFetch = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.detail) message = data.detail;
    } catch {
      // ignore JSON parsing errors, keep default message
    }
    throw new Error(message);
  }

  // If no content
  if (res.status === 204) return null;

  return res.json();
};

// Authentication APIs
// Admin login - POST /accounts/admin/login/
export const adminLogin = async (data) => {
  return publicFetch("/accounts/admin/login/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Resend OTP for admin - POST /accounts/admin/resend-otp/
export const adminResendOtp = async (data) => {
  return publicFetch("/accounts/admin/resend-otp/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Verify OTP for admin - POST /accounts/admin/verify-otp/
export const adminVerifyOtp = async (data) => {
  return publicFetch("/accounts/admin/verify-otp/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Admin password reset - POST /accounts/auth/admin-password-reset/
export const adminPasswordReset = async (data) => {
  return publicFetch("/accounts/auth/admin-password-reset/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// General login - POST /accounts/auth/login/
export const authLogin = async (data) => {
  return publicFetch("/accounts/auth/login/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Admin reset verify OTP - POST /accounts/auth/password-reset/admin-reset-verify-otp/
export const adminResetVerifyOtp = async (data) => {
  return publicFetch("/accounts/auth/password-reset/admin-reset-verify-otp/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Confirm password reset - POST /accounts/auth/password-reset/confirm/
export const passwordResetConfirm = async (data) => {
  return publicFetch("/accounts/auth/password-reset/confirm/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Request password reset - POST /accounts/auth/password-reset/request/
export const passwordResetRequest = async (data) => {
  return publicFetch("/accounts/auth/password-reset/request/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Verify OTP - POST /accounts/auth/verify-otp/
export const verifyOtp = async (data) => {
  return publicFetch("/accounts/auth/verify-otp/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Change password - POST /accounts/change-password/
export const changePassword = async (data) => {
  return authFetch("/accounts/change-password/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Approve vendor - POST /accounts/{vendor_id}/approve-vendor/
export const approveVendor = async (vendorId, data) => {
  return authFetch(`/accounts/${vendorId}/approve-vendor/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Reject vendor - POST /accounts/{vendor_id}/reject_vendor/
export const rejectVendor = async (vendorId, data) => {
  return authFetch(`/accounts/${vendorId}/reject_vendor/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Customer login - POST /accounts/customer/login/
export const customerLogin = async (data) => {
  return publicFetch("/accounts/customer/login/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Verify OTP for customer - POST /accounts/customer/verify-otp/
export const customerVerifyOtp = async (data) => {
  return publicFetch("/accounts/customer/verify-otp/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Verify OTP for vendor login - POST /accounts/login/verify-otp-vendor/
export const verifyOtpVendor = async (data) => {
  return publicFetch("/accounts/login/verify-otp-vendor/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Vendor login - POST /accounts/vendor/login/
export const vendorLogin = async (data) => {
  return publicFetch("/accounts/vendor/login/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Verify OTP for vendor - POST /accounts/vendor/verify-otp/
export const vendorVerifyOtp = async (data) => {
  return publicFetch("/accounts/vendor/verify-otp/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Resend OTP for vendors - POST /accounts/vendors/resend-otp/
export const vendorsResendOtp = async (data) => {
  return publicFetch("/accounts/vendors/resend-otp/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Admins APIs
// List banners - GET /admins/banners/
export const getBanners = async () => {
  return authFetch("/admins/banners/");
};

// Upload banner - POST /admins/banners/upload/
export const uploadBanner = async (data) => {
  return authFetch("/admins/banners/upload/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// List admins - GET /admins/list/
export const getAdminsList = async () => {
  return authFetch("/admins/list/");
};

// Delete admin - DELETE /admins/{id}/delete/
export const deleteAdmin = async (id) => {
  return authFetch(`/admins/${id}/delete/`, {
    method: "DELETE",
  });
};

// Get admin details - GET /admins/{id}/details/
export const getAdminDetails = async (id) => {
  return authFetch(`/admins/${id}/details/`);
};

// Patch admin - PATCH /admins/{id}/patch/
export const patchAdmin = async (id, data) => {
  return authFetch(`/admins/${id}/patch/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Update admin - PUT /admins/{id}/update/
export const updateAdmin = async (id, data) => {
  return authFetch(`/admins/${id}/update/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Users admins list - GET /users/admins/
export const getUsersAdmins = async () => {
  return authFetch("/users/admins/");
};

// Delete users admin - DELETE /users/admins/{id}/delete/
export const deleteUsersAdmin = async (id) => {
  return authFetch(`/users/admins/${id}/delete/`, {
    method: "DELETE",
  });
};

// Get users admin details - GET /users/admins/{id}/details/
export const getUsersAdminDetails = async (id) => {
  return authFetch(`/users/admins/${id}/details/`);
};

// Update users admin - PUT /users/admins/{id}/patch/
export const updateUsersAdmin = async (id, data) => {
  return authFetch(`/users/admins/${id}/patch/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Patch users admin - PATCH /users/admins/{id}/patch/
export const patchUsersAdmin = async (id, data) => {
  return authFetch(`/users/admins/${id}/patch/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Update users admin - PUT /users/admins/{id}/update/
export const updateUsersAdminPut = async (id, data) => {
  return authFetch(`/users/admins/${id}/update/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Partial update users admin - PATCH /users/admins/{id}/update/
export const updateUsersAdminPatch = async (id, data) => {
  return authFetch(`/users/admins/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Get admin payouts - GET /admins/payouts/
export const getAdminPayouts = async () => {
  return authFetch("/admins/payouts/");
};

// Register admin - POST /admins/register/
export const registerAdmin = async (data) => {
  return authFetch("/admins/register/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Patch admin - PUT /admins/{id}/patch/
export const patchAdminPut = async (id, data) => {
  return authFetch(`/admins/${id}/patch/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Partial update admin - PATCH /admins/{id}/update/
export const updateAdminPatch = async (id, data) => {
  return authFetch(`/admins/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Auth APIs
// Obtain token - POST /auth/token/
export const obtainToken = async (data) => {
  return publicFetch("/auth/token/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Refresh token - POST /auth/token/refresh/
export const refreshToken = async (data) => {
  return publicFetch("/auth/token/refresh/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Carts APIs
// Get cart - GET /carts/{id}/
export const getCart = async (id) => {
  return authFetch(`/carts/${id}/`);
};

// Add to cart - PUT /carts/{id}/add/
export const addToCart = async (id, data) => {
  return authFetch(`/carts/${id}/add/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Add to cart partial - PATCH /carts/{id}/add/
export const addToCartPartial = async (id, data) => {
  return authFetch(`/carts/${id}/add/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Remove from cart - DELETE /carts/{id}/remove/
export const removeFromCart = async (id) => {
  return authFetch(`/carts/${id}/remove/`, {
    method: "DELETE",
  });
};

// Chats APIs
// List chat sessions - GET /chats/chat_sessions/
export const getChatSessions = async () => {
  return authFetch("/chats/chat_sessions/");
};

// Get chat session messages - GET /chats/chat_sessions/{session_id}/messages/
export const getChatSessionMessages = async (sessionId) => {
  return authFetch(`/chats/chat_sessions/${sessionId}/messages/`);
};

// Send SMS - POST /chats/send-sms/
export const sendSms = async (data) => {
  return authFetch("/chats/send-sms/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Send WhatsApp - POST /chats/send-whatsapp/
export const sendWhatsapp = async (data) => {
  return authFetch("/chats/send-whatsapp/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// List sessions - GET /chats/sessions/
export const getSessions = async () => {
  return authFetch("/chats/sessions/");
};

// Create chat session - POST /chats/chat_sessions/
export const createChatSession = async (data) => {
  return authFetch("/chats/chat_sessions/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Partial update chat session - PATCH /chats/chat_sessions/
export const updateChatSessionPartial = async (data) => {
  return authFetch("/chats/chat_sessions/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Create message in session - POST /chats/chat_sessions/{session_id}/messages/
export const createChatMessage = async (sessionId, data) => {
  return authFetch(`/chats/chat_sessions/${sessionId}/messages/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Create session - POST /chats/sessions/
export const createSession = async (data) => {
  return authFetch("/chats/sessions/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Partial update session - PATCH /chats/sessions/
export const updateSessionPartial = async (data) => {
  return authFetch("/chats/sessions/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// ChatsApp APIs
// List conversations - GET /chatsapp/conversations/
export const getConversations = async () => {
  return authFetch("/chatsapp/conversations/");
};

// Create admin-user conversation - POST /chatsapp/conversations/admin-user/
export const createAdminUserConversation = async (data) => {
  return authFetch("/chatsapp/conversations/admin-user/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Create vendor-customer conversation - POST /chatsapp/conversations/vendor-customer/
export const createVendorCustomerConversation = async (data) => {
  return authFetch("/chatsapp/conversations/vendor-customer/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Get conversation messages - GET /chatsapp/conversations/{conversation_id}/messages/
export const getConversationMessages = async (conversationId) => {
  return authFetch(`/chatsapp/conversations/${conversationId}/messages/`);
};

// Create message in conversation - POST /chatsapp/conversations/{conversation_id}/messages/create/
export const createConversationMessage = async (conversationId, data) => {
  return authFetch(
    `/chatsapp/conversations/${conversationId}/messages/create/`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
};

// List responses - GET /chatsapp/list/responses/
export const getResponses = async () => {
  return authFetch("/chatsapp/list/responses/");
};

// Send message admin to customer - POST /chatsapp/messages/admin-to-customer/
export const sendAdminToCustomer = async (data) => {
  return authFetch("/chatsapp/messages/admin-to-customer/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Send message customer to admin - POST /chatsapp/messages/customer-to-admin/
export const sendCustomerToAdmin = async (data) => {
  return authFetch("/chatsapp/messages/customer-to-admin/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Reply to message - POST /chatsapp/messages/reply/
export const replyMessage = async (data) => {
  return authFetch("/chatsapp/messages/reply/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Update message - PUT /chatsapp/messages/{id}/update/
export const updateMessage = async (id, data) => {
  return authFetch(`/chatsapp/messages/${id}/update/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Partial update message - PATCH /chatsapp/messages/{id}/update/
export const updateMessagePartial = async (id, data) => {
  return authFetch(`/chatsapp/messages/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Get message responses - GET /chatsapp/messages/{message_id}/responses/
export const getMessageResponses = async (messageId) => {
  return authFetch(`/chatsapp/messages/${messageId}/responses/`);
};

// Get notifications - GET /chatsapp/notifications/
export const getNotifications = async () => {
  return authFetch("/chatsapp/notifications/");
};

// Mark notification as read - PUT /chatsapp/notifications/{id}/read/
export const markNotificationRead = async (id) => {
  return authFetch(`/chatsapp/notifications/${id}/read/`, {
    method: "PUT",
  });
};

// Partial mark notification as read - PATCH /chatsapp/notifications/{id}/read/
export const markNotificationReadPartial = async (id) => {
  return authFetch(`/chatsapp/notifications/${id}/read/`, {
    method: "PATCH",
  });
};

// Create admin conversation - POST /chatsapp/create-admin-conversation/
export const createAdminConversation = async (data) => {
  return authFetch("/chatsapp/create-admin-conversation/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Receive and reply - POST /chatsapp/messages/receive-and-reply/
export const receiveAndReply = async (data) => {
  return authFetch("/chatsapp/messages/receive-and-reply/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Delete message - DELETE /chatsapp/messages/{id}/delete/
export const deleteMessage = async (id) => {
  return authFetch(`/chatsapp/messages/${id}/delete/`, {
    method: "DELETE",
  });
};

// Customers APIs
// Create currency - POST /customers/currencies/create/
export const createCurrency = async (data) => {
  return authFetch("/customers/currencies/create/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Set currency - POST /customers/currency/
export const setCurrency = async (data) => {
  return authFetch("/customers/currency/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// List customers - GET /customers/list/
export const getCustomersList = async () => {
  return authFetch("/customers/list/");
};

// Register customer - POST /customers/register/
export const registerCustomer = async (data) => {
  return publicFetch("/customers/register/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// List shipping addresses - GET /customers/shipping-address/
export const getShippingAddresses = async () => {
  return authFetch("/customers/shipping-address/");
};

// Create shipping address - POST /customers/shipping-address/
export const createShippingAddress = async (data) => {
  return authFetch("/customers/shipping-address/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// List shipping methods - GET /customers/shipping-methods/
export const getShippingMethods = async () => {
  return authFetch("/customers/shipping-methods/");
};

// Create shipping method - POST /customers/shipping-methods/
export const createShippingMethod = async (data) => {
  return authFetch("/customers/shipping-methods/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Activate customer - POST /customers/{id}/activate/
export const activateCustomer = async (id, data) => {
  return authFetch(`/customers/${id}/activate/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Deactivate customer - POST /customers/{id}/deactivate/
export const deactivateCustomer = async (id, data) => {
  return authFetch(`/customers/${id}/deactivate/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Delete customer - DELETE /customers/{id}/delete/
export const deleteCustomer = async (id) => {
  return authFetch(`/customers/${id}/delete/`, {
    method: "DELETE",
  });
};

// Get customer details - GET /customers/{id}/details/
export const getCustomerDetails = async (id) => {
  return authFetch(`/customers/${id}/details/`);
};

// Disconnect customer - POST /customers/{id}/disconnect/
export const disconnectCustomer = async (id, data) => {
  return authFetch(`/customers/${id}/disconnect/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Patch customer - PUT /customers/{id}/patch/
export const patchCustomer = async (id, data) => {
  return authFetch(`/customers/${id}/patch/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Partial patch customer - PATCH /customers/{id}/patch/
export const patchCustomerPartial = async (id, data) => {
  return authFetch(`/customers/${id}/patch/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Update customer - PUT /customers/{id}/update/
export const updateCustomer = async (id, data) => {
  return authFetch(`/customers/${id}/update/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Partial update customer - PATCH /customers/{id}/update/
export const updateCustomerPartial = async (id, data) => {
  return authFetch(`/customers/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Fulfilments APIs
// List fulfilments - GET /fulfilments/list/
export const getFulfilmentsList = async () => {
  return authFetch("/fulfilments/list/");
};

// Get fulfilment details - GET /fulfilments/{id}/details/
export const getFulfilmentDetails = async (id) => {
  return authFetch(`/fulfilments/${id}/details/`);
};

// Update fulfilment - PUT /fulfilments/{id}/update/
export const updateFulfilment = async (id, data) => {
  return authFetch(`/fulfilments/${id}/update/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Partial update fulfilment - PATCH /fulfilments/{id}/update/
export const updateFulfilmentPartial = async (id, data) => {
  return authFetch(`/fulfilments/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Loan App APIs
// Apply for loan - POST /loan_app/apply/
export const applyForLoan = async (data) => {
  return authFetch("/loan_app/apply/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Make loan payment - POST /loan_app/loan/make-payment/
export const makeLoanPayment = async (data) => {
  return authFetch("/loan_app/loan/make-payment/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Get loan details - GET /loan_app/loan/{id}/
export const getLoanDetails = async (id) => {
  return authFetch(`/loan_app/loan/${id}/`);
};

// Get payment history - GET /loan_app/loan/{loan_id}/payment-history/
export const getLoanPaymentHistory = async (loanId) => {
  return authFetch(`/loan_app/loan/${loanId}/payment-history/`);
};

// Get payment schedule - GET /loan_app/loan/{loan_id}/payment-schedule/
export const getLoanPaymentSchedule = async (loanId) => {
  return authFetch(`/loan_app/loan/${loanId}/payment-schedule/`);
};

// List loans - GET /loan_app/loans/list/
export const getLoansList = async () => {
  return authFetch("/loan_app/loans/list/");
};

// Get user loan status - GET /loan_app/user-loan-status/
export const getUserLoanStatus = async () => {
  return authFetch("/loan_app/user-loan-status/");
};

// Approve loan - POST /loan_app/{loan_id}/approve/
export const approveLoan = async (loanId, data) => {
  return authFetch(`/loan_app/${loanId}/approve/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Reject loan - POST /loan_app/{loan_id}/reject/
export const rejectLoan = async (loanId, data) => {
  return authFetch(`/loan_app/${loanId}/reject/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Notifications APIs
// List all notifications - GET /notifications/all/
export const getAllNotifications = async () => {
  return authFetch("/notifications/all/");
};

// Mark all notifications read - POST /notifications/mark-all-read/
export const markAllNotificationsRead = async (data) => {
  return authFetch("/notifications/mark-all-read/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Get notification preferences - GET /notifications/preferences/
export const getNotificationPreferences = async () => {
  return authFetch("/notifications/preferences/");
};

// Update notification preferences - PUT /notifications/preferences/update/
export const updateNotificationPreferences = async (data) => {
  return authFetch("/notifications/preferences/update/", {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Send order notification - POST /notifications/send-order-notification/{vendor_id}/{customer_id}/{order_id}/
export const sendOrderNotification = async (
  vendorId,
  customerId,
  orderId,
  data
) => {
  return authFetch(
    `/notifications/send-order-notification/${vendorId}/${customerId}/${orderId}/`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
};

// List unread notifications - GET /notifications/unread/
export const getUnreadNotifications = async () => {
  return authFetch("/notifications/unread/");
};

// Delete notification - DELETE /notifications/{notification_id}/delete/
export const deleteNotification = async (notificationId) => {
  return authFetch(`/notifications/${notificationId}/delete/`, {
    method: "DELETE",
  });
};

// Get notification details - GET /notifications/{notification_id}/details/
export const getNotificationDetails = async (notificationId) => {
  return authFetch(`/notifications/${notificationId}/details/`);
};

// Mark notification read - PATCH /notifications/{notification_id}/mark-read/
export const markNotificationReadPatch = async (notificationId) => {
  return authFetch(`/notifications/${notificationId}/mark-read/`, {
    method: "PATCH",
  });
};

// Orders APIs
// List admin payments - GET /orders/admin/payments/
export const getAdminPayments = async () => {
  return authFetch("/orders/admin/payments/");
};

// Confirm warehouse - POST /orders/orders/{order_id}/confirm-warehouse/
export const confirmWarehouse = async (orderId, data) => {
  return authFetch(`/orders/orders/${orderId}/confirm-warehouse/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Mark order sent - POST /orders/orders/{order_id}/mark-sent/
export const markOrderSent = async (orderId, data) => {
  return authFetch(`/orders/orders/${orderId}/mark-sent/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Update order status - PATCH /orders/{order_id}/status/
export const updateOrderStatus = async (orderId, data) => {
  return authFetch(`/orders/${orderId}/status/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Create draft order - POST /orders/create-draft-order/
export const createDraftOrder = async (data) => {
  return authFetch("/orders/create-draft-order/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// List orders - GET /orders/list/
export const getOrdersList = async () => {
  return authFetch("/orders/list/");
};

// Pay order - POST /orders/pay_order/
export const payOrder = async (data) => {
  return authFetch("/orders/pay_order/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Place order - POST /orders/place-order/
export const placeOrder = async (data) => {
  return authFetch("/orders/place-order/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Get order details - GET /orders/{order_id}/
export const getOrderDetails = async (orderId) => {
  return authFetch(`/orders/${orderId}/`);
};

// Payments APIs
// Release payout - POST /payments/admin/payouts/{transaction_id}/release/
export const releasePayout = async (transactionId, data) => {
  return authFetch(`/payments/admin/payouts/${transactionId}/release/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Generate admin reports - GET /payments/admin/reports/generate/
export const generateAdminReports = async () => {
  return authFetch("/payments/admin/reports/generate/");
};

// Pesapal callback - GET /payments/pesapal-callback/
export const pesapalCallback = async () => {
  return authFetch("/payments/pesapal-callback/");
};

// Pesapal redirect - GET /payments/pesapal-redirect/
export const pesapalRedirect = async () => {
  return authFetch("/payments/pesapal-redirect/");
};

// Pesapal IPN - POST /payments/pesapal/ipn/
export const pesapalIpn = async (data) => {
  return authFetch("/payments/pesapal/ipn/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Pesapal topup - POST /payments/pesapal/topup/
export const pesapalTopup = async (data) => {
  return authFetch("/payments/pesapal/topup/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Get transaction status - GET /payments/transaction-status/
export const getTransactionStatus = async () => {
  return authFetch("/payments/transaction-status/");
};

// List transactions - GET /payments/transactions/
export const getTransactions = async () => {
  return authFetch("/payments/transactions/");
};

// Payout for vendor order item - POST /payments/vendors/{vendor_id}/order-items/{order_item_id}/payout/
export const payoutVendorOrderItem = async (vendorId, orderItemId, data) => {
  return authFetch(
    `/payments/vendors/${vendorId}/order-items/${orderItemId}/payout/`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
};

// Products APIs
// Add product - POST /products/add/
export const addProduct = async (data) => {
  return authFetch("/products/add/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Delete product admin - DELETE /products/admin/products/{id}/delete/
export const deleteProductAdmin = async (id) => {
  return authFetch(`/products/admin/products/${id}/delete/`, {
    method: "DELETE",
  });
};

// List products - GET /products/list/
export const getProductsList = async () => {
  return authFetch("/products/list/");
};

// List product listings - GET /products/listing/
export const getProductListings = async () => {
  return authFetch("/products/listing/");
};

// List product reviews - GET /products/reviews/
export const getProductReviews = async () => {
  return authFetch("/products/reviews/");
};

// Create product review - POST /products/reviews/
export const createProductReview = async (data) => {
  return authFetch("/products/reviews/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Get product review - GET /products/reviews/{id}/
export const getProductReview = async (id) => {
  return authFetch(`/products/reviews/${id}/`);
};

// Update product review - PUT /products/reviews/{id}/
export const updateProductReview = async (id, data) => {
  return authFetch(`/products/reviews/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Partial update product review - PATCH /products/reviews/{id}/
export const updateProductReviewPartial = async (id, data) => {
  return authFetch(`/products/reviews/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Delete product review - DELETE /products/reviews/{id}/
export const deleteProductReview = async (id) => {
  return authFetch(`/products/reviews/${id}/`, {
    method: "DELETE",
  });
};

// Reply to product review - POST /products/reviews/{review_id}/reply/
export const replyToProductReview = async (reviewId, data) => {
  return authFetch(`/products/reviews/${reviewId}/reply/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Get product stock - GET /products/stock/
export const getProductStock = async () => {
  return authFetch("/products/stock/");
};

// Delete product - DELETE /products/{id}/delete/
export const deleteProduct = async (id) => {
  return authFetch(`/products/${id}/delete/`, {
    method: "DELETE",
  });
};

// Get product details - GET /products/{id}/details/
export const getProductDetails = async (id) => {
  return authFetch(`/products/${id}/details/`);
};

// Get product edit - GET /products/{id}/edit/
export const getProductEdit = async (id) => {
  return authFetch(`/products/${id}/edit/`);
};

// Update product edit - PUT /products/{id}/edit/
export const updateProductEdit = async (id, data) => {
  return authFetch(`/products/${id}/edit/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Partial update product edit - PATCH /products/{id}/edit/
export const updateProductEditPartial = async (id, data) => {
  return authFetch(`/products/${id}/edit/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Get product presigned URL - GET /products/{product_id}/presigned-url/
export const getProductPresignedUrl = async (productId) => {
  return authFetch(`/products/${productId}/presigned-url/`);
};

// Returns APIs
// Reject return - PATCH /returns/api/returns/{return_id}/reject/
export const rejectReturn = async (returnId, data) => {
  return authFetch(`/returns/api/returns/${returnId}/reject/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Approve return - PATCH /returns/approve/{return_id}/
export const approveReturn = async (returnId, data) => {
  return authFetch(`/returns/approve/${returnId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// List returns - GET /returns/list/
export const getReturnsList = async () => {
  return authFetch("/returns/list/");
};

// Get returns for order item - GET /returns/order-items/{order_item_id}/returns/
export const getOrderItemReturns = async (orderItemId) => {
  return authFetch(`/returns/order-items/${orderItemId}/returns/`);
};

// Create return for order item - POST /returns/order-items/{order_item_id}/returns/
export const createOrderItemReturn = async (orderItemId, data) => {
  return authFetch(`/returns/order-items/${orderItemId}/returns/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Update return for order item - PUT /returns/order-items/{order_item_id}/returns/
export const updateOrderItemReturn = async (orderItemId, data) => {
  return authFetch(`/returns/order-items/${orderItemId}/returns/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Delete return for order item - DELETE /returns/order-items/{order_item_id}/returns/
export const deleteOrderItemReturn = async (orderItemId) => {
  return authFetch(`/returns/order-items/${orderItemId}/returns/`, {
    method: "DELETE",
  });
};

// Get return details - GET /returns/{return_id}/
export const getReturnDetails = async (returnId) => {
  return authFetch(`/returns/${returnId}/`);
};

// Create return - POST /returns/{return_id}/
export const createReturn = async (returnId, data) => {
  return authFetch(`/returns/${returnId}/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Update return - PUT /returns/{return_id}/
export const updateReturn = async (returnId, data) => {
  return authFetch(`/returns/${returnId}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Delete return - DELETE /returns/{return_id}/
export const deleteReturn = async (returnId) => {
  return authFetch(`/returns/${returnId}/`, {
    method: "DELETE",
  });
};

// Request return - POST /returns/request/{order_item_id}/
export const requestReturn = async (orderItemId, data) => {
  return authFetch(`/returns/request/${orderItemId}/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Sales APIs
// Get sales analytics - GET /sales/analytics
export const getSalesAnalytics = async () => {
  return authFetch("/sales/analytics");
};

// Get sales graph - GET /sales/graph
export const getSalesGraph = async () => {
  return authFetch("/sales/graph");
};

// List sales - GET /sales/list
export const getSalesList = async () => {
  return authFetch("/sales/list");
};

// Delete sale - DELETE /sales/{id}/delete
export const deleteSale = async (id) => {
  return authFetch(`/sales/${id}/delete`, {
    method: "DELETE",
  });
};

// Get sale details - GET /sales/{id}/details
export const getSaleDetails = async (id) => {
  return authFetch(`/sales/${id}/details`);
};

// Get sale invoice - GET /sales/{id}/invoice
export const getSaleInvoice = async (id) => {
  return authFetch(`/sales/${id}/invoice`);
};

// Get sale PDF - GET /sales/{id}/pdf/
export const getSalePdf = async (id) => {
  return authFetch(`/sales/${id}/pdf/`);
};

// Update sale - PUT /sales/{id}/update
export const updateSale = async (id, data) => {
  return authFetch(`/sales/${id}/update`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Partial update sale - PATCH /sales/{id}/update
export const updateSalePartial = async (id, data) => {
  return authFetch(`/sales/${id}/update`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Users APIs
// Register admin user - POST /users/admins/register/
export const registerAdminUser = async (data) => {
  return authFetch("/users/admins/register/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Delete bulk users - DELETE /users/delete-bulk/
export const deleteBulkUsers = async (data) => {
  return authFetch("/users/delete-bulk/", {
    method: "DELETE",
    body: JSON.stringify(data),
  });
};

// List users - GET /users/list/
export const getUsersList = async () => {
  return authFetch("/users/list/");
};

// Update user profile - PUT /users/profile/{id}/
export const updateUserProfile = async (id, data) => {
  return authFetch(`/users/profile/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Partial update user profile - PATCH /users/profile/{id}/
export const updateUserProfilePartial = async (id, data) => {
  return authFetch(`/users/profile/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Activate user - POST /users/{id}/activate/
export const activateUser = async (id, data) => {
  return authFetch(`/users/${id}/activate/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Deactivate user - POST /users/{id}/deactivate/
export const deactivateUser = async (id, data) => {
  return authFetch(`/users/${id}/deactivate/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Delete user - DELETE /users/{id}/delete/
export const deleteUser = async (id) => {
  return authFetch(`/users/${id}/delete/`, {
    method: "DELETE",
  });
};

// Get user details - GET /users/{id}/details/
export const getUserDetails = async (id) => {
  return authFetch(`/users/${id}/details/`);
};

// Vendors APIs
// List vendors - GET /vendors/list/
export const getVendorsList = async () => {
  return authFetch("/vendors/list/");
};

// Get vendor notifications - GET /vendors/notifications/
export const getVendorNotifications = async () => {
  return authFetch("/vendors/notifications/");
};

// Get vendor payouts - GET /vendors/payouts/
export const getVendorPayouts = async () => {
  return authFetch("/vendors/payouts/");
};

// Register vendor - POST /vendors/register/
export const registerVendor = async (data) => {
  return publicFetch("/vendors/register/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Restock vendor - POST /vendors/restock/
export const restockVendor = async (data) => {
  return authFetch("/vendors/restock/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Settle vendor sale - POST /vendors/sales/{order_item_id}/settle/
export const settleVendorSale = async (orderItemId, data) => {
  return authFetch(`/vendors/sales/${orderItemId}/settle/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Get vendor stock - GET /vendors/stock/
export const getVendorStock = async () => {
  return authFetch("/vendors/stock/");
};

// Delete vendor - DELETE /vendors/{id}/delete/
export const deleteVendor = async (id) => {
  return authFetch(`/vendors/${id}/delete/`, {
    method: "DELETE",
  });
};

// Get vendor details - GET /vendors/{id}/details/
export const getVendorDetails = async (id) => {
  return authFetch(`/vendors/${id}/details/`);
};

// Patch vendor - PUT /vendors/{id}/patch/
export const patchVendor = async (id, data) => {
  return authFetch(`/vendors/${id}/patch/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Partial patch vendor - PATCH /vendors/{id}/patch/
export const patchVendorPartial = async (id, data) => {
  return authFetch(`/vendors/${id}/patch/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Update vendor - PUT /vendors/{id}/update/
export const updateVendor = async (id, data) => {
  return authFetch(`/vendors/${id}/update/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Partial update vendor - PATCH /vendors/{id}/update/
export const updateVendorPartial = async (id, data) => {
  return authFetch(`/vendors/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Get vendor receipt - GET /vendors/{order_id}/receipt/
export const getVendorReceipt = async (orderId) => {
  return authFetch(`/vendors/${orderId}/receipt/`);
};

// Wallets APIs
// Get customer wallet balance - GET /wallets/balance/customer/
export const getCustomerWalletBalance = async () => {
  return authFetch("/wallets/balance/customer/");
};

// Get vendor wallet balance - GET /wallets/balance/vendor/
export const getVendorWalletBalance = async () => {
  return authFetch("/wallets/balance/vendor/");
};

// Get business wallet balance - POST /wallets/business-wallet/balance/
export const getBusinessWalletBalance = async (data) => {
  return authFetch("/wallets/business-wallet/balance/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Deposit to wallet - POST /wallets/deposit/
export const depositToWallet = async (data) => {
  return authFetch("/wallets/deposit/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Request OTP for wallet - POST /wallets/request-otp/
export const requestWalletOtp = async (data) => {
  return authFetch("/wallets/request-otp/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Reset wallet PIN - PUT /wallets/reset-pin/
export const resetWalletPin = async (data) => {
  return authFetch("/wallets/reset-pin/", {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Partial reset wallet PIN - PATCH /wallets/reset-pin/
export const resetWalletPinPartial = async (data) => {
  return authFetch("/wallets/reset-pin/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Set wallet PIN - PUT /wallets/set-pin/
export const setWalletPin = async (data) => {
  return authFetch("/wallets/set-pin/", {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Partial set wallet PIN - PATCH /wallets/set-pin/
export const setWalletPinPartial = async (data) => {
  return authFetch("/wallets/set-pin/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Transfer from wallet - POST /wallets/transfer/
export const transferFromWallet = async (data) => {
  return authFetch("/wallets/transfer/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Withdraw from wallet - POST /wallets/withdraw/
export const withdrawFromWallet = async (data) => {
  return authFetch("/wallets/withdraw/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Wishlists APIs
// List wishlists - GET /wishlists/list
export const getWishlistsList = async () => {
  return authFetch("/wishlists/list");
};

// Remove product from wishlist - DELETE /wishlists/products/{product_id}/remove
export const removeFromWishlist = async (productId) => {
  return authFetch(`/wishlists/products/${productId}/remove`, {
    method: "DELETE",
  });
};

// Add to wishlist - POST /wishlists/{id}/add
export const addToWishlist = async (id, data) => {
  return authFetch(`/wishlists/${id}/add`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Get wishlist details - GET /wishlists/{id}/details
export const getWishlistDetails = async (id) => {
  return authFetch(`/wishlists/${id}/details`);
};

// Get wishlist products - GET /wishlists/{id}/products
export const getWishlistProducts = async (id) => {
  return authFetch(`/wishlists/${id}/products`);
};

export { API_BASE_URL };