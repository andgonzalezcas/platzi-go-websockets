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

export const createPost = async (content, token) => {
  if (!token) throw new Error("No auth token provided");

  const response = await fetch(`${API_URL}/api/v1/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({ content })
  });

  if (!response.ok) {
    const error = new Error(response.statusText);
    error.status = response.status;
    throw error;
  }

  return await response.json();
};

export const updatePost = async (id, content, token) => {
  if (!token) throw new Error("No auth token provided");

  const response = await fetch(`${API_URL}/api/v1/posts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({ content })
  });

  if (!response.ok) {
    const error = new Error(response.statusText);
    error.status = response.status;
    throw error;
  }

  return await response.json();
};
