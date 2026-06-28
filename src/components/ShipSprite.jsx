import { useState, useEffect, useRef } from 'react';

const SHIP_SVGS = {
  flea: (c) => <>
    <polygon points="35,4 37,4 41,14 31,14" fill={c.body}/>
    <rect x="33" y="14" width="6" height="4" fill={c.cockpit}/>
    <rect x="34" y="15" width="4" height="2" fill={c.glass}/>
    <rect x="30" y="18" width="12" height="8" fill={c.body}/>
    <rect x="16" y="21" width="14" height="3" fill={c.wing}/>
    <rect x="14" y="19" width="4" height="7" fill={c.wing}/>
    <rect x="42" y="21" width="14" height="3" fill={c.wing}/>
    <rect x="54" y="19" width="4" height="7" fill={c.wing}/>
    <rect x="32" y="26" width="8" height="5" fill={c.engine}/>
    <rect x="31" y="31" width="3" height="3" fill={c.glow} opacity="0.9"/>
    <rect x="38" y="31" width="3" height="3" fill={c.glow} opacity="0.9"/>
  </>,
  gnat: (c) => <>
    <rect x="34" y="0" width="1" height="5" fill={c.gun}/>
    <rect x="37" y="0" width="1" height="5" fill={c.gun}/>
    <polygon points="35,5 37,5 40,14 32,14" fill={c.body}/>
    <rect x="33" y="14" width="6" height="5" fill={c.cockpit}/>
    <rect x="34" y="15" width="4" height="3" fill={c.glass}/>
    <rect x="31" y="19" width="10" height="12" fill={c.body}/>
    <rect x="9" y="19" width="22" height="3" fill={c.wing}/>
    <rect x="7" y="14" width="4" height="12" fill={c.wing}/>
    <rect x="41" y="19" width="22" height="3" fill={c.wing}/>
    <rect x="61" y="14" width="4" height="12" fill={c.wing}/>
    <rect x="9" y="28" width="22" height="3" fill={c.wing}/>
    <rect x="7" y="26" width="4" height="9" fill={c.wing}/>
    <rect x="41" y="28" width="22" height="3" fill={c.wing}/>
    <rect x="61" y="26" width="4" height="9" fill={c.wing}/>
    <rect x="33" y="31" width="6" height="5" fill={c.engine}/>
    <rect x="33" y="36" width="6" height="3" fill={c.glow} opacity="0.9"/>
  </>,
  firefly: (c) => <>
    <polygon points="36,2 40,2 44,12 32,12" fill={c.body}/>
    <rect x="34" y="12" width="8" height="5" fill={c.cockpit}/>
    <rect x="35" y="13" width="6" height="3" fill={c.glass}/>
    <polygon points="28,17 44,17 48,36 24,36" fill={c.body}/>
    <polygon points="8,22 28,17 28,22 12,30" fill={c.wing}/>
    <polygon points="64,22 44,17 44,22 60,30" fill={c.wing}/>
    <rect x="6" y="22" width="6" height="10" fill={c.engine}/>
    <rect x="6" y="32" width="6" height="4" fill={c.glow} opacity="0.9"/>
    <rect x="60" y="22" width="6" height="10" fill={c.engine}/>
    <rect x="60" y="32" width="6" height="4" fill={c.glow} opacity="0.9"/>
    <rect x="32" y="36" width="8" height="4" fill={c.glow} opacity="0.7"/>
  </>,
  mosquito: (c) => <>
    <polygon points="34,8 38,8 42,16 30,16" fill={c.cockpit}/>
    <rect x="30" y="16" width="12" height="12" fill={c.body}/>
    <rect x="32" y="18" width="8" height="6" fill="#1a1a2a"/>
    <rect x="33" y="19" width="6" height="4" fill={c.glass}/>
    <rect x="18" y="19" width="12" height="3" fill={c.wing}/>
    <rect x="42" y="19" width="12" height="3" fill={c.wing}/>
    <polygon points="4,10 18,18 18,38 4,46" fill="#22224a"/>
    {[12,18,24,30,36].map(y => <rect key={y} x="5" y={y} width="12" height="1" fill="#4444aa" opacity="0.8"/>)}
    <polygon points="68,10 54,18 54,38 68,46" fill="#22224a"/>
    {[12,18,24,30,36].map(y => <rect key={y} x="55" y={y} width="12" height="1" fill="#4444aa" opacity="0.8"/>)}
    <rect x="4" y="28" width="2" height="6" fill={c.gun}/>
    <rect x="66" y="28" width="2" height="6" fill={c.gun}/>
    <rect x="34" y="28" width="4" height="8" fill={c.engine}/>
    <rect x="34" y="36" width="4" height="3" fill={c.glow} opacity="0.9"/>
  </>,
  bumblebee: (c) => <>
    <polygon points="50,6 70,10 76,20 76,32 70,40 32,40 24,32 24,20 30,10" fill={c.body}/>
    <polygon points="50,10 68,16 68,28 50,34 32,28 32,16" fill={c.cockpit} opacity="0.4"/>
    <rect x="50" y="2" width="22" height="10" fill={c.cockpit}/>
    <rect x="52" y="3" width="8" height="6" fill={c.glass}/>
    <rect x="62" y="3" width="6" height="6" fill={c.glass} opacity="0.6"/>
    <rect x="42" y="6" width="5" height="5" fill={c.body}/>
    <rect x="43" y="2" width="3" height="7" fill={c.gun}/>
    <rect x="24" y="22" width="6" height="14" fill={c.engine}/>
    <rect x="24" y="36" width="6" height="4" fill={c.glow} opacity="0.9"/>
    <rect x="70" y="22" width="6" height="14" fill={c.engine}/>
    <rect x="70" y="36" width="6" height="4" fill={c.glow} opacity="0.9"/>
  </>,
  beetle: (c) => <>
    <polygon points="52,4 58,4 74,16 30,16" fill={c.body}/>
    <polygon points="48,8 60,8 62,16 46,16" fill={c.cockpit}/>
    <rect x="28" y="16" width="44" height="12" fill={c.body}/>
    <rect x="26" y="4" width="2" height="14" fill={c.gun}/>
    <rect x="72" y="4" width="2" height="14" fill={c.gun}/>
    <rect x="38" y="20" width="4" height="3" fill={c.glass}/>
    <rect x="46" y="20" width="4" height="3" fill={c.glass}/>
    <rect x="54" y="20" width="4" height="3" fill={c.glass}/>
    <polygon points="18,28 28,16 28,28" fill={c.wing}/>
    <polygon points="82,28 72,16 72,28" fill={c.wing}/>
    <rect x="18" y="28" width="64" height="10" fill={c.body}/>
    <rect x="32" y="38" width="36" height="7" fill={c.engine}/>
    <rect x="22" y="38" width="8" height="7" fill={c.engine}/>
    <rect x="70" y="38" width="8" height="7" fill={c.engine}/>
    <rect x="22" y="45" width="8" height="3" fill={c.glow} opacity="0.9"/>
    <rect x="34" y="45" width="8" height="3" fill={c.glow} opacity="0.9"/>
    <rect x="46" y="45" width="8" height="3" fill={c.glow} opacity="0.9"/>
    <rect x="58" y="45" width="8" height="3" fill={c.glow} opacity="0.9"/>
    <rect x="70" y="45" width="8" height="3" fill={c.glow} opacity="0.9"/>
  </>,
  hornet: (c) => <>
    <polygon points="50,2 54,2 80,22 20,22" fill={c.body}/>
    <rect x="44" y="4" width="16" height="14" fill={c.cockpit}/>
    <rect x="46" y="5" width="6" height="6" fill={c.glass}/>
    <rect x="54" y="5" width="6" height="6" fill={c.glass} opacity="0.6"/>
    <rect x="48" y="0" width="2" height="12" fill={c.gun}/>
    <rect x="52" y="0" width="2" height="14" fill={c.gun}/>
    <rect x="56" y="0" width="2" height="12" fill={c.gun}/>
    <rect x="20" y="22" width="60" height="10" fill={c.body}/>
    <rect x="22" y="24" width="2" height="8" fill={c.gun}/>
    <rect x="76" y="24" width="2" height="8" fill={c.gun}/>
    <polygon points="8,34 20,22 20,34" fill={c.wing}/>
    <polygon points="92,34 80,22 80,34" fill={c.wing}/>
    <rect x="8" y="34" width="84" height="10" fill={c.body}/>
    <rect x="28" y="38" width="44" height="4" fill={c.engine} opacity="0.5"/>
    <rect x="14" y="44" width="72" height="7" fill={c.engine}/>
    <rect x="16" y="51" width="10" height="3" fill={c.glow} opacity="0.9"/>
    <rect x="30" y="51" width="10" height="3" fill={c.glow} opacity="0.9"/>
    <rect x="44" y="51" width="12" height="3" fill={c.glow} opacity="0.9"/>
    <rect x="60" y="51" width="10" height="3" fill={c.glow} opacity="0.9"/>
    <rect x="74" y="51" width="10" height="3" fill={c.glow} opacity="0.9"/>
  </>,
  grasshopper: (c) => <>
    <ellipse cx="50" cy="26" rx="38" ry="18" fill={c.body}/>
    <ellipse cx="50" cy="18" rx="22" ry="12" fill={c.cockpit}/>
    <rect x="44" y="4" width="12" height="12" fill={c.cockpit}/>
    <rect x="46" y="5" width="5" height="5" fill={c.glass}/>
    <rect x="52" y="5" width="4" height="5" fill={c.glass} opacity="0.5"/>
    <ellipse cx="36" cy="26" rx="7" ry="4" fill="#334433" opacity="0.5"/>
    <ellipse cx="64" cy="26" rx="7" ry="4" fill="#334433" opacity="0.5"/>
    <rect x="14" y="24" width="12" height="6" fill={c.wing}/>
    <rect x="74" y="24" width="12" height="6" fill={c.wing}/>
    <rect x="14" y="24" width="2" height="10" fill={c.gun}/>
    <rect x="84" y="24" width="2" height="10" fill={c.gun}/>
    <ellipse cx="50" cy="38" rx="30" ry="8" fill="#334433"/>
    <rect x="24" y="40" width="14" height="7" fill={c.engine} rx="2"/>
    <rect x="62" y="40" width="14" height="7" fill={c.engine} rx="2"/>
    <rect x="40" y="43" width="20" height="5" fill={c.engine} rx="2"/>
    <rect x="24" y="47" width="14" height="3" fill={c.glow} opacity="0.9"/>
    <rect x="62" y="47" width="14" height="3" fill={c.glow} opacity="0.9"/>
    <rect x="40" y="48" width="20" height="3" fill={c.glow} opacity="0.7"/>
  </>,
  termite: (c) => <>
    <polygon points="26,4 46,4 50,14 22,14" fill={c.body}/>
    <rect x="22" y="14" width="28" height="10" fill={c.cockpit}/>
    <rect x="26" y="16" width="4" height="4" fill={c.glass}/>
    <rect x="34" y="16" width="4" height="4" fill={c.glass}/>
    <rect x="42" y="16" width="4" height="4" fill={c.glass}/>
    <rect x="35" y="1" width="2" height="5" fill={c.gun}/>
    <rect x="30" y="24" width="12" height="16" fill="#334466"/>
    <rect x="14" y="40" width="72" height="16" fill={c.body}/>
    <rect x="46" y="30" width="18" height="14" fill={c.cockpit}/>
    <rect x="48" y="32" width="5" height="5" fill={c.glass}/>
    <rect x="56" y="32" width="5" height="5" fill={c.glass} opacity="0.5"/>
    {[0,16,32,48].map(x => <rect key={x} x={16+x} y={44} width="14" height="6" fill="#223355" opacity="0.7"/>)}
    <rect x="14" y="56" width="72" height="8" fill={c.engine}/>
    <rect x="16" y="64" width="12" height="3" fill={c.glow} opacity="0.9"/>
    <rect x="32" y="64" width="12" height="3" fill={c.glow} opacity="0.9"/>
    <rect x="48" y="64" width="12" height="3" fill={c.glow} opacity="0.9"/>
    <rect x="64" y="64" width="12" height="3" fill={c.glow} opacity="0.9"/>
  </>,
  wasp: (c) => <>
    <polygon points="50,0 54,0 100,52 0,52" fill={c.body}/>
    <polygon points="50,0 54,0 88,36 16,36" fill={c.cockpit} opacity="0.35"/>
    <rect x="38" y="8" width="28" height="18" fill={c.cockpit}/>
    <rect x="40" y="9" width="10" height="8" fill={c.glass}/>
    <rect x="52" y="9" width="8" height="8" fill={c.glass} opacity="0.6"/>
    <rect x="34" y="5" width="6" height="6" fill={c.body} rx="2"/>
    <rect x="64" y="5" width="6" height="6" fill={c.body} rx="2"/>
    <rect x="44" y="0" width="2" height="14" fill={c.gun}/>
    <rect x="50" y="0" width="2" height="16" fill={c.gun}/>
    <rect x="56" y="0" width="2" height="14" fill={c.gun}/>
    <rect x="18" y="34" width="2" height="12" fill={c.gun}/>
    <rect x="26" y="32" width="2" height="14" fill={c.gun}/>
    <rect x="74" y="34" width="2" height="12" fill={c.gun}/>
    <rect x="72" y="32" width="2" height="14" fill={c.gun}/>
    <rect x="14" y="40" width="72" height="5" fill={c.body} opacity="0.5"/>
    <rect x="24" y="44" width="52" height="4" fill="#334455" opacity="0.6"/>
    <rect x="0" y="52" width="100" height="10" fill={c.engine}/>
    <rect x="2" y="62" width="14" height="4" fill={c.glow} opacity="0.9"/>
    <rect x="20" y="62" width="14" height="4" fill={c.glow} opacity="1.0"/>
    <rect x="38" y="62" width="14" height="4" fill={c.glow} opacity="1.0"/>
    <rect x="54" y="62" width="14" height="4" fill={c.glow} opacity="1.0"/>
    <rect x="72" y="62" width="14" height="4" fill={c.glow} opacity="1.0"/>
    <rect x="86" y="62" width="12" height="4" fill={c.glow} opacity="0.9"/>
  </>,
};


