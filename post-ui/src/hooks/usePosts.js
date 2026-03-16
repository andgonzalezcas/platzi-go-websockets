import { useState, useEffect, useCallback, useRef } from 'react';
import { API_URL } from '../constants';
import { fetchPosts, createPost as apiCreatePost, updatePost as apiUpdatePost } from '../services/post';

export const usePosts = (authToken, handleAuthentication) => {
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pageRef = useRef(page);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const loadPosts = useCallback(async (currentPage, token) => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await fetchPosts(currentPage, limit, token);
      setPosts(Array.isArray(data.posts) ? data.posts : []);
      setTotalPosts(data.count || 0);
    } catch (error) {
      console.error("Error fetching posts:", error);
      if (error.status === 401) {
        handleAuthentication();
      }
    } finally {
      setLoading(false);
    }
  }, [limit, handleAuthentication]);

  const createPost = async (content) => {
    if (!content.trim() || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await apiCreatePost(content, authToken);
      return true;
    } catch (error) {
      console.error("Error creating post:", error);
      if (error.status === 401) handleAuthentication();
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePost = async (id, content) => {
    if (!content.trim()) return;
    try {
      await apiUpdatePost(id, content, authToken);
      setPosts(prev => prev.map(p => p.id === id ? { ...p, content } : p));
      return true;
    } catch (error) {
      console.error("Error updating post:", error);
      if (error.status === 401) handleAuthentication();
      throw error;
    }
  };

  useEffect(() => {
    if (authToken) {
      loadPosts(page, authToken);
    }
  }, [page, authToken, loadPosts]);

  useEffect(() => {
    if (!authToken) return;

    const ws = new WebSocket(`${API_URL}/ws?token=${authToken}`);

    ws.onopen = () => console.log(">> Connected to websocket");

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "Post_Created") {
          const newPost = message.payload;
          if (pageRef.current === 0) {
            setPosts((prevPosts) => [newPost, ...prevPosts].slice(0, limit));
          }
          setTotalPosts((prev) => prev + 1);
        }
      } catch (error) {
        console.error("Error parsing websocket message:", error);
      }
    };

    ws.onerror = (error) => console.error(">> WS Error: ", error);
    ws.onclose = () => console.log(">> Disconnected from websocket");

    return () => ws.close();
  }, [authToken, limit]);

  return {
    posts,
    totalPosts,
    loading,
    page,
    setPage,
    limit,
    isSubmitting,
    createPost,
    updatePost
  };
};
