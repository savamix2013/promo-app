import '../styles/promo-card.css';

function PromoCard({ id, title, shop, discount, price, expiresAt }) {
  return (
    <div className="promo-card">
      <div className="promo-card-header">
        <h3 className="promo-title">{title}</h3>
        <span className="promo-discount">-{discount}%</span>
      </div>
      <p className="promo-shop">🏪 {shop}</p>
      <p className="promo-price">
        <span className="original-price">Ціна</span>
        <strong className="sale-price">{price} грн</strong>
      </p>
      <p className="promo-expires">до {expiresAt}</p>
      <button className="promo-button">Переглянути</button>
    </div>
  );
}

export default PromoCard;
