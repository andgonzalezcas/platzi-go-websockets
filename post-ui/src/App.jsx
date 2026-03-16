import { useState, useEffect, useCallback, useRef } from 'react';
import { getStoredToken, authenticate } from './services/auth';
import { usePosts } from './hooks/usePosts';
import './index.css';

export default function PostFeed() {
  const [authToken, setAuthToken] = useState(getStoredToken());

  // Custom hook for all post-related logic
  const handleAuthentication = useCallback(async () => {
    const token = await authenticate();
    if (token) setAuthToken(token);
  }, []);

  const {
    posts,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    createPost,
    updatePost,
    isSubmitting
  } = usePosts(authToken, handleAuthentication);

  const observer = useRef();
  const lastPostElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, loadMore]);

  // Interaction states still managed locally as they are UI-only
  const [newPostContent, setNewPostContent] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (!authToken) {
      handleAuthentication();
    }
  }, [authToken, handleAuthentication]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (await createPost(newPostContent)) {
      setNewPostContent("");
    }
  };

  const handleStartEdit = (post) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditContent("");
  };

  const handleUpdateSave = async (id) => {
    if (await updatePost(id, editContent)) {
      setEditingPostId(null);
      setEditContent("");
    }
  };

  const sortedPosts = Object.values(posts).sort((a, b) => b.id - a.id);

  if (loading && sortedPosts.length === 0) {
    return (
      <div className="app-container">
        <div className="loading-text">Cargando posts...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="feed-wrapper">
        <header className="feed-header">
          <h1 className="feed-title">Go Websockets Feed</h1>
        </header>

        <section className="create-post-section">
          <form onSubmit={handleCreatePost} className="create-post-form">
            <textarea
              placeholder="¿Qué estás pensando?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="create-post-textarea"
              required
            />
            <button type="submit" disabled={isSubmitting} className="submit-post-button">
              {isSubmitting ? "Enviando..." : "Publicar"}
            </button>
          </form>
        </section>

        <section className="post-list">
          {sortedPosts.length === 0 ? (
            <p className="empty-text">No hay posts aún.</p>
          ) : (
            sortedPosts.map((post, index) => (
              <article
                key={post.id}
                className={`post-card ${editingPostId === post.id ? 'is-editing' : ''}`}
                ref={index === sortedPosts.length - 1 ? lastPostElementRef : null}
              >
                {editingPostId === post.id ? (
                  <div className="edit-mode">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="edit-textarea"
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button onClick={() => handleUpdateSave(post.id)} className="save-button">Guardar</button>
                      <button onClick={handleCancelEdit} className="cancel-button">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="post-content">{post.content}</p>
                    <footer className="post-footer">
                      <span className="post-id">Post ID: {post.id}</span>
                      <button onClick={() => handleStartEdit(post)} className="edit-button" title="Editar post">
                        ✎
                      </button>
                    </footer>
                  </>
                )}
              </article>
            ))
          )}
        </section>

        <div className="scroll-status">
          {loadingMore && <div className="loading-more">Cargando más posts...</div>}
          {!hasMore && sortedPosts.length > 0 && <div className="end-of-list">No hay más posts para mostrar.</div>}
        </div>
      </div>
    </div>
  );
}