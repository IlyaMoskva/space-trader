import { useState, useEffect, useRef } from 'react';

function QuestPopup({ popup, onClose }) {
  if (!popup) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}
        style={{ borderColor: popup.color || "#ffd700" }}>
        <div className="modal-title" style={{ color: popup.color || "#ffd700", fontSize: 19, lineHeight: 1.8 }}>
          {popup.title}
        </div>
        <div style={{ fontSize: 16, color: "#aaa8cc", lineHeight: 2, whiteSpace: "pre-line", marginBottom: 16 }}>
          {popup.body}
        </div>
        <button className="btn btn-gold" onClick={onClose} style={{ width: "100%" }}>
          ACKNOWLEDGED ▶
        </button>
      </div>
    </div>
  );
}


export default QuestPopup;
