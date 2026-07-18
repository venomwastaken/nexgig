import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

type AuthView = "login" | "signup";

export default function App() {
  const [view, setView] = useState<AuthView>("login");

  if (view === "signup") {
    return <SignupPage onNavigateToLogin={() => setView("login")} />;
  }

  return <LoginPage onNavigateToSignUp={() => setView("signup")} />;
}