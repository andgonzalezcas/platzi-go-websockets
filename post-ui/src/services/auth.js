import { API_URL, TEST_USER, STORAGE_KEYS } from '../constants';

export const getStoredToken = () => localStorage.getItem(STORAGE_KEYS.TOKEN);

export const setStoredToken = (token) => localStorage.setItem(STORAGE_KEYS.TOKEN, token);

export const authenticate = async () => {
  try {
    console.log(">> Attempting automatic authentication...");
    // Try login first
    let response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_USER)
    });

    if (response.status === 401) {
      console.log(">> User not found, attempting signup...");
      await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(TEST_USER)
      });

      response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(TEST_USER)
      });
    }

    if (response.ok) {
      const data = await response.json();
      console.log(">> Authenticated successfully. Token acquired.");
      setStoredToken(data.token);
      return data.token;
    }
  } catch (error) {
    console.error(">> Authentication failed:", error);
  }
  return null;
};
