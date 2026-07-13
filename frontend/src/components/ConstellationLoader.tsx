"use client";
import { useState, useEffect } from "react";

const MESSAGES = [
  "Gathering your birth data...",
  "Aligning the stars...",
  "Generating your reading...",
];

export default function ConstellationLoader() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);
  return (
    <main className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ backgroundImage: "url('/background.png')", backgroundSize: "cover", backgroundPosition: "center" }}>

      {/* ── 전체화면 배경 별 ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 200"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="bgsg" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx="7"  cy="13"  r="0.14" fill="#ffffff" opacity="0.56" filter="url(#bgsg)" />
        <circle cx="23" cy="4"   r="0.21" fill="#ffffff" opacity="0.70" filter="url(#bgsg)" />
        <circle cx="41" cy="19"  r="0.14" fill="#ffffff" opacity="0.49" filter="url(#bgsg)" />
        <circle cx="58" cy="7"   r="0.18" fill="#ffffff" opacity="0.63" filter="url(#bgsg)" />
        <circle cx="72" cy="22"  r="0.14" fill="#ffffff" opacity="0.56" filter="url(#bgsg)" />
        <circle cx="89" cy="11"  r="0.21" fill="#ffffff" opacity="0.70" filter="url(#bgsg)" />
        <circle cx="15" cy="33"  r="0.18" fill="#ffffff" opacity="0.63" filter="url(#bgsg)" />
        <circle cx="34" cy="41"  r="0.14" fill="#ffffff" opacity="0.49" filter="url(#bgsg)" />
        <circle cx="51" cy="28"  r="0.21" fill="#ffffff" opacity="0.70" filter="url(#bgsg)" />
        <circle cx="67" cy="45"  r="0.14" fill="#ffffff" opacity="0.56" filter="url(#bgsg)" />
        <circle cx="83" cy="36"  r="0.18" fill="#ffffff" opacity="0.63" filter="url(#bgsg)" />
        <circle cx="96" cy="50"  r="0.14" fill="#ffffff" opacity="0.49" filter="url(#bgsg)" />
        <circle cx="4"  cy="57"  r="0.21" fill="#ffffff" opacity="0.70" filter="url(#bgsg)" />
        <circle cx="22" cy="62"  r="0.14" fill="#ffffff" opacity="0.56" filter="url(#bgsg)" />
        <circle cx="39" cy="53"  r="0.18" fill="#ffffff" opacity="0.63" filter="url(#bgsg)" />
        <circle cx="56" cy="71"  r="0.14" fill="#ffffff" opacity="0.49" filter="url(#bgsg)" />
        <circle cx="73" cy="58"  r="0.21" fill="#ffffff" opacity="0.70" filter="url(#bgsg)" />
        <circle cx="88" cy="67"  r="0.14" fill="#ffffff" opacity="0.56" filter="url(#bgsg)" />
        <circle cx="11" cy="79"  r="0.18" fill="#ffffff" opacity="0.63" filter="url(#bgsg)" />
        <circle cx="29" cy="86"  r="0.14" fill="#ffffff" opacity="0.49" filter="url(#bgsg)" />
        <circle cx="47" cy="74"  r="0.21" fill="#ffffff" opacity="0.70" filter="url(#bgsg)" />
        <circle cx="63" cy="91"  r="0.14" fill="#ffffff" opacity="0.56" filter="url(#bgsg)" />
        <circle cx="79" cy="82"  r="0.18" fill="#ffffff" opacity="0.63" filter="url(#bgsg)" />
        <circle cx="94" cy="95"  r="0.14" fill="#ffffff" opacity="0.49" filter="url(#bgsg)" />
        <circle cx="6"  cy="103" r="0.21" fill="#ffffff" opacity="0.70" filter="url(#bgsg)" />
        <circle cx="21" cy="97"  r="0.14" fill="#ffffff" opacity="0.56" filter="url(#bgsg)" />
        <circle cx="38" cy="108" r="0.18" fill="#ffffff" opacity="0.63" filter="url(#bgsg)" />
        <circle cx="54" cy="115" r="0.14" fill="#ffffff" opacity="0.49" filter="url(#bgsg)" />
        <circle cx="70" cy="104" r="0.21" fill="#ffffff" opacity="0.70" filter="url(#bgsg)" />
        <circle cx="85" cy="118" r="0.14" fill="#ffffff" opacity="0.56" filter="url(#bgsg)" />
        <circle cx="13" cy="127" r="0.18" fill="#ffffff" opacity="0.63" filter="url(#bgsg)" />
        <circle cx="31" cy="121" r="0.14" fill="#ffffff" opacity="0.49" filter="url(#bgsg)" />
        <circle cx="48" cy="133" r="0.21" fill="#ffffff" opacity="0.70" filter="url(#bgsg)" />
        <circle cx="64" cy="126" r="0.14" fill="#ffffff" opacity="0.56" filter="url(#bgsg)" />
        <circle cx="80" cy="138" r="0.18" fill="#ffffff" opacity="0.63" filter="url(#bgsg)" />
        <circle cx="97" cy="130" r="0.14" fill="#ffffff" opacity="0.49" filter="url(#bgsg)" />
        <circle cx="9"  cy="146" r="0.21" fill="#ffffff" opacity="0.70" filter="url(#bgsg)" />
        <circle cx="26" cy="153" r="0.14" fill="#ffffff" opacity="0.56" filter="url(#bgsg)" />
        <circle cx="43" cy="143" r="0.18" fill="#ffffff" opacity="0.63" filter="url(#bgsg)" />
        <circle cx="60" cy="158" r="0.14" fill="#ffffff" opacity="0.49" filter="url(#bgsg)" />
        <circle cx="76" cy="149" r="0.21" fill="#ffffff" opacity="0.70" filter="url(#bgsg)" />
        <circle cx="91" cy="162" r="0.14" fill="#ffffff" opacity="0.56" filter="url(#bgsg)" />
        <circle cx="17" cy="170" r="0.18" fill="#ffffff" opacity="0.63" filter="url(#bgsg)" />
        <circle cx="35" cy="165" r="0.14" fill="#ffffff" opacity="0.49" filter="url(#bgsg)" />
        <circle cx="52" cy="177" r="0.21" fill="#ffffff" opacity="0.70" filter="url(#bgsg)" />
        <circle cx="68" cy="172" r="0.14" fill="#ffffff" opacity="0.56" filter="url(#bgsg)" />
        <circle cx="84" cy="183" r="0.18" fill="#ffffff" opacity="0.63" filter="url(#bgsg)" />
        <circle cx="3"  cy="188" r="0.14" fill="#ffffff" opacity="0.49" filter="url(#bgsg)" />
        <circle cx="44" cy="193" r="0.21" fill="#ffffff" opacity="0.70" filter="url(#bgsg)" />
        <circle cx="78" cy="196" r="0.14" fill="#ffffff" opacity="0.56" filter="url(#bgsg)" />
        <circle cx="19" cy="47"  r="0.14" fill="#ffffff" opacity="0.63" filter="url(#bgsg)" />
        <circle cx="93" cy="143" r="0.18" fill="#ffffff" opacity="0.56" filter="url(#bgsg)" />
        <circle cx="37" cy="87"  r="0.14" fill="#ffffff" opacity="0.49" filter="url(#bgsg)" />
        <circle cx="55" cy="137" r="0.21" fill="#ffffff" opacity="0.70" filter="url(#bgsg)" />
        <circle cx="71" cy="25"  r="0.14" fill="#ffffff" opacity="0.56" filter="url(#bgsg)" />
        <circle cx="2"  cy="116" r="0.18" fill="#ffffff" opacity="0.63" filter="url(#bgsg)" />
      </svg>

      {/* ── 별자리 SVG ── */}
      <div className="relative w-full max-w-[340px] px-8">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" overflow="visible" style={{ width: "100%", height: "auto" }}>
          <defs>
            {/* 별자리 별 글로우 필터 */}
            <filter id="starglow" x="-400%" y="-400%" width="900%" height="900%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8"  result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur2" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="32" result="blur3" />
              <feMerge>
                <feMergeNode in="blur3" />
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* 선 글로우 필터 */}
            <filter id="lineglow" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5"  result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <style>{`
            .star-g, .cline {
              animation-duration: 10s;
              animation-iteration-count: infinite;
              animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
              opacity: 0;
            }
            .cstar { fill: #ffffff; }
            .cline {
              stroke: #ffffff;
              stroke-width: 3.5;
              stroke-linecap: round;
              fill: none;
              filter: drop-shadow(0 0 6px rgba(255,255,255,0.9)) drop-shadow(0 0 14px rgba(255,255,255,0.6));
            }

            /* ── Stars ── */
            .s1 { animation-name: s1-anim; }
            @keyframes s1-anim {
              0%          { opacity: 0; transform: scale(0.5); }
              2.5%        { opacity: 1; transform: scale(1.3); }
              10%, 91%    { opacity: 1; transform: scale(1);   }
              100%        { opacity: 0; transform: scale(0.5); }
            }
            .s2 { animation-name: s2-anim; }
            @keyframes s2-anim {
              0%, 12.4%   { opacity: 0; transform: scale(0.5); }
              15.0%       { opacity: 1; transform: scale(1.3); }
              22.5%, 91%  { opacity: 1; transform: scale(1);   }
              100%        { opacity: 0; transform: scale(0.5); }
            }
            .s3 { animation-name: s3-anim; }
            @keyframes s3-anim {
              0%, 24.9%   { opacity: 0; transform: scale(0.5); }
              27.5%       { opacity: 1; transform: scale(1.3); }
              35.0%, 91%  { opacity: 1; transform: scale(1);   }
              100%        { opacity: 0; transform: scale(0.5); }
            }
            .s4 { animation-name: s4-anim; }
            @keyframes s4-anim {
              0%, 37.4%   { opacity: 0; transform: scale(0.5); }
              40.0%       { opacity: 1; transform: scale(1.3); }
              47.5%, 91%  { opacity: 1; transform: scale(1);   }
              100%        { opacity: 0; transform: scale(0.5); }
            }
            .s5 { animation-name: s5-anim; }
            @keyframes s5-anim {
              0%, 49.9%   { opacity: 0; transform: scale(0.5); }
              52.5%       { opacity: 1; transform: scale(1.3); }
              60.0%, 91%  { opacity: 1; transform: scale(1);   }
              100%        { opacity: 0; transform: scale(0.5); }
            }
            .s6 { animation-name: s6-anim; }
            @keyframes s6-anim {
              0%, 62.4%   { opacity: 0; transform: scale(0.5); }
              65.0%       { opacity: 1; transform: scale(1.3); }
              72.5%, 91%  { opacity: 1; transform: scale(1);   }
              100%        { opacity: 0; transform: scale(0.5); }
            }
            .s7 { animation-name: s7-anim; }
            @keyframes s7-anim {
              0%, 74.9%   { opacity: 0; transform: scale(0.5); }
              77.5%       { opacity: 1; transform: scale(1.3); }
              85.0%, 91%  { opacity: 1; transform: scale(1);   }
              100%        { opacity: 0; transform: scale(0.5); }
            }

            /* ── Lines ── */
            .l12 { animation-name: l12-anim; }
            @keyframes l12-anim {
              0%, 12.4%   { stroke-dashoffset: 100; opacity: 0; }
              13.5%       { opacity: 0.9; }
              19.1%, 91%  { stroke-dashoffset: 0; opacity: 0.9; }
              100%        { stroke-dashoffset: 100; opacity: 0; }
            }
            .l23 { animation-name: l23-anim; }
            @keyframes l23-anim {
              0%, 24.9%   { stroke-dashoffset: 100; opacity: 0; }
              26.0%       { opacity: 0.9; }
              31.6%, 91%  { stroke-dashoffset: 0; opacity: 0.9; }
              100%        { stroke-dashoffset: 100; opacity: 0; }
            }
            .l34 { animation-name: l34-anim; }
            @keyframes l34-anim {
              0%, 37.4%   { stroke-dashoffset: 80; opacity: 0; }
              38.5%       { opacity: 0.9; }
              44.1%, 91%  { stroke-dashoffset: 0; opacity: 0.9; }
              100%        { stroke-dashoffset: 80; opacity: 0; }
            }
            .l45 { animation-name: l45-anim; }
            @keyframes l45-anim {
              0%, 49.9%   { stroke-dashoffset: 80; opacity: 0; }
              51.0%       { opacity: 0.9; }
              56.6%, 91%  { stroke-dashoffset: 0; opacity: 0.9; }
              100%        { stroke-dashoffset: 80; opacity: 0; }
            }
            .l15 { animation-name: l15-anim; }
            @keyframes l15-anim {
              0%, 49.9%   { stroke-dashoffset: 120; opacity: 0; }
              51.0%       { opacity: 0.9; }
              56.6%, 91%  { stroke-dashoffset: 0; opacity: 0.9; }
              100%        { stroke-dashoffset: 120; opacity: 0; }
            }
            .l56 { animation-name: l56-anim; }
            @keyframes l56-anim {
              0%, 62.4%   { stroke-dashoffset: 60; opacity: 0; }
              63.5%       { opacity: 0.9; }
              69.1%, 91%  { stroke-dashoffset: 0; opacity: 0.9; }
              100%        { stroke-dashoffset: 60; opacity: 0; }
            }
            .l57 { animation-name: l57-anim; }
            @keyframes l57-anim {
              0%, 74.9%   { stroke-dashoffset: 120; opacity: 0; }
              76.0%       { opacity: 0.9; }
              81.6%, 91%  { stroke-dashoffset: 0; opacity: 0.9; }
              100%        { stroke-dashoffset: 120; opacity: 0; }
            }
          `}</style>

          <line className="cline l12" x1="150" y1="320" x2="230" y2="260" strokeDasharray="100" />
          <line className="cline l23" x1="230" y1="260" x2="310" y2="200" strokeDasharray="100" />
          <line className="cline l34" x1="310" y1="200" x2="230" y2="200" strokeDasharray="80"  />
          <line className="cline l45" x1="230" y1="200" x2="150" y2="200" strokeDasharray="80"  />
          <line className="cline l15" x1="150" y1="320" x2="150" y2="200" strokeDasharray="120" />
          <line className="cline l56" x1="150" y1="200" x2="90"  y2="200" strokeDasharray="60"  />
          <line className="cline l57" x1="150" y1="200" x2="150" y2="80"  strokeDasharray="120" />

          <g className="star-g s1" style={{ transformOrigin: "150px 320px" }}><circle cx="150" cy="320" r="8.5" className="cstar" filter="url(#starglow)" /></g>
          <g className="star-g s2" style={{ transformOrigin: "230px 260px" }}><circle cx="230" cy="260" r="8.5" className="cstar" filter="url(#starglow)" /></g>
          <g className="star-g s3" style={{ transformOrigin: "310px 200px" }}><circle cx="310" cy="200" r="8.5" className="cstar" filter="url(#starglow)" /></g>
          <g className="star-g s4" style={{ transformOrigin: "230px 200px" }}><circle cx="230" cy="200" r="8.5" className="cstar" filter="url(#starglow)" /></g>
          <g className="star-g s5" style={{ transformOrigin: "150px 200px" }}><circle cx="150" cy="200" r="8.5" className="cstar" filter="url(#starglow)" /></g>
          <g className="star-g s6" style={{ transformOrigin: "90px 200px"  }}><circle cx="90"  cy="200" r="8.5" className="cstar" filter="url(#starglow)" /></g>
          <g className="star-g s7" style={{ transformOrigin: "150px 80px"  }}><circle cx="150" cy="80"  r="8.5" className="cstar" filter="url(#starglow)" /></g>
        </svg>
      </div>
      <p className="mt-6 text-sm text-white tracking-widest uppercase transition-opacity duration-500">
        {MESSAGES[msgIdx]}
      </p>
    </main>
  );
}
