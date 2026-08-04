import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/home';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignupPage';
import ProfileFormPage from './pages/profileFormPage';
import AccountPage from './pages/AccountPage';
import CreateGig from './pages/CreateGig';
import Layout from './components/Layout';
import RequireAuth from '@/components/RequireAuth';
import { Toaster } from '@/components/ui/sonner';
import Gigs from './pages/Gigs';
import GigView from './pages/GigView';
import Messages from './pages/Messages';
import { ProfileStatusProvider } from '@/hooks/useProfileStatus';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/components/dashboard/AdminDashboard';
import AboutUs from './pages/AboutUs';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';

export default function App() {
    return (
        <BrowserRouter>
            {/* sonner's toast() calls (used across profile/account forms) render
                through this — without it mounted, toasts fire silently. */}
            <Toaster />
            {/* Tracks onboarding completion for signed-in users; Layout reads
                this to gate routes, OnboardingWizard writes to it on finish. */}
            <ProfileStatusProvider>
            <Routes>
                {/* Auth pages render full-screen via AuthCard, no navbar */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />

                {/* Dashboard pages render their own full-screen chrome, no navbar */}
                <Route
                    path="/dashboard"
                    element={
                        <RequireAuth>
                            <Dashboard />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/admin"
                    element={
                        <RequireAuth>
                            <AdminDashboard />
                        </RequireAuth>
                    }
                />

                {/* Everything else shares the Navbar/Footer via Layout's <Outlet /> */}
                <Route element={<Layout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/gigs" element={<Gigs />} />
                    <Route path="/gigs/:id" element={<GigView />} />

                    {/* Static informational pages, public to all visitors */}
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/faq" element={<FAQ />} />

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
                    <Route
                        path="/account"
                        element={
                            <RequireAuth>
                                <AccountPage />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/messages/:conversationId?"
                        element={
                            <RequireAuth>
                                <Messages />
                            </RequireAuth>
                        }
                    />

                    {/* Catch-all: unmatched routes render this instead of a blank page */}
                    <Route path="*" element={<h1>Page not found</h1>} />
                </Route>
            </Routes>
            </ProfileStatusProvider>
        </BrowserRouter>
    );
}
