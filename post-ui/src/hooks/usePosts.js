import { useState, useEffect, useCallback, useRef } from 'react';
import { API_URL } from '../constants';
import { fetchPosts, createPost as apiCreatePost, updatePost as apiUpdatePost } from '../services/post';

export const usePosts = (authToken, handleAuthentication) => {
  const [posts, setPosts] = useState({}); // { id: post }
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

      const newPostsArr = Array.isArray(data.posts) ? data.posts : [];
      const newPostsObj = {};

      newPostsArr.forEach(post => {
        newPostsObj[post.id] = post;
      });

      setPosts(newPostsObj);
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
        const payload = message.payload;

        if (message.type === "Post_Created") {
          if (pageRef.current === 0) {
            setPosts(prev => ({ [payload.id]: payload, ...prev }));
          }
          setTotalPosts((prev) => prev + 1);
        } else if (message.type === "Post_Updated") {
          setPosts(prev => {
            if (prev[payload.id]) {
              return { ...prev, [payload.id]: { ...payload } };
            }
            return prev;
          });
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
