import '../styles/footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p>&copy; 2026 Promo App. Усі права захищені.</p>
        <div className="footer-links">
          <a href="#privacy">Конфіденційність</a>
          <a href="#terms">Умови використання</a>
          <a href="#contact">Контакти</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
