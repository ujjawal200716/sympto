import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
// Removed Axios since we aren't fetching the image anymore
import './textcss.css'; 

import logoLight from './logo.png';
import logoDark from './logodark.png';
import FindInPageModal from './find';

// Icons configuration
const Icons = {
    dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
    profile: "M12 4a4 4 0 0 1 4 4 4 4 0 0 1 -4 4 4 4 0 0 1 -4 -4 4 4 0 0 1 4 -4zM12 14c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z",
    settings: "M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.2-.15.24-.43.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.09-.75-1.7-.99L15 3h-4L9.49 5.03c-.61.24-1.18.59-1.7.99l-2.49-1c-.23-.08-.5-.01-.61.22l-2 3.46c-.12.21-.08.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.2.15-.24.43-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.09.75 1.7.99L11 21h4l.51-2.03c.61-.24 1.18-.59 1.7-.99l2.49 1c.23.08.5.01.61-.22l2-3.46c.12-.21.08-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z",
    orders: "M16 6h-2v2h-4V6H6l4-4 4 4zm-4-4V2zM2 12c0-5.33 1.95-9.69 5.25-11.5L8.5 2c-2.73 1.5-4.5 4.54-4.5 8 0 3.86 2.65 7.15 6.2 7.82l.8.18v2.05c-2.45-.66-4.38-2.68-5.32-5.11L4 14.5c.34 2.22 1.95 3.96 4.1 4.71l-.15.14c-1.76 1.76-2.58 3.59-2.58 5.65h2.16c0-1.28.37-2.31 1.1-3.04.73-.73 1.77-1.1 3.05-1.1s2.32.37 3.05 1.1c.73.73 1.1 1.77 1.1 3.05h2.16c0-2.06-.82-3.89-2.58-5.65l-.15-.14c2.15-.75 3.76-2.49 4.1-4.71l.53 1.18c-.94 2.43-2.87 4.45-5.32 5.11v-2.05l.8-.18c3.55-.67 6.2-3.96 6.2-7.82 0-3.46-1.77-6.5-4.5-8l1.25-1.5z",
    help: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.44 12.63 13 13.5 13 14h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.83.59-1.34 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z",
    logout: "M17 7l-1.41 1.41L18.17 12H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
    sun: "M12 7a5 5 0 100 10 5 5 0 000-10zM2 13h2a1 1 0 100-2H2a1 1 0 100 2zm18 0h2a1 1 0 100-2h-2a1 1 0 100 2zM11 2v2a1 1 0 102 0V2a1 1 0 102 0zm0 18v2a1 1 0 102 0v-2a1 1 0 102 0zM5.99 4.58a1 1 0 10-1.41 1.41l1.41 1.41a1 1 0 101.41-1.41L5.99 4.58zm12.02 12.02a1 1 0 10-1.41 1.41l1.41 1.41a1 1 0 101.41-1.41l-1.41-1.41zM4.58 18.01a1 1 0 101.41 1.41l1.41-1.41a1 1 0 10-1.41-1.41l-1.41 1.41zm12.02-12.02a1 1 0 101.41-1.41l-1.41-1.41a1 1 0 10-1.41 1.41l1.41 1.41z",
    moon: "M12.1 20.9c-.1 0-.2 0-.3 0-5.5-.4-9.8-5.2-9.4-10.7.3-3.8 2.9-7 6.4-8.2.5-.2 1 .1 1.2.5s0 1-.4 1.3c-2.4 1.6-3.5 4.6-2.7 7.4.8 2.8 3.4 4.7 6.3 4.5 1.1-.1 2.1-.4 3-1 .5-.3 1.1-.2 1.4.3s.2 1.1-.3 1.5c-1.6 1.1-3.5 1.7-5.2 1.7z",
    find: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5 1.49-1.49-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
    saved: "M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z",
};

