// File: src/FindInPageModal.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './findcss.css'; // Ensure this CSS file exists

/**
 * Custom Hook for Drag functionality
 */
const useDrag = (modalRef, initialPosition = { x: 50, y: 50 }) => {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const offset = useRef({ x: 0, y: 0 });

    const handleMouseDown = useCallback((e) => {
        const modal = modalRef.current;
        if (!modal) return;
        
        // Ensure dragging only starts on the modal background/content, not controls
        if (e.target.closest('.find-modal-content') === modal && !e.target.closest('button')) {
            setIsDragging(true);
            
            offset.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            };
        }
    }, [position, modalRef]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        
        const newX = e.clientX - offset.current.x;
        const newY = e.clientY - offset.current.y;
        
        setPosition({ x: newX, y: newY });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return { position, handleMouseDown };
};


const FindInPageModal = ({ isOpen, onClose, targetRef }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [matchCount, setMatchCount] = useState(0);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
    
    const inputRef = useRef(null);
    const modalContentRef = useRef(null);
    
    // Custom hook for drag functionality
    const { position, handleMouseDown } = useDrag(modalContentRef, { x: 50, y: 50 });

    // --- Search & Highlight Logic ---

    // Ensure targetRef is in dependencies for all highlight functions
    const removeHighlights = useCallback((refObject) => {
        const rootElement = refObject.current || document.body;
        if (!rootElement || typeof rootElement.querySelectorAll !== 'function') return; 
        
        const highlightedElements = rootElement.querySelectorAll('span.highlight-find');
        
        highlightedElements.forEach(span => {
            const parent = span.parentNode;
            
            if (parent) {
                // Unwraps the text from the span
                while (span.firstChild) {
                    parent.insertBefore(span.firstChild, span);
                }
                parent.removeChild(span);
            }
        });
        // Normalizing merges adjacent text nodes back together
        rootElement.normalize();
    }, []); // targetRef is implicitly handled via refObject argument

    const applyHighlights = useCallback((refObject, term) => {
        const rootElement = refObject.current || document.body;
        
        if (!rootElement || !term || typeof rootElement.querySelectorAll !== 'function') return 0;
        
        // 1. Always clear previous highlights first
        removeHighlights(refObject);

        const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(escapedTerm, 'gi'); 
        let count = 0;
        
        const walker = document.createTreeWalker(
            rootElement,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node = walker.nextNode();
        while (node) {
            // Check if the node is in a searchable area (not script/style, not inside the modal)
            if (node.parentNode && 
                node.parentNode.tagName !== 'SCRIPT' && 
                node.parentNode.tagName !== 'STYLE' && 
                !node.parentNode.closest('.find-modal-content')
            ) {
                let match;
                const text = node.nodeValue;
                const fragments = [];
                let lastIndex = 0;

                // Use the regex stateful search
                while ((match = regex.exec(text)) !== null) {
                    count++;
                    
                    // 1. Text before the match
                    if (match.index > lastIndex) {
                        fragments.push(document.createTextNode(text.substring(lastIndex, match.index)));
                    }
                    
                    // 2. Highlighted span for the match
                    const span = document.createElement('span');
                    span.className = 'highlight-find';
                    span.textContent = match[0];
                    fragments.push(span);
                    
                    lastIndex = regex.lastIndex;
                }

                // 3. Remaining text after the last match
                if (lastIndex < text.length) {
                    fragments.push(document.createTextNode(text.substring(lastIndex)));
                }

                // Replace the text node with the fragments
                if (fragments.length > 0 && fragments.length !== 1) { // fragments.length !== 1 means a match was found
                    const parent = node.parentNode;
                    fragments.forEach(frag => parent.insertBefore(frag, node));
                    
                    // CRITICAL FIX: The TreeWalker must be manually moved past the inserted nodes.
                    // We set it to the last inserted fragment, so the next walker.nextNode() 
                    // correctly moves to the text after this block.
                    walker.currentNode = fragments[fragments.length - 1]; 
                    
                    parent.removeChild(node);
                }
            }
            node = walker.nextNode();
        }
        
        return count;
    }, [removeHighlights]);

    const scrollToMatch = useCallback((index, refObject) => {
        const rootElement = refObject.current || document.body;
        if (index === -1 || !rootElement) return;

        const highlights = rootElement.querySelectorAll('span.highlight-find');
        
        if (highlights.length > index) {
            highlights.forEach(el => el.classList.remove('active-highlight'));
            
            const currentHighlight = highlights[index];
            currentHighlight.classList.add('active-highlight');
            
            currentHighlight.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
    }, []);
    
    // --- Effects & Handlers ---
    
    // Ensure cleanup of highlights on close and during unmount
    useEffect(() => {
        if (isOpen) {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        } else {
            removeHighlights(targetRef); 
            setSearchTerm('');
            setMatchCount(0);
            setCurrentMatchIndex(-1);
        }

        return () => {
            removeHighlights(targetRef);
        };
    }, [isOpen, targetRef, removeHighlights]);

    // Highlight effect: Runs on searchTerm change
    useEffect(() => {
        if (isOpen && searchTerm.length > 0) {
            const newCount = applyHighlights(targetRef, searchTerm);
            setMatchCount(newCount);
            // Reset to the first match if found, otherwise -1
            setCurrentMatchIndex(newCount > 0 ? 0 : -1);
            
        } else if (isOpen && searchTerm.length === 0) {
            removeHighlights(targetRef);
            setMatchCount(0);
            setCurrentMatchIndex(-1);
        }
    }, [searchTerm, isOpen, targetRef, applyHighlights, removeHighlights]);

    // Effect to scroll to the current match when index changes
    useEffect(() => {
        if (isOpen && currentMatchIndex !== -1 && matchCount > 0) {
            scrollToMatch(currentMatchIndex, targetRef);
        }
    }, [currentMatchIndex, isOpen, matchCount, targetRef, scrollToMatch]);

    // Navigation Handlers (Next/Previous)
    const goToNext = () => {
        if (matchCount > 0) {
            setCurrentMatchIndex(prevIndex => (prevIndex + 1) % matchCount);
        }
    };

    const goToPrevious = () => {
        if (matchCount > 0) {
            setCurrentMatchIndex(prevIndex => (prevIndex - 1 + matchCount) % matchCount);
        }
    };
    
    // Keyboard shortcut handler
    const handleKeyDown = useCallback((event) => {
        if (event.key === 'Escape') {
            onClose();
        } else if (event.key === 'Enter') {
            event.preventDefault(); 
            if (searchTerm.length > 0 && matchCount > 0) {
                goToNext();
            }
        }
    }, [onClose, searchTerm.length, matchCount]); 

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        } else {
            document.removeEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleKeyDown]);


    if (!isOpen) {
        return null;
    }

    const matchDisplay = searchTerm.length > 0 && matchCount > 0
        ? `${currentMatchIndex + 1} of ${matchCount}`
        : (searchTerm.length > 0 && matchCount === 0 ? '0 of 0' : '');

    return (
        <div 
            ref={modalContentRef}
            className="find-modal-content draggable"
            style={{ 
                left: `${position.x}px`, 
                top: `${position.y}px`,
                cursor: 'grab'
            }}
            onMouseDown={handleMouseDown}
        >
            
            {/* Search Input */}
            <input
                ref={inputRef}
                type="text"
                placeholder="Find in page..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="find-input"
                onKeyDown={handleKeyDown} 
                onMouseDown={(e) => e.stopPropagation()} 
            />

            {/* Status/Navigation Controls */}
            <div className="find-controls">
                
                {/* Match Count Display */}
                <span className={`match-count ${matchCount === 0 && searchTerm.length > 0 ? 'no-match' : ''}`}>
                    {matchDisplay}
                </span>

                {/* Previous Button */}
                <button 
                    onClick={goToPrevious} 
                    disabled={matchCount <= 1 || searchTerm.length === 0} 
                    className="nav-btn"
                    onMouseDown={(e) => e.stopPropagation()} // Prevent drag on button click
                >
                    <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px"><path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
                </button>

                {/* Next Button */}
                <button 
                    onClick={goToNext} 
                    disabled={matchCount <= 1 || searchTerm.length === 0} 
                    className="nav-btn"
                    onMouseDown={(e) => e.stopPropagation()} // Prevent drag on button click
                >
                    <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>
                </button>

                {/* Close Button */}
                <button onClick={onClose} className="close-btn" aria-label="Close Find in Page" onMouseDown={(e) => e.stopPropagation()}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>
        </div>
    );
};

export default FindInPageModal;