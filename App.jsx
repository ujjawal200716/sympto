
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./home.jsx";
import SampleAnalysis from "./sampleanalysis.jsx";
import Advancedanalysis from "./advancedanalysis.jsx";
import Login from "./login.jsx";
import Blog from "./blog.jsx";
import About from "./about.jsx";
import Find from "./find.jsx";
import Contactus from "./contactus.jsx";
import Myprofile from "./myprofile.jsx";
import Appointment from "./appointment.jsx";
import SavedPages from "./saved.jsx";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ✅ FIX: Set the root path (/) to the Home component */}
        <Route path="/" element={<Home />} /> 

        {/* Home Page */}
        <Route path="/home" element={<Home />} />

        {/* Analysis Pages */}
        <Route path="/advancedanalysis" element={<Advancedanalysis />} />
        <Route path="/sampleanalysis" element={<SampleAnalysis />} />

        

        {/* Final Result */}
        <Route path="/login" element={<Login />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/about" element={<About />} />
        <Route path="/contactus" element={<Contactus />} />

        <Route path="/find" element={<Find />} />
        <Route path="/myprofile" element={<Myprofile />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/saved" element={<SavedPages />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;