function Navbar() {
    // State Management
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isFindModalOpen, setIsFindModalOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    // Removed profileImg state
    const [scrolled, setScrolled] = useState(false);

    // Refs & Hooks
    const profileRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const contentToSearchRef = useRef(document.body);

    // Handle Scroll for Glass Effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
        // Removed fetchProfileImage call
    }, []);

    // Dark Mode Toggle
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    // Click Outside Listener for Dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handlers
    const showSidebar = () => setSidebarOpen(true);
    const hideSidebar = () => setSidebarOpen(false);
    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        navigate('/login');
    };

    const handleFindInPage = (e) => {
        e.preventDefault();
        setIsFindModalOpen(true);
        setDropdownOpen(false);
    };

    const toggleTheme = (e) => {
        e.preventDefault();
        setDarkMode(!darkMode);
        setDropdownOpen(false);
    };

    // Profile Menu Items
    const MENU_ITEMS = [
        { name: 'My Profile', path: '/myprofile', icon: Icons.profile },
        { name: darkMode ? 'Light Mode' : 'Dark Mode', path: '##theme', icon: darkMode ? Icons.sun : Icons.moon },
        { name: 'Find in Page', path: '##find', icon: Icons.find },
        { name: 'Saved', path: '/saved', icon: Icons.saved },
        { name: 'Logout', path: '#logout', icon: Icons.logout },
    ];

    const isActive = (path) => location.pathname === path ? 'active-link' : '';

    return (
        <>
            <style>
                {`
                /* Essential CSS to enforce the layout request */
                .navbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    /* Ensure gap is same on left (logo) and right (content) */
                    padding: 15px 4%; 
                    width: 100%;
                    position: fixed;
                    top: 0;
                    z-index: 1000;
                    background: transparent;
                    transition: all 0.3s ease;
                }
                
                .navbar.scrolled {
                    background: ${darkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)'};
                    backdrop-filter: blur(10px);
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }

                .nav-right-container {
                    display: flex;
                    align-items: center;
                    gap: 30px; /* Space between Links and Login/Profile */
                }

                /* Desktop Links Style */
                .nav-links {
                    display: flex;
                    list-style: none;
                    gap: 25px;
                    margin: 0;
                    padding: 0;
                }

                .nav-links a {
                    text-decoration: none;
                    color: inherit;
                    font-weight: 500;
                }
                
                /* Hide desktop links on mobile */
                @media (max-width: 768px) {
                    .nav-links { display: none; }
                }
                `}
            </style>

            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>

                {/* 1. LEFT SECTION: Logo */}
                <div className="nav-left">
                    <p className="nav-logo">
                        <img src={darkMode ? logoDark : logoLight} alt="Sympto Logo" style={{ height: '30px' }} />
                    </p>
                </div>

                {/* 2. RIGHT SECTION: Links + Auth (Grouped together to be on the right) */}
                <div className="nav-right-container">
                    
                    {/* Navigation Links (Moved here from center) */}
                    <ul className="nav-links">
                        <li><Link to="/home" className={isActive('/home')}>Home</Link></li>
                        <li><Link to="/contactus" className={isActive('/contactus')}>Contact us</Link></li>
                        <li><Link to="/appointment" className={isActive('/appointment')}>Appointment</Link></li>
                        <li><Link to="/blog" className={isActive('/blog')}>News</Link></li>
                        <li><Link to="/about" className={isActive('/about')}>About</Link></li>
                    </ul>

                    {/* Profile & Actions */}
                    <div className="nav-actions">
                        {isLoggedIn ? (
                            <div ref={profileRef} className="profile-dropdown-container">
                                {/* REMOVED PROFILE IMAGE: Showing Icon only */}
                                <button 
                                    onClick={toggleDropdown} 
                                    className={`nav-profile-btn ${dropdownOpen ? 'active' : ''}`}
                                    style={{ color: darkMode ? '#fff' : '#000', background: 'transparent', border: '1px solid currentColor', borderRadius: '50%', padding: '5px', width: '35px', height: '35px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} 
                                >
                                    <svg viewBox="0 0 24 24" width="20px" height="20px" fill="currentColor">
                                        <path d={Icons.profile} />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                <div className={`profile-dropdown ${dropdownOpen ? 'active' : ''}`}>
                                    {MENU_ITEMS.map((item) => (
                                        <Link
                                            key={item.name}
                                            to={item.path}
                                            onClick={item.path === '#logout' ? handleLogout : (item.path === '##theme' ? toggleTheme : (item.path === '##find' ? handleFindInPage : null))}
                                            className={`dropdown-item ${item.path === '#logout' ? 'logout-option' : ''}`}
                                        >
                                            <svg width="18px" height="18px" viewBox="0 0 24 24" fill="currentColor"><path d={item.icon} /></svg>
                                            <span>{item.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="auth-element">
                                <Link to="/login">
                                    <button className="nav-btn">Sign In</button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Toggle Button */}
                        <button className="menu-button" onClick={showSidebar} style={{ marginLeft: '10px' }}>
                            <svg viewBox="0 -960 960 960" width="26px" height="26px" fill="currentColor"><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" /></svg>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Sidebar (Drawer) */}
            <div className={`mobile-sidebar ${sidebarOpen ? 'active' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '20px', color: darkMode ? '#fff' : '#000' }}>Menu</span>
                    <button onClick={hideSidebar} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <svg viewBox="0 -960 960 960" height="28px" width="28px" fill={darkMode ? "#fff" : "#1e293b"}><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
                    </button>
                </div>

                <ul>
                    <li><Link to="/home" onClick={hideSidebar}>Home</Link></li>
                    <li><Link to="/contactus" onClick={hideSidebar}>Contact us</Link></li>
                    <li><Link to="/appointment" onClick={hideSidebar}>Appointment</Link></li>
                    <li><Link to="/blog" onClick={hideSidebar}>News</Link></li>
                    <li><Link to="/about" onClick={hideSidebar}>About</Link></li>

                    <li className="auth-element-mobile" style={{ marginTop: '20px', border: 'none' }}>
                        {!isLoggedIn && <Link to="/login" onClick={hideSidebar}><button className="nav-btn" style={{ width: '100%' }}>Sign In</button></Link>}
                    </li>
                </ul>
            </div>

            <FindInPageModal isOpen={isFindModalOpen} onClose={() => setIsFindModalOpen(false)} targetRef={contentToSearchRef} />
        </>
    );
}

export default Navbar;