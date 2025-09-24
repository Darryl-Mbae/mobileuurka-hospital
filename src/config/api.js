const SERVER = import.meta.env.VITE_SERVER_URL;
const token = localStorage.getItem("access_token");


/**
 * Core fetch with automatic token & auth handling
 */
export const fetchWithAuth = async (url, options = {}) => {

  const defaultOptions = {
    credentials: "include", // send cookies too
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  // Merge options (custom headers will override defaults if provided)
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, mergedOptions);

  // Handle expired/invalid token
  if (response.status === 401) {
    // localStorage.removeItem("access_token");
    window.location.href = "/auth";
    throw new Error("Authentication expired. Please login again.");
  }

  return response;
};

/**
 * GET
 */
export const apiGet = async (endpoint) => {
  const response = await fetchWithAuth(`${SERVER}${endpoint}`, { method: "GET" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || "Request failed");
  return data;
};

/**
 * POST
 */
export const apiPost = async (endpoint, body = {}) => {
  const response = await fetchWithAuth(`${SERVER}${endpoint}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || "Request failed");
  return data;
};

/**
 * PUT
 */
export const apiPut = async (endpoint, body = {}) => {
  const response = await fetchWithAuth(`${SERVER}${endpoint}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || "Request failed");
  return data;
};

/**
 * DELETE
 */
export const apiDelete = async (endpoint) => {
  const response = await fetchWithAuth(`${SERVER}${endpoint}`, { method: "DELETE" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || "Request failed");
  return data;
};

/**
 * Current user
 */
export const fetchCurrentUser = () => apiGet("/users");

/**
 * Auth helpers
 */
export const isAuthenticated = () => !!localStorage.getItem("access_token");

export const logout = async () => {
  try {
    await fetchWithAuth(`${SERVER}/auth/logout`, { method: "POST" });
  } catch (err) {
    console.error("Logout error:", err);
  } finally {
    localStorage.removeItem("access_token");
    window.location.href = "/auth";
  }
};

export const refreshToken = async () => {
  try {
    const response = await fetch(`${SERVER}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }), // Add token header if available
        // ...options.headers,
      },    });
    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        localStorage.setItem("access_token", data.token);
        return data.token;
      }
    }
    return null;
  } catch (err) {
    console.error("Token refresh error:", err);
    return null;
  }
};
