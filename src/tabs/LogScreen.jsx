import { useState, useEffect, useCallback, useRef } from 'react';

function LogScreen({ game }) {
  return (
    <div>
      <div className="panel">
        <div className="panel-title">News Feed</div>
        {(game.news || []).map((n, i) => (
          <div key={i} className={"news-item" + (n.quest ? " quest" : n.event ? " danger" : "")}>
            {n.event && "⚠ "}{n.quest && "► "}{n.text}
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
