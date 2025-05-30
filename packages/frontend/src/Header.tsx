import { Link } from "react-router-dom";
import "./Header.css";

export function Header() {
  return (
    <header>
      <h1>My cool image site</h1>
      <div>
        <label>
          Some switch (dark mode?) <input type="checkbox" />
        </label>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/upload">Upload</Link>
          <Link to="/login">Log in</Link>
        </nav>
      </div>
    </header>
  );
}
