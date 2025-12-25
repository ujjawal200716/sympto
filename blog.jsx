import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader, Zap, BookOpen, Image as ImageIcon, Sun, Moon } from 'lucide-react';
import "./blogcss.css"; 
import Nev from "./test.jsx";
import Chat from "./chat.jsx";

// 🔒 SECURE: Use Environment Variable
const NEWSDATA_API_KEY = import.meta.env.VITE_NEWSDATA_API_KEY || 'pub_8ca8c194d4764d34b23ba94f545af69d';
const API_BASE_URL = 'https://newsdata.io/api/1/news';

// --- Utility Components ---

function PostCard({ post }) {
  const [imgError, setImgError] = useState(false);

  const handleRedirect = () => {
    if (post.url) {
      window.open(post.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <article 
      className="article-card" 
      onClick={handleRedirect} 
      style={{ cursor: 'pointer' }}
    >
      <div className="article-image-wrapper">
        {post.image && !imgError ? (
          <img
            src={post.image}
            alt={post.title}
            className="article-image"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'var(--accent)', // Uses CSS variable for theme compatibility
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary-light)'
          }}>
            <ImageIcon size={48} />
          </div>
        )}

        {post.source_id && (
          <span className="source-badge">
            {post.source_id}
          </span>
        )}
      </div>
      
      <div className="article-content">
        <span className="category-badge">
          {post.category || 'Medical'}
        </span>
        
        <h3 className="article-title" title={post.title}>
          {post.title}
        </h3>
        
        <p className="article-excerpt">
          {post.description}
        </p>
        
        <div className="article-footer">
          <span>{post.date}</span>
          <button className="read-more-btn">
            Read More <Zap size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

// --- Main Component ---

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 1. Add Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  const observerTarget = useRef(null);
  const nextPageRef = useRef(null);
  const hasMoreRef = useRef(true);
  const isSearchModeRef = useRef(false);

  const fetchNewsData = useCallback(async (query = '', pageCursor = null) => {
    try {
      const params = new URLSearchParams({
        apikey: NEWSDATA_API_KEY,
        language: 'en',
        category: 'health',
        removeduplicate: '1' 
      });

      if (pageCursor) {
        params.append('page', pageCursor);
      }

      if (query) {
        params.append('q', query);
      } 

      const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
      
      if (!response.ok) {
        if (response.status === 401) throw new Error("Invalid API Key");
        if (response.status === 429) throw new Error("Daily API limit reached");
        throw new Error("Failed to fetch news");
      }

      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.results?.message || 'API Error');
      }

      const mappedPosts = (data.results || []).map(article => ({
        id: article.article_id,
        title: article.title,
        excerpt: article.description ? (article.description.substring(0, 150) + '...') : 'No description available.',
        description: article.description, 
        content: article.content,
        category: 'Medical News', 
        author: article.source_id || 'News Source',
        date: article.pubDate ? new Date(article.pubDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent',
        image: article.image_url,
        url: article.link,
        source_id: article.source_id
      }));

      return {
        posts: mappedPosts,
        nextPage: data.nextPage
      };

    } catch (err) {
      console.error('Fetch Error:', err);
      throw err;
    }
  }, []);

  const loadInitialPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    nextPageRef.current = null;
    isSearchModeRef.current = false;

    try {
      const { posts: newPosts, nextPage } = await fetchNewsData(); 
      setPosts(newPosts);
      nextPageRef.current = nextPage;
      hasMoreRef.current = !!nextPage;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchNewsData]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      loadInitialPosts();
      return;
    }

    setLoading(true);
    setError(null);
    setPosts([]);
    nextPageRef.current = null;
    isSearchModeRef.current = true;

    try {
      const { posts: newPosts, nextPage } = await fetchNewsData(searchTerm);
      
      if (newPosts.length === 0) {
        setError(`No medical news found for "${searchTerm}".`);
      }
      
      setPosts(newPosts);
      nextPageRef.current = nextPage;
      hasMoreRef.current = !!nextPage;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (loading || !hasMoreRef.current || !nextPageRef.current) return;
    
    setLoading(true);
    try {
      const query = isSearchModeRef.current ? searchTerm : '';
      const { posts: newPosts, nextPage } = await fetchNewsData(query, nextPageRef.current);
      
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
        return [...prev, ...uniqueNewPosts];
      });

      nextPageRef.current = nextPage;
      hasMoreRef.current = !!nextPage;
    } catch (err) {
      console.error("Error loading more:", err);
    } finally {
      setLoading(false);
    }
  }, [loading, searchTerm, fetchNewsData]);

  useEffect(() => {
    loadInitialPosts();
  }, [loadInitialPosts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loading, loadMore]);

  return (
    // 2. Wrap entire app in the dynamic class for dark mode
    <div className={`app-wrapper ${isDarkMode ? 'dark-theme' : ''}`}>
      
      {/* 3. Floating Toggle Button */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 1000,
          padding: '1rem',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          background: isDarkMode ? '#38bdf8' : '#0f172a',
          color: isDarkMode ? '#0f172a' : '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Toggle Theme"
      >
        {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      {/* Header Section */}
      <header className="header">
        <h1>Medical News Feed</h1>
        <p>Latest clinical updates, research, and medical breakthroughs.</p>
      </header>

      {/* External Components (Inside wrapper so they get dark mode context if they support it) */}
      <div style={{ position: 'relative', zIndex: 50 }}>
        <Nev />
      </div>
      <Chat />

      {/* Floating Search Bar */}
      <div className="search-container">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search medical topics (e.g., cardiology, oncology)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? <Loader className="animate-spin" size={20} /> : 'Search'}
          </button>
        </form>
      </div>

      {/* Main Grid Content */}
      <main className="blog-grid">
        
        {/* Error State */}
        {error && (
          <div className="error-alert" style={{textAlign: 'center', padding: '2rem', color: '#ef4444'}}>
            <Zap size={20} style={{ display: 'inline', marginRight: '8px' }} />
            {error}
          </div>
        )}

        {/* Post Grid */}
        {posts.length > 0 ? (
          <>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {isSearchModeRef.current ? `Results for "${searchTerm}"` : 'Top Medical Stories'}
              </h2>
            </div>

            <div className="grid">
              {posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </>
        ) : (
          /* Empty State */
          !loading && !error && (
            <div className="empty-state">
              <BookOpen size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.3 }} />
              <p style={{ fontSize: '1.2rem', fontWeight: 500 }}>
                No articles found. Try searching for a specific medical term.
              </p>
            </div>
          )
        )}
      </main>

      {/* Infinite Scroll Loader */}
      <div ref={observerTarget} className="loading-container">
        {loading && posts.length > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <Loader className="animate-spin" size={24} />
            Loading more updates...
          </div>
        )}
      </div>
    </div>
  );
}