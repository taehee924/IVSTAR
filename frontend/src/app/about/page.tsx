import Header from "@/components/layout/Header";
import Image from "next/image";

const STEMS = [
  { char: "甲", roman: "Gap", element: "Wood", polarity: "Yang", symbol: "☀" },
  { char: "乙", roman: "Eul", element: "Wood", polarity: "Yin",  symbol: "☾" },
  { char: "丙", roman: "Byeong", element: "Fire", polarity: "Yang", symbol: "☀" },
  { char: "丁", roman: "Jeong", element: "Fire", polarity: "Yin",  symbol: "☾" },
  { char: "戊", roman: "Mu",  element: "Earth", polarity: "Yang", symbol: "☀" },
  { char: "己", roman: "Ki",  element: "Earth", polarity: "Yin",  symbol: "☾" },
  { char: "庚", roman: "Gyeong", element: "Metal", polarity: "Yang", symbol: "☀" },
  { char: "辛", roman: "Sin", element: "Metal", polarity: "Yin",  symbol: "☾" },
  { char: "壬", roman: "Im",  element: "Water", polarity: "Yang", symbol: "☀" },
  { char: "癸", roman: "Gye", element: "Water", polarity: "Yin",  symbol: "☾" },
];

const BRANCHES = [
  { char: "子", roman: "Ja",   animal: "Rat",     emoji: "🐭" },
  { char: "丑", roman: "Chuk", animal: "Ox",      emoji: "🐂" },
  { char: "寅", roman: "In",   animal: "Tiger",   emoji: "🐯" },
  { char: "卯", roman: "Myo",  animal: "Rabbit",  emoji: "🐇" },
  { char: "辰", roman: "Jin",  animal: "Dragon",  emoji: "🐉" },
  { char: "巳", roman: "Sa",   animal: "Snake",   emoji: "🐍" },
  { char: "午", roman: "O",    animal: "Horse",   emoji: "🐴" },
  { char: "未", roman: "Mi",   animal: "Goat",    emoji: "🐐" },
  { char: "申", roman: "Sin",  animal: "Monkey",  emoji: "🐵" },
  { char: "酉", roman: "Yu",   animal: "Rooster", emoji: "🐓" },
  { char: "戌", roman: "Sul",  animal: "Dog",     emoji: "🐕" },
  { char: "亥", roman: "Hae",  animal: "Pig",     emoji: "🐗" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-3">
      {children}
    </p>
  );
}

