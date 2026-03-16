import { useState, useEffect, useCallback } from 'react';
import { API_URL } from './constants';
import { getStoredToken, authenticate } from './services/auth';
import { fetchPosts } from './services/post';
import './index.css';

export default function PostFeed() {
  const [authToken, setAuthToken] = useState(getStoredToken());
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit] = useState(4);

  const handleAuthentication = useCallback(async () => {
    const token = await authenticate();
    if (token) setAuthToken(token);
  }, []);

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
        console.log(">> Token expired, re-authenticating...");
        handleAuthentication();
      }
    } finally {
      setLoading(false);
    }
  }, [limit, handleAuthentication]);

  useEffect(() => {
    if (!authToken) {
      handleAuthentication();
    } else {
      loadPosts(page, authToken);
    }
  }, [page, authToken, loadPosts, handleAuthentication]);

  useEffect(() => {
    if (!authToken) return;

    const ws = new WebSocket(`${API_URL}/ws?token=${authToken}`);

    ws.onopen = () => console.log(">> Connected to websocket");

    ws.onmessage = (event) => {
      console.log(">> Message from server: ", event.data);
      try {
        const message = JSON.parse(event.data);
        if (message.type === "Post_Created") {
          const newPost = message.payload;
          if (page === 0) {
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

    return () => {
      ws.close();
    };
  }, [page, limit, authToken]);

  const totalPages = Math.ceil(totalPosts / limit);

  if (loading && posts.length === 0) {
    return (
      <div className="app-container">
        <div className="loading-text">Cargando posts...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="feed-wrapper">
        <h1 className="feed-title">Post Application Test</h1>

        <div className="pagination-info">
          Total posts: {totalPosts} | Página {totalPages > 0 ? (page / limit) + 1 : 0} de {totalPages}
        </div>

        <div className="post-list">
          {posts.length === 0 ? (
            <p className="empty-text">No hay posts aún.</p>
          ) : (
            posts.map((post) => (
              <article key={post.id} className="post-card">
                <p className="post-content">{post.content}</p>
                <footer className="post-footer">
                  Post ID: {post.id}
                </footer>
              </article>
            ))
          )}
        </div>

        <div className="pagination-controls">
          <button
            onClick={() => setPage(Math.max(0, page - limit))}
            disabled={page === 0}
            className="pagination-button"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage(page + limit)}
            disabled={(page + limit) >= totalPosts}
            className="pagination-button"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}