import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import './textcss.css';

import logoLight from './logo.png';
import logoDark from './logodark.png';
import FindInPageModal from './find';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Icons = {
    profile: "M12 4a4 4 0 0 1 4 4 4 4 0 0 1 -4 4 4 4 0 0 1 4 -4zM12 14c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z",
    logout: "M17 7l-1.41 1.41L18.17 12H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
    sun: "M12 7a5 5 0 100 10 5 5 0 000-10zM2 13h2a1 1 0 100-2H2a1 1 0 100 2zm18 0h2a1 1 0 100-2h-2a1 1 0 100 2zM11 2v2a1 1 0 102 0V2a1 1 0 102 0zm0 18v2a1 1 0 102 0v-2a1 1 0 102 0zM5.99 4.58a1 1 0 10-1.41 1.41l1.41 1.41a1 1 0 101.41-1.41L5.99 4.58zm12.02 12.02a1 1 0 10-1.41 1.41l1.41 1.41a1 1 0 101.41-1.41l-1.41-1.41zM4.58 18.01a1 1 0 101.41 1.41l1.41-1.41a1 1 0 10-1.41-1.41l-1.41 1.41zm12.02-12.02a1 1 0 101.41-1.41l-1.41-1.41a1 1 0 10-1.41 1.41l1.41 1.41z",
    moon: "M12.1 20.9c-.1 0-.2 0-.3 0-5.5-.4-9.8-5.2-9.4-10.7.3-3.8 2.9-7 6.4-8.2.5-.2 1 .1 1.2.5s0 1-.4 1.3c-2.4 1.6-3.5 4.6-2.7 7.4.8 2.8 3.4 4.7 6.3 4.5 1.1-.1 2.1-.4 3-1 .5-.3 1.1-.2 1.4.3s.2 1.1-.3 1.5c-1.6 1.1-3.5 1.7-5.2 1.7z",
    find: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5 1.49-1.49-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
    saved: "M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z",
};

function Navbar() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isFindModalOpen, setIsFindModalOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const [scrolled, setScrolled] = useState(false);
    const [userData, setUserData] = useState({});

    const profileRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const contentToSearchRef = useRef(document.body);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                setIsLoggedIn(true);
                try {
                    const response = await fetch(`${API_BASE_URL}/api/user-profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.fullName && !data.firstName) data.firstName = data.fullName.split(' ')[0];
                        setUserData(data);
                    }
                } catch (err) {
                    const storedUser = localStorage.getItem('userData'); 
                    if (storedUser) setUserData(JSON.parse(storedUser));
                }
            } else {
                setIsLoggedIn(false);
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const showSidebar = () => setSidebarOpen(true);
    const hideSidebar = () => setSidebarOpen(false);
    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData'); 
        setIsLoggedIn(false);
        navigate('/login');
    };

    const handleMenuAction = (item) => {
        if (item.path === '#logout') handleLogout();
        else if (item.path === '##theme') setDarkMode(!darkMode);
        else if (item.path === '##find') setIsFindModalOpen(true);
        setDropdownOpen(false);
    };

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
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                <div className="nav-container">
                    
                    {/* 1. LEFT: Logo */}
                    <div className="nav-section-left">
                        <Link to="/home" className="nav-logo">
                            <img src={darkMode ? logoDark : logoLight} alt="Sympto" />
                        </Link>
                    </div>

                    {/* 2. CENTER: Links (Moved out of the right container) */}
                    <ul className="nav-links">
                        <li><Link to="/home" className={isActive('/home')}>Home</Link></li>
                        <li><Link to="/appointment" className={isActive('/appointment')}>Appointment</Link></li>
                        <li><Link to="/blog" className={isActive('/blog')}>News</Link></li>
                        <li><Link to="/about" className={isActive('/about')}>About</Link></li>
                    </ul>

                    {/* 3. RIGHT: Actions (Profile/Login) */}
                    <div className="nav-actions">
                        {isLoggedIn ? (
                            <div ref={profileRef} className="profile-wrapper">
                                <button 
                                    onClick={toggleDropdown} 
                                    className={`nav-avatar-btn ${dropdownOpen ? 'active' : ''}`}
                                >
                                    <div className="avatar-circle">
                                        {userData?.firstName?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                </button>
                                <div className={`dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
                                    {MENU_ITEMS.map((item) => (
                                        <Link
                                            key={item.name}
                                            to={item.path}
                                            onClick={() => handleMenuAction(item)}
                                            className={`dropdown-item ${item.path === '#logout' ? 'danger' : ''}`}
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor"><path d={item.icon} /></svg>
                                            <span>{item.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Link to="/login" className="login-btn-link">
                                <button className="nav-primary-btn">Sign In</button>
                            </Link>
                        )}
                        <button className="mobile-toggle" onClick={showSidebar}>
                            <svg viewBox="0 -960 960 960" fill="currentColor"><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" /></svg>
                        </button>
                    </div>
                </div>
            </nav>

            <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={hideSidebar}></div>
            <aside className={`mobile-sidebar ${sidebarOpen ? 'active' : ''}`}>
                <div className="sidebar-header">
                    <span className="sidebar-title">Menu</span>
                    <button onClick={hideSidebar} className="close-btn">
                        <svg viewBox="0 -960 960 960" fill="currentColor"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
                    </button>
                </div>
                <ul className="sidebar-links">
                    <li><Link to="/home" onClick={hideSidebar}>Home</Link></li>
                    <li><Link to="/appointment" onClick={hideSidebar}>Appointment</Link></li>
                    <li><Link to="/blog" onClick={hideSidebar}>News</Link></li>
                    <li><Link to="/about" onClick={hideSidebar}>About</Link></li>
                    {!isLoggedIn && (
                        <li className="sidebar-action">
                            <Link to="/login" onClick={hideSidebar} className="nav-primary-btn mobile">Sign In</Link>
                        </li>
                    )}
                </ul>
            </aside>

            <FindInPageModal isOpen={isFindModalOpen} onClose={() => setIsFindModalOpen(false)} targetRef={contentToSearchRef} />
        </>
    );
}

export default Navbar;