import { useState, useEffect } from 'react';
import './index.css';

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzQU42aUxOdHpxRlRyYmRMdnZjcmxXNnM0TjkiLCJleHAiOjE3NzM3MDkzODV9.lAQ17faTepubxK6TvDzbkCl-rhsOIdFcXamyhGvWufM";
const API_URL = "http://localhost:5050";

export default function PostFeed() {
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit] = useState(4);

  const fetchInitialPosts = async (currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: currentPage, limit: limit });
      const response = await fetch(`${API_URL}/posts?${params}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": TOKEN
        }
      });
      const data = await response.json();
      setPosts(Array.isArray(data.posts) ? data.posts : []);
      setTotalPosts(data.count || 0);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialPosts(page);
  }, [page, limit]);

  useEffect(() => {
    const ws = new WebSocket(`${API_URL}/ws`);

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
  }, [page, limit]);

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