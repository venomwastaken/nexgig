import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/components/dashboard/AdminDashboard";

type AuthView = "login" | "signup" | "dashboard"|"admin";

export default function App() {

  
  const [view, setView] = useState<AuthView>("dashboard");

  if (view === "signup") {
    return <SignupPage onNavigateToLogin={() => setView("login")} />;
  }

  if (view === "dashboard") {
    return <Dashboard />;
    }

     if (view === "admin") {
    return <AdminDashboard />;
  }

  return <LoginPage onNavigateToSignUp={() => setView("signup")} />;


  



}