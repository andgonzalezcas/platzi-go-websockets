import { useState, useEffect, useCallback } from 'react';
import { API_URL, INITIAL_LIMIT, SCROLL_LIMIT } from '../constants';
import { fetchPosts, createPost as apiCreatePost, updatePost as apiUpdatePost } from '../services/post';

export const usePosts = (authToken, handleAuthentication) => {
  const [posts, setPosts] = useState({});
  const [totalPosts, setTotalPosts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPosts = useCallback(async (currentOffset, limit, isInitial = false) => {
    if (!authToken) return;
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const data = await fetchPosts(currentOffset, limit, authToken);
      const newPostsArr = Array.isArray(data.posts) ? data.posts : [];

      setPosts(prev => {
        const newPostsObj = isInitial ? {} : { ...prev };
        newPostsArr.forEach(post => {
          newPostsObj[post.id] = post;
        });
        return newPostsObj;
      });

      const totalCount = data.count || 0;
      setTotalPosts(totalCount);

      if (newPostsArr.length < limit || (currentOffset + newPostsArr.length) >= totalCount) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      if (error.status === 401) handleAuthentication();
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [authToken, handleAuthentication]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;

    const currentCount = Object.keys(posts).length;
    loadPosts(currentCount, SCROLL_LIMIT);
  }, [loadingMore, hasMore, posts, loadPosts]);

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
      loadPosts(0, INITIAL_LIMIT, true);
    }
  }, [authToken, loadPosts]);

  useEffect(() => {
    if (!authToken) return;

    const ws = new WebSocket(`${API_URL}/ws?token=${authToken}`);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const payload = message.payload;

        if (message.type === "Post_Created") {
          setPosts(prev => ({ [payload.id]: { ...payload }, ...prev }));
          setTotalPosts(prev => prev + 1);
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

    return () => ws.close();
  }, [authToken]);

  return {
    posts,
    totalPosts,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    createPost,
    updatePost,
    isSubmitting
  };
};
