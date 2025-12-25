import React from 'react';
import './textcss.css';
import logo from './logo.png';
function Nev() {
    function hide() {
    const x = document.querySelector('.size');
    x.style.display = (x.style.display === "none") ? "flex" : "none";
}
    function show() {
    const x = document.querySelector('.size');
    x.style.display = (x.style.display === "flex") ? "none" : "flex";
}

  return (
    <nav>
        <div >
            <img src={logo} alt="logo" ></img>
        </div>
        <ul className="size">
        <li onClick={hide}><a href="#"><svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="24px" fill="#0b0b0bff"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg></a></li>
        <li><a href="#">home</a></li>
        <li><a href="#">blog</a></li>
        <li><a href="#">about</a></li>
        </ul> 
        <ul>
        <li className="hilde-on-mobile"><a href="#">home</a></li>
        <li className="hilde-on-mobile"><a href="#">blog</a></li>
        <li className="hilde-on-mobile"><a href="#">about</a></li>
        <li className="hilde"onClick={show}>
            <a href="#" ><svg xmlns="http://www.w3.org/2000/svg" height="30px"  viewBox="0 -960 960 960" width="24px" fill="#000000ff"><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/></svg></a>
        </li>

        </ul>
    
    </nav>
    );
    
}
export default Nev