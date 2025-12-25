import React, { useState } from 'react';
import './contactuscss.css';

const ContactUs = () => {
  const [contactData, setContactData] = useState({ name: '', email: '', message: '' });
  
  // Mock Reviews - Matching the style of your uploaded image
  const [reviews, setReviews] = useState([
    { id: 1, name: "Sarah Jenkins", role: "Product Manager", text: "The support team was incredibly helpful. The design is intuitive and exactly what we needed.", stars: 5 },
    { id: 2, name: "David Chen", role: "Freelancer", text: "I love the clean aesthetic. Highly recommended!", stars: 5 },
    { id: 3, name: "Emily Roberts", role: "CEO, TechFlow", text: "Fast, reliable, and beautiful. A perfect experience from start to finish.", stars: 4 }
  ]);

  const [newReview, setNewReview] = useState({ name: '', role: 'Visitor', text: '', stars: 0 });

  // --- Handlers ---
  const handleContactChange = (e) => setContactData({ ...contactData, [e.target.name]: e.target.value });
  
  const handleContactSubmit = (e) => { 
    e.preventDefault(); 
    alert("Message Sent!"); 
  };

  const handleReviewChange = (e) => setNewReview({ ...newReview, [e.target.name]: e.target.value });
  const handleStarClick = (rating) => setNewReview({ ...newReview, stars: rating });
  
  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (newReview.stars === 0) { alert("Please click a star to rate!"); return; }
    
    const reviewToAdd = { id: Date.now(), ...newReview };
    setReviews([reviewToAdd, ...reviews]);
    setNewReview({ name: '', role: 'Visitor', text: '', stars: 0 });
  };

  return (
    // Top level container prevents global style leaks
    <div className="contact-container">
      
      {/* --- Full Size Hero Section --- */}
      <div className="contact-hero-full">
        <div className="hero-content-centered">
          <div className="hero-text">
            <h1>Let's Chat</h1>
            <p>Tell us about your project or just say hello.</p>
          </div>

          <div className="contact-card-wide">
            <form onSubmit={handleContactSubmit} className="contact-form-grid">
              <div className="form-input-group">
                <label>Your Name</label>
                <input type="text" name="name" placeholder="John Doe" value={contactData.name} onChange={handleContactChange} required />
              </div>
              <div className="form-input-group">
                <label>Email Address</label>
                <input type="email" name="email" placeholder="john@example.com" value={contactData.email} onChange={handleContactChange} required />
              </div>
              <div className="form-input-group full-width">
                <label>Message</label>
                <textarea name="message" rows="1" placeholder="How can we help?" value={contactData.message} onChange={handleContactChange} required></textarea>
              </div>
              <div className="form-submit-wrapper">
                <button type="submit" className="hero-submit-btn">Send Message</button>
              </div>
            </form>
            
            {/* Contact Info Footer inside the card */}
            <div className="contact-details-bar">
               <span>📍 123 Blue Avenue</span>
               <span>📞 +1 (555) 123-4567</span>
               <span>✉️ support@example.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Reviews Section --- */}
      <div className="reviews-section-full">
        <div className="reviews-wrapper">
          
          {/* Write Review Area */}
          <div className="write-review-area">
             <h3>Leave a Review</h3>
             <form onSubmit={handleReviewSubmit} className="write-review-form">
                <div className="rating-select">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= newReview.stars ? "star-icon filled" : "star-icon"} onClick={() => handleStarClick(star)}>★</span>
                  ))}
                </div>
                <div className="inputs-row">
                  <input type="text" name="name" placeholder="Your Name" value={newReview.name} onChange={handleReviewChange} required />
                  <input type="text" name="text" placeholder="Share your experience..." value={newReview.text} onChange={handleReviewChange} required />
                  <button type="submit">Post</button>
                </div>
             </form>
          </div>

          {/* Review List - Styled like Image 1 */}
          <div className="reviews-list-grid">
            {reviews.map((review) => (
              <div key={review.id} className="clean-review-card">
                
                {/* 1. Quote Text */}
                <p className="card-quote">"{review.text}"</p>
                
                {/* 2. Stars (Small) */}
                <div className="card-stars">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ color: i < review.stars ? '#fbbf24' : '#e2e8f0' }}>★</span>
                  ))}
                </div>

                {/* 3. Author Section */}
                <div className="card-author">
                  <div className="avatar-circle">
                    {review.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="author-details">
                    <span className="author-name">{review.name}</span>
                    <span className="author-role">{review.role}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
};

export default ContactUs;