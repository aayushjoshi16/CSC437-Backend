import React, { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./LoginPage.css";

interface LoginPageProps {
  isRegistering?: boolean;
  onAuthToken?: (token: string) => void;
}

export function LoginPage({
  isRegistering = false,
  onAuthToken,
}: LoginPageProps) {
  const usernameInputId = React.useId();
  const passwordInputId = React.useId();
  const navigate = useNavigate();

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // useEffect to reset state variables when url changes
  useEffect(() => {
    setError(null);
    setSuccess(null);
    setIsPending(false);
  }, [isRegistering]);

  // Helper function to handle authentication
  const handleAuthentication = async (username: string, password: string) => {
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    const endpoint = isRegistering ? "/auth/register" : "/auth/login";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || `Failed with status: ${response.status}`);
        return false;
      } else {
        return data;
      }
    } catch (err) {
      console.error("Error during authentication:", err);
      setError("An unexpected error occurred. Please try again.");
      return false;
    }
  };

  // Handle registration success
  const handleRegisterSuccess = (data: any) => {
    console.log("Successfully created account");
    setSuccess("Account created successfully");

    // Get token from successful registration
    const token = data.token;
    console.log("Registration token:", token);

    // Pass token to parent component
    if (onAuthToken) {
      onAuthToken(token);
    }

    // Redirect to homepage
    navigate("/");
  };

  // Handle login success
  const handleLoginSuccess = (data: any) => {
    const token = data.token;
    console.log("Authentication token:", token);
    setSuccess("Login successful");

    // Pass token to parent component
    if (onAuthToken) {
      onAuthToken(token);
    }

    // Redirect to homepage
    navigate("/");
  };

  // Main form submission handler
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsPending(true);

    try {
      const formData = new FormData(e.currentTarget);
      const username = formData.get("username") as string;
      const password = formData.get("password") as string;

      const result = await handleAuthentication(username, password);

      if (result) {
        if (isRegistering) {
          handleRegisterSuccess(result);
        } else {
          handleLoginSuccess(result);
        }
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div>
      <h2>{isRegistering ? "Register a new account" : "Login"}</h2>
      <form className="LoginPage-form" onSubmit={handleSubmit}>
        <label htmlFor={usernameInputId}>Username</label>
        <input
          id={usernameInputId}
          name="username"
          required
          disabled={isPending}
        />

        <label htmlFor={passwordInputId}>Password</label>
        <input
          id={passwordInputId}
          name="password"
          type="password"
          required
          disabled={isPending}
        />

        <input
          type="submit"
          value={isPending ? "Processing..." : "Submit"}
          disabled={isPending}
        />

        {error && (
          <div
            className="error-message"
            aria-live="polite"
            style={{ color: "red", marginTop: "1em" }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="success-message"
            aria-live="polite"
            style={{ color: "green", marginTop: "1em" }}
          >
            {success}
          </div>
        )}
      </form>

      {isRegistering ? (
        <p>
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      ) : (
        <p>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      )}
    </div>
  );
}