function Divider() {
  return <hr className="border-t border-gray-200 my-10" />;
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#FFFBF5] pt-14 pb-16">
      <Header />
      <div className="max-w-lg mx-auto px-6 pt-12 space-y-0">

        {/* ── ABOUT ── */}
        <section>
          <SectionLabel>About</SectionLabel>
          <h1 className="text-4xl font-bold leading-tight text-gray-900 mb-5">
            Two ancient systems. <br></br>
            <span className="italic text-[#7B3B2A]">One complete picture</span>
            {" "}of you.
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Western astrology reads the sky at the moment you were born.
            Eastern Four Pillars reads the forces of time that shaped you.
            For centuries, these lived on opposite sides of the world. We
            put them in the same room.
          </p>
        </section>

        <Divider />

      
        <section>
          <h2 className="text-2xl font-bold leading-tight text-gray-900 mb-5 font-carattere">
            Not a horoscope.<br />A portrait.
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We read your birth chart and your Four Pillars chart together —
            combining the sky at your birth with the elemental forces of the time
            you were born into. Where the two systems meet, a more complete
            picture of you appears. 
          </p>
        </section>

        <br></br>
        <br></br>

        {/* ── QUOTE ── */}
        <blockquote className="border-l-2 border-gray-400 pl-5">
          <p className="text-base italic border-gray-700 font-serif">
            &ldquo;Saju is one of the most precise self-analysis systems ever
            built. Most people outside East Asia have just never had a
            way in.&rdquo;
          </p>
        </blockquote>
        

        <Divider />

        {/* ── WHAT IS SAJU ── */}
        <section>
          <SectionLabel>What is Saju?</SectionLabel><br></br>
          <p className="text-xs uppercase tracking-widest mb-2 text-[#7B3B2A]">
            四柱 · Four Pillars 
          </p>
          <br></br>

          <h2 className="text-2xl font-bold leading-tight text-gray-900 mb-5 font-carattere">
            The system that reads time, not just the sky.
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Saju (四柱) — literally &ldquo;four pillars&rdquo; — is one of East Asia&apos;s oldest systems
            of self-understanding. Built from the year, month, day, and hour of your
            birth, it maps five elemental forces — Wood, Fire, Earth, Metal, Water —
            that run through your character, your strengths, and your life&apos;s timing.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Unlike sun-sign astrology, Saju doesn&apos;t read the sky. It reads time itself:
            the invisible structure of energy you were born into. Precise, layered, and
            thousands of years old. Most of the world just hasn&apos;t had a way in — until
            now.
          </p>
        </section>

        <Divider />

        {/* ── THE LANGUAGE OF SAJU ── */}
        <section>
          <SectionLabel>The language of Saju</SectionLabel>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 font-carattere">
            천간지지 — <span className="font-bold">Stems &amp; Branches</span>
          </h2>

          {/* Saju Wheel */}
          <div className="relative w-full mb-10">
            <Image
              src="/sajuwheel.png"
              alt="Saju Wheel"
              width={800}
              height={800}
              style={{ width: "100%", height: "auto" }}
            />
          </div>

          {/* 천간 · Heavenly Stems */}
          <p className="text-sm text-black">
            천간 · Heavenly Stems
          </p>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-4">
            10 Energies — The Quality of Time
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            Each Stem is a blend of one of the Five Elements and a polarity — Yang (☀ active)
            or Yin (☾ receptive). The Stem of your birth <em>day</em> is your Day Master:
            the core energy you were born with.
          </p>

          <div className="divide-y divide-gray-100">
            {STEMS.map((s) => (
              <div key={s.char} className="flex items-center gap-5 py-3">
                <span className="text-2xl font-serif text-gray-800 w-8 text-center">{s.char}</span>
                <span className="text-sm text-gray-700">
                  {s.roman} · {s.element}
                </span>
                <span className="ml-auto text-xs text-gray-400">
                  {s.polarity} {s.symbol}
                </span>
              </div>
            ))}
          </div>

          <Divider />

          {/* 지지 · Earthly Branches */}
          <p className="text-sm text-black">
            지지 · Earthly Branches
          </p>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-4">
            12 Branches — Seasons, Directions, Animals
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            The 12 Earthly Branches correspond to the animals of the Chinese zodiac
            — but in Saju, each also carries a season, a direction, and an elemental
            energy. Your birth year, month, day, and hour each have a Branch, forming
            the map of forces at work when you arrived.
          </p>

          <div className="grid grid-cols-2 border border-gray-200">
            {BRANCHES.map((b, i) => (
              <div
                key={b.char}
                className={`flex items-center gap-3 px-4 py-3 text-sm text-gray-700
                  ${i % 2 === 0 ? "border-r border-gray-200" : ""}
                  ${i < BRANCHES.length - 2 ? "border-b border-gray-200" : ""}
                `}
              >
                <span className="text-base">{b.emoji}</span>
                <span className="text-lg font-serif text-gray-800">{b.char}</span>
                <span className="text-xs text-gray-600">
                  {b.roman} · {b.animal}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 leading-relaxed mt-6">
            When terms like Im (壬) Water or Myo (卯) Wood appear in your report, that&apos;s a
            Stem or Branch. Your report translates each one into plain language — this is just
            here so nothing feels unfamiliar when you read.
          </p>
        </section>

        <Divider />

        {/* ── AI · REPORTS ── */}
        <section>
          <SectionLabel>AI · Reports</SectionLabel>
          <h2 className="text-sm font-bold text-gray-900 mb-3 font-carattere">Built to be trusted</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Our AI engine runs on a framework built specifically for cosmic analysis —
            delivering precise, consistent reports that feel like the y were written only
            for you.
          </p>
        </section>

        <br></br>

        {/* ── ARCHIVE ── */}
        <section>
          <SectionLabel>Archive</SectionLabel>
          <h2 className="text-sm font-bold text-gray-900 mb-3 font-carattere">Your readings, always there</h2>
          <p className="text-sm text-gray-900 leading-relaxed">
            Every report is saved. Look back at past readings, track how your energy
            shifts over time, and share results with the people you trust.
          </p>
        </section>

        <Divider />

        {/* ── WHO IT'S FOR ── */}
        <section>
          <SectionLabel>Who it&apos;s for</SectionLabel>
          <h2 className="text-2xl font-bold leading-tight text-gray-900 mb-5 font-carattere">
            If astrology ever felt like only half the picture.
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            For the women who already live and breathe birth charts, tarot pulls, and
            MBTI deep-dives. For anyone curious about saju but never sure where
            to begin. We built the next step.
          </p>
        </section>

        <Divider />

        {/* ── FOOTER ── */}
        <footer className="text-left pb-4">
          <p className="text-xs text-gray-400">© 2026 IVSTAR · Team 0x6</p>
        </footer>

      </div>
    </main>
  );
}
