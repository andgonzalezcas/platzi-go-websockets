import { API_URL } from '../constants';

export const fetchPosts = async (page, limit, token) => {
  if (!token) throw new Error("No auth token provided");

  const params = new URLSearchParams({ page, limit });
  const response = await fetch(`${API_URL}/posts?${params}`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    }
  });

  if (!response.ok) {
    const error = new Error(response.statusText);
    error.status = response.status;
    throw error;
  }

  return await response.json();
};
