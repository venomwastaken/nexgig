import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/home';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignupPage';
import ProfileFormPage from './pages/profileFormPage';
import CreateGig from './pages/CreateGig';
import Layout from './components/Layout';
import RequireAuth from '@/components/RequireAuth';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Auth pages render full-screen via AuthCard, no navbar */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />

                {/* Everything else shares the Navbar/Footer via Layout's <Outlet /> */}
                <Route element={<Layout />}>
                    <Route path="/" element={<Home />} />

                    {/* Requires a signed-in user; redirects to /login otherwise */}
                    <Route
                        path="/onboarding/profile"
                        element={
                            <RequireAuth>
                                <ProfileFormPage />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/gig/create"
                        element={
                            <RequireAuth>
                                <CreateGig />
                            </RequireAuth>
                        }
                    />

                    {/* Catch-all: unmatched routes render this instead of a blank page */}
                    <Route path="*" element={<h1>Page not found</h1>} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

