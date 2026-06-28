import { useState, useEffect, useRef } from 'react';

function SkillBar({ val, base, max = 10 }) {
  return (
    <div className="skill-bar" style={{ position: "relative" }}>
      {base !== undefined && base < val && (
        <div style={{ position: "absolute", height: "100%", background: "#4fc3f755", borderRadius: 1, width: (val / max * 100) + "%" }} />
      )}
      <div className="skill-fill" style={{ width: ((base !== undefined ? base : val) / max * 100) + "%" }} />
    </div>
  );
}


export default SkillBar;
