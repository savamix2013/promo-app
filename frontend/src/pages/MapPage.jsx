import '../styles/map-page.css';

function MapPage() {
  return (
    <div className="map-page">
      <h2>Інтерактивна карта магазинів</h2>
      <div className="map-container">
        <p className="placeholder">📍 Карта буде загружена з API後</p>
        <div className="map-placeholder">
          {/* Тут буде інтеграція з Google Maps або іншою бібліотекою */}
        </div>
      </div>
    </div>
  );
}

export default MapPage;
