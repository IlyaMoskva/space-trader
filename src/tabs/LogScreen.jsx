import { useState, useEffect, useCallback, useRef } from 'react';

function LogScreen({ game, onPlotCourse }) {
  return (
    <div>
      <div className="panel">
        <div className="panel-title">News Feed</div>
        {(game.news || []).map((n, i) => (
          <div key={i}
            className={"news-item" + (n.quest ? " quest" : n.event ? " danger" : "")}
            onClick={n.system !== undefined ? () => onPlotCourse && onPlotCourse(n.system) : undefined}
            style={n.system !== undefined ? { cursor:"pointer", borderLeft:"2px solid #ffd700", paddingLeft:6 } : {}}>
            {n.event && !n.quest && "⚠ "}{n.quest && "► "}{n.text}
            {n.system !== undefined && <span style={{ fontSize:12, color:"#ffd700", marginLeft:6 }}>→ WARP</span>}
          </div>
        ))}
        {(!game.news || game.news.length === 0) && <div style={{ fontSize:16, color:"#555588" }}>No news.</div>}
      </div>
      <div className="panel">
        <div className="panel-title">Captain's Log</div>
        {game.log.map((e, i) => <div key={i} className={"log-entry " + (e.type || "")}>{e.text}</div>)}
      </div>
    </div>
  );
}


export default LogScreen;