const SHIP_COLORS = {
  flea:        { body:"#778899", cockpit:"#8899aa", glass:"#4fc3f7", wing:"#556677", engine:"#445566", gun:"#cc4444", glow:"#4fc3f7" },
  gnat:        { body:"#8899bb", cockpit:"#99aacc", glass:"#4fc3f7", wing:"#6677aa", engine:"#445577", gun:"#cc4444", glow:"#4fc3f7" },
  firefly:     { body:"#779977", cockpit:"#aaccaa", glass:"#4fc3f7", wing:"#668866", engine:"#445544", gun:"#cc4444", glow:"#4fc3f7" },
  mosquito:    { body:"#999999", cockpit:"#aaaaaa", glass:"#4fc3f7", wing:"#22224a", engine:"#333333", gun:"#cc4444", glow:"#4fc3f7" },
  bumblebee:   { body:"#aa9977", cockpit:"#bbaa88", glass:"#4fc3f7", wing:"#887755", engine:"#665544", gun:"#cc4444", glow:"#4fc3f7" },
  beetle:      { body:"#7799bb", cockpit:"#8899cc", glass:"#4fc3f7", wing:"#6688aa", engine:"#556677", gun:"#cc4444", glow:"#4fc3f7" },
  hornet:      { body:"#8a4a5a", cockpit:"#7a3a4a", glass:"#4fc3f7", wing:"#6a2a3a", engine:"#4a2a3a", gun:"#cc4444", glow:"#4fc3f7" },
  grasshopper: { body:"#557766", cockpit:"#669977", glass:"#4fc3f7", wing:"#446655", engine:"#335544", gun:"#cc4444", glow:"#4fc3f7" },
  termite:     { body:"#6688aa", cockpit:"#7799bb", glass:"#4fc3f7", wing:"#5577aa", engine:"#445566", gun:"#cc4444", glow:"#4fc3f7" },
  wasp:        { body:"#8899aa", cockpit:"#99aacc", glass:"#4fc3f7", wing:"#667788", engine:"#556677", gun:"#ff4444", glow:"#4fc3f7" },
};


function ShipSprite({ shipId, size = 48, flip = false }) {
  const draw = SHIP_SVGS[shipId] || SHIP_SVGS.gnat;
  const colors = SHIP_COLORS[shipId] || SHIP_COLORS.gnat;
  // Each ship is drawn in a ~72×68 or so box; scale to fit `size`
  const vbSizes = {
    flea:"72 36", gnat:"72 40", firefly:"72 40", mosquito:"72 56",
    bumblebee:"100 44", beetle:"102 50", hornet:"102 56", grasshopper:"100 52",
    termite:"100 68", wasp:"102 68",
  };
  const vb = "0 0 " + (vbSizes[shipId] || "72 56");
  const transform = flip ? `scale(-1,1) translate(-${vb.split(" ")[2]},0)` : undefined;
  return (
    <svg width={size} height={size} viewBox={vb} style={{ display:"block", imageRendering:"pixelated" }}>
      <g transform={transform}>
        {draw(colors)}
      </g>
    </svg>
  );
}


export default ShipSprite;
