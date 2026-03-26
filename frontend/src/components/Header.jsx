import { Link } from 'react-router-dom';
import '../styles/header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>🎁 Promo App</h1>
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link">
            Акції
          </Link>
          <Link to="/map" className="nav-link">
            Карта
          </Link>
          <Link to="/profile" className="nav-link">
            Профіль
          </Link>
          <Link to="/admin" className="nav-link">
            Адмін
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
