export default function ConstellationLoader() {
  return (
    <main className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-[340px] px-8">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" style={{ width: "100%", height: "auto" }}>
          <style>{`
            .star-g, .cline {
              animation-duration: 12s;
              animation-iteration-count: infinite;
              animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
              opacity: 0;
            }
            .cstar { fill: #FFEB3B; }
            .cline {
              stroke: #FFFFFF;
              stroke-width: 3.5;
              stroke-linecap: round;
              fill: none;
            }
            .s1 { animation-name: s1-anim; }
            @keyframes s1-anim {
              0% { opacity: 0; transform: scale(0.5); filter: drop-shadow(0 0 0px #ffeb3b); }
              2.5% { opacity: 1; transform: scale(1.2); filter: drop-shadow(0 0 12px #ffeb3b) drop-shadow(0 0 20px #ffd700); }
              10%, 91% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 4px #ffeb3b) drop-shadow(0 0 10px #ffd700); }
              100% { opacity: 0; transform: scale(0.5); filter: drop-shadow(0 0 0px #ffeb3b); }
            }
            .s2 { animation-name: s2-anim; }
            @keyframes s2-anim {
              0%, 12.4% { opacity: 0; transform: scale(0.5); filter: drop-shadow(0 0 0px #ffeb3b); }
              15.0% { opacity: 1; transform: scale(1.2); filter: drop-shadow(0 0 12px #ffeb3b) drop-shadow(0 0 20px #ffd700); }
              22.5%, 91% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 4px #ffeb3b) drop-shadow(0 0 10px #ffd700); }
              100% { opacity: 0; transform: scale(0.5); filter: drop-shadow(0 0 0px #ffeb3b); }
            }
            .l12 { animation-name: l12-anim; }
            @keyframes l12-anim {
              0%, 12.4% { stroke-dashoffset: 100; opacity: 0; }
              13.5% { opacity: 0.9; }
              19.1%, 91% { stroke-dashoffset: 0; opacity: 0.9; }
              100% { stroke-dashoffset: 100; opacity: 0; }
            }
            .s3 { animation-name: s3-anim; }
            @keyframes s3-anim {
              0%, 24.9% { opacity: 0; transform: scale(0.5); filter: drop-shadow(0 0 0px #ffeb3b); }
              27.5% { opacity: 1; transform: scale(1.2); filter: drop-shadow(0 0 12px #ffeb3b) drop-shadow(0 0 20px #ffd700); }
              35.0%, 91% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 4px #ffeb3b) drop-shadow(0 0 10px #ffd700); }
              100% { opacity: 0; transform: scale(0.5); filter: drop-shadow(0 0 0px #ffeb3b); }
            }
            .l23 { animation-name: l23-anim; }
            @keyframes l23-anim {
              0%, 24.9% { stroke-dashoffset: 100; opacity: 0; }
              26.0% { opacity: 0.9; }
              31.6%, 91% { stroke-dashoffset: 0; opacity: 0.9; }
              100% { stroke-dashoffset: 100; opacity: 0; }
            }
            .s4 { animation-name: s4-anim; }
            @keyframes s4-anim {
              0%, 37.4% { opacity: 0; transform: scale(0.5); filter: drop-shadow(0 0 0px #ffeb3b); }
              40.0% { opacity: 1; transform: scale(1.2); filter: drop-shadow(0 0 12px #ffeb3b) drop-shadow(0 0 20px #ffd700); }
              47.5%, 91% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 4px #ffeb3b) drop-shadow(0 0 10px #ffd700); }
              100% { opacity: 0; transform: scale(0.5); filter: drop-shadow(0 0 0px #ffeb3b); }
            }
            .l34 { animation-name: l34-anim; }
            @keyframes l34-anim {
              0%, 37.4% { stroke-dashoffset: 80; opacity: 0; }
              38.5% { opacity: 0.9; }
              44.1%, 91% { stroke-dashoffset: 0; opacity: 0.9; }
              100% { stroke-dashoffset: 80; opacity: 0; }
            }
            .s5 { animation-name: s5-anim; }
            @keyframes s5-anim {
              0%, 49.9% { opacity: 0; transform: scale(0.5); filter: drop-shadow(0 0 0px #ffeb3b); }
              52.5% { opacity: 1; transform: scale(1.2); filter: drop-shadow(0 0 12px #ffeb3b) drop-shadow(0 0 20px #ffd700); }
              60.0%, 91% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 4px #ffeb3b) drop-shadow(0 0 10px #ffd700); }
              100% { opacity: 0; transform: scale(0.5); filter: drop-shadow(0 0 0px #ffeb3b); }
            }
            .l45 { animation-name: l45-anim; }
            @keyframes l45-anim {
              0%, 49.9% { stroke-dashoffset: 80; opacity: 0; }
              51.0% { opacity: 0.9; }
              56.6%, 91% { stroke-dashoffset: 0; opacity: 0.9; }
              100% { stroke-dashoffset: 80; opacity: 0; }
            }
            .l15 { animation-name: l15-anim; }
            @keyframes l15-anim {
              0%, 49.9% { stroke-dashoffset: 120; opacity: 0; }
              51.0% { opacity: 0.9; }
              56.6%, 91% { stroke-dashoffset: 0; opacity: 0.9; }
              100% { stroke-dashoffset: 120; opacity: 0; }
            }
            .s6 { animation-name: s6-anim; }
            @keyframes s6-anim {
              0%, 62.4% { opacity: 0; transform: scale(0.5); filter: drop-shadow(0 0 0px #ffeb3b); }
              65.0% { opacity: 1; transform: scale(1.2); filter: drop-shadow(0 0 12px #ffeb3b) drop-shadow(0 0 20px #ffd700); }
              72.5%, 91% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 4px #ffeb3b) drop-shadow(0 0 10px #ffd700); }
              100% { opacity: 0; transform: scale(0.5); filter: drop-shadow(0 0 0px #ffeb3b); }
            }
            .l56 { animation-name: l56-anim; }
            @keyframes l56-anim {
              0%, 62.4% { stroke-dashoffset: 60; opacity: 0; }
              63.5% { opacity: 0.9; }
              69.1%, 91% { stroke-dashoffset: 0; opacity: 0.9; }
              100% { stroke-dashoffset: 60; opacity: 0; }
            }
            .s7 { animation-name: s7-anim; }
            @keyframes s7-anim {
              0%, 74.9% { opacity: 0; transform: scale(0.5); filter: drop-shadow(0 0 0px #ffeb3b); }
              77.5% { opacity: 1; transform: scale(1.2); filter: drop-shadow(0 0 12px #ffeb3b) drop-shadow(0 0 20px #ffd700); }
              85.0%, 91% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 4px #ffeb3b) drop-shadow(0 0 10px #ffd700); }
              100% { opacity: 0; transform: scale(0.5); filter: drop-shadow(0 0 0px #ffeb3b); }
            }
            .l57 { animation-name: l57-anim; }
            @keyframes l57-anim {
              0%, 74.9% { stroke-dashoffset: 120; opacity: 0; }
              76.0% { opacity: 0.9; }
              81.6%, 91% { stroke-dashoffset: 0; opacity: 0.9; }
              100% { stroke-dashoffset: 120; opacity: 0; }
            }
          `}</style>

          <g opacity="0.3">
            <circle cx="50" cy="80" r="1" fill="#fff" />
            <circle cx="350" cy="120" r="1.5" fill="#fff" />
            <circle cx="80" cy="300" r="1" fill="#fff" />
            <circle cx="320" cy="350" r="2" fill="#fff" />
            <circle cx="200" cy="40" r="1" fill="#fff" />
            <circle cx="260" cy="310" r="1" fill="#fff" />
          </g>

          <line className="cline l12" x1="150" y1="320" x2="230" y2="260" strokeDasharray="100" />
          <line className="cline l23" x1="230" y1="260" x2="310" y2="200" strokeDasharray="100" />
          <line className="cline l34" x1="310" y1="200" x2="230" y2="200" strokeDasharray="80" />
          <line className="cline l45" x1="230" y1="200" x2="150" y2="200" strokeDasharray="80" />
          <line className="cline l15" x1="150" y1="320" x2="150" y2="200" strokeDasharray="120" />
          <line className="cline l56" x1="150" y1="200" x2="90" y2="200" strokeDasharray="60" />
          <line className="cline l57" x1="150" y1="200" x2="150" y2="80" strokeDasharray="120" />

          <g className="star-g s1" style={{ transformOrigin: "150px 320px" }}><circle cx="150" cy="320" r="8.5" className="cstar" /></g>
          <g className="star-g s2" style={{ transformOrigin: "230px 260px" }}><circle cx="230" cy="260" r="8.5" className="cstar" /></g>
          <g className="star-g s3" style={{ transformOrigin: "310px 200px" }}><circle cx="310" cy="200" r="8.5" className="cstar" /></g>
          <g className="star-g s4" style={{ transformOrigin: "230px 200px" }}><circle cx="230" cy="200" r="8.5" className="cstar" /></g>
          <g className="star-g s5" style={{ transformOrigin: "150px 200px" }}><circle cx="150" cy="200" r="8.5" className="cstar" /></g>
          <g className="star-g s6" style={{ transformOrigin: "90px 200px" }}><circle cx="90" cy="200" r="8.5" className="cstar" /></g>
          <g className="star-g s7" style={{ transformOrigin: "150px 80px" }}><circle cx="150" cy="80" r="8.5" className="cstar" /></g>
        </svg>
      </div>
      <p className="mt-6 text-sm text-gray-400 tracking-widest uppercase">Reading the stars…</p>
    </main>
  );
}
