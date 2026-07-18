import { useState, FormEvent, ChangeEvent } from "react";
import { ArrowRight } from "lucide-react";
import TextField from "./ui/TextField";
import PasswordField from "./ui/PasswordField";
import Button from "./ui/Button";
import AuthCard from "./ui/AuthCard";

interface SignUpFormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

interface SignUpPageProps {
  onSubmit?: (fullName: string, email: string, password: string) => Promise<void> | void;
  onNavigateToLogin?: () => void;
}

const initialState: SignUpFormState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  agreedToTerms: false,
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function SignUpPage({ onSubmit, onNavigateToLogin }: SignUpPageProps) {
  const [form, setForm] = useState<SignUpFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!form.fullName || !form.email || !form.password || !form.confirmPassword) {
      setError("Fill in every field to create your account.");
      return;
    }
    if (!isValidEmail(form.email)) {
      setError("That email doesn't look right.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password needs to be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (!form.agreedToTerms) {
      setError("Accept the terms to continue.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (onSubmit) {
        await onSubmit(form.fullName, form.email, form.password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create your account. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard>
      <div className="mb-10 text-2xl tracking-tight" style={{ fontFamily: "'Syne', ui-sans-serif, system-ui", fontWeight: 700 }}>
  <span className="text-[#ffffff]">Nex</span>
  <span className="text-[#1b976f]">Gig</span>
</div>

      <h1 className="text-3xl font-semibold tracking-tight text-[#ffffff]" style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui" }}>
        Create your account.
      </h1>
      <p className="mt-2 text-sm text-[#8B8F9B]">
        Post gigs, take gigs, get paid. Free for students.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
        {error && (
          <div role="alert" className="rounded-md border border-[#3A2A2A] bg-[#1F1516] px-3 py-2 text-sm text-[#F2A0A0]">
            {error}
          </div>
        )}

        <TextField
          id="fullName"
          name="fullName"
          type="text"
          label="Full name"
          autoComplete="name"
          value={form.fullName}
          onChange={handleChange}
          placeholder="Joshua Mensah"
        />

        <TextField
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@knust.edu.gh"
        />

        <PasswordField
          id="password"
          name="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          placeholder="At least 8 characters"
        />

        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="Repeat your password"
        />

        <label className="flex items-start gap-2 text-sm text-[#8B8F9B] cursor-pointer select-none">
          <input
            type="checkbox"
            name="agreedToTerms"
            checked={form.agreedToTerms}
            onChange={handleChange}
            className="mt-0.5 h-4 w-4 rounded-sm border-[#2A2E38] bg-transparent accent-[#1b976f]"
          />
          <span>
            I agree to NexGig's{" "}
            <a href="#" className="text-[#1b976f] hover:underline underline-offset-4">terms</a>{" "}
            and{" "}
            <a href="#" className="text-[#1b976f] hover:underline underline-offset-4">privacy policy</a>.
          </span>
        </label>

        <Button type="submit" isLoading={isSubmitting} loadingText="Creating account">
          Create account
          <ArrowRight size={16} />
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-[#8B8F9B]">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="text-[#1b976f] hover:underline underline-offset-4"
        >
          Sign in
        </button>
      </p>
    </AuthCard>
  );
}