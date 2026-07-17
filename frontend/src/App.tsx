import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './pages/login';
import Home from './pages/home';
import Signup from './pages/signup';
import ProfileFormPage from './pages/profileFormPage';

export default function App() {
  return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login/>} />
                <Route path="/signup" element={<Signup/>} />
                <Route path="/" element={<Home />} />
                <Route path="/onboarding/profile" element={<ProfileFormPage />} />
            </Routes>
        </BrowserRouter>
);
}
