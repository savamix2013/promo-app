import React from 'react';
import '../styles/promo-card.css';

const PromoCard = ({ promo }) => {
  const {
    title,
    store,
    old_price,
    new_price,
    discount_percent,
    image_url,
    url,
  } = promo;

  return (
    <div className="promo-card">
      <img src={image_url} alt={title} className="promo-image" />
      <div className="promo-details">
        <span className="promo-store">{store}</span>
        <h3 className="promo-title">{title}</h3>

        <div className="promo-prices">
          <span className="old-price">{old_price} грн</span>
          <span className="new-price">{new_price} грн</span>
        </div>

        <span className="discount">-{discount_percent}%</span>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="buy-button"
        >
          Переглянути
        </a>
      </div>
    </div>
  );
};

export default PromoCard;
