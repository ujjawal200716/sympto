import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader, Zap, BookOpen, Image as ImageIcon, Bookmark } from 'lucide-react'; // Added Bookmark icon
import "./blogcss.css"; 
import Navbar from "./test.jsx"; 
import Chat from "./chat.jsx";

// 🔒 SECURE: Use Environment Variable
const NEWSDATA_API_KEY = import.meta.env.VITE_NEWSDATA_API_KEY || 'pub_8ca8c194d4764d34b23ba94f545af69d';
const API_BASE_URL = 'https://newsdata.io/api/1/news';
// 🔧 FIX: Use environment variable for your backend API
const BACKEND_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// --- Utility Components ---

function PostCard({ post }) {
  const [imgError, setImgError] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // Track save state locally for this card
  const [isSaving, setIsSaving] = useState(false);

  const handleRedirect = () => {
    if (post.url) {
      window.open(post.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRedirect();
    }
  };

  // --- SAVE TO SERVER FUNCTION ---
  const handleSave = async (e) => {
    e.stopPropagation(); // Prevent triggering the card click (redirect)

    // 1. Check for Authentication Token
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Please log in to save articles.");
        return;
    }

    // 2. Prevent saving if already saved
    if (isSaved) {
        alert("This article is already saved.");
        return;
    }

    setIsSaving(true);

    try {
        const response = await fetch(`${BACKEND_API_URL}/api/save-page`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            // 3. Payload adapted for News Data
            body: JSON.stringify({
                title: post.title,
                informationType: 'medical news', // <--- Categorize as news
                pageData: { 
                    type: 'news-article', // Tag to identify layout
                    url: post.url,        // The link to save
                    source: post.source_id,
                    image: post.image,
                    date: post.date,
                    description: post.description
                } 
            })
        });

        const data = await response.json();

        if (response.ok) {
            setIsSaved(true); 
            alert("✅ Article saved to your profile!");
        } else {
            alert(`❌ Error: ${data.message}`);
        }
    } catch (err) {
        console.error("Save Error:", err);
        alert("❌ Failed to connect to server");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <article 
      className="article-card" 
      onClick={handleRedirect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex="0"
      style={{ cursor: 'pointer', position: 'relative' }} // relative for positioning absolute elements if needed
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
            background: 'var(--accent)', 
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
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <span className="category-badge">
            {post.category || 'Medical'}
            </span>
            
            {/* SAVE BUTTON */}
            <button 
                onClick={handleSave}
                disabled={isSaved || isSaving}
                title={isSaved ? "Saved" : "Save for later"}
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: isSaved ? 'default' : 'pointer',
                    color: isSaved ? '#10b981' : '#64748b', // Green if saved, gray otherwise
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'transform 0.2s'
                }}
                className="save-btn" // Optional class for hover effects
            >
                <Bookmark 
                    size={20} 
                    fill={isSaved ? "#10b981" : "none"} // Fill if saved
                    className={isSaving ? "animate-pulse" : ""}
                />
            </button>
        </div>
        
        <h3 className="article-title" title={post.title}>
          {post.title}
        </h3>
        
        <p className="article-excerpt">
          {post.description}
        </p>
        
        <div className="article-footer">
          <span>{post.date}</span>
          <button className="read-more-btn" tabIndex="-1">
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

    const currentTarget = observerTarget.current;
    
    if (currentTarget) {
      observer.observe(currentTarget);
    }
    
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loading, loadMore]);

  return (
    <div className="app-wrapper">
      <header className="header">
        <h1>Medical News Feed</h1>
        <p>Latest clinical updates, research, and medical breakthroughs.</p>
      </header>

      <div style={{ position: 'relative', zIndex: 50 }}>
        <Navbar />
      </div>
      <Chat />

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

      <main className="blog-grid">
        {error && (
          <div className="error-alert" style={{textAlign: 'center', padding: '2rem', color: '#ef4444'}}>
            <Zap size={20} style={{ display: 'inline', marginRight: '8px' }} />
            {error}
          </div>
        )}

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