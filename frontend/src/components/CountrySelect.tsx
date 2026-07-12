"use client";

import { useState, useRef, useEffect } from "react";

export const ALL_COUNTRIES: { name: string; city_placeholder: string }[] = [
  { name: "Afghanistan", city_placeholder: "e.g. Kabul" },
  { name: "Albania", city_placeholder: "e.g. Tirana" },
  { name: "Algeria", city_placeholder: "e.g. Algiers" },
  { name: "Andorra", city_placeholder: "e.g. Andorra la Vella" },
  { name: "Angola", city_placeholder: "e.g. Luanda" },
  { name: "Argentina", city_placeholder: "e.g. Buenos Aires" },
  { name: "Armenia", city_placeholder: "e.g. Yerevan" },
  { name: "Australia", city_placeholder: "e.g. Sydney" },
  { name: "Austria", city_placeholder: "e.g. Vienna" },
  { name: "Azerbaijan", city_placeholder: "e.g. Baku" },
  { name: "Bahrain", city_placeholder: "e.g. Manama" },
  { name: "Bangladesh", city_placeholder: "e.g. Dhaka" },
  { name: "Belarus", city_placeholder: "e.g. Minsk" },
  { name: "Belgium", city_placeholder: "e.g. Brussels" },
  { name: "Bolivia", city_placeholder: "e.g. La Paz" },
  { name: "Bosnia and Herzegovina", city_placeholder: "e.g. Sarajevo" },
  { name: "Brazil", city_placeholder: "e.g. São Paulo" },
  { name: "Brunei", city_placeholder: "e.g. Bandar Seri Begawan" },
  { name: "Bulgaria", city_placeholder: "e.g. Sofia" },
  { name: "Cambodia", city_placeholder: "e.g. Phnom Penh" },
  { name: "Cameroon", city_placeholder: "e.g. Yaoundé" },
  { name: "Canada", city_placeholder: "e.g. Toronto" },
  { name: "Chile", city_placeholder: "e.g. Santiago" },
  { name: "China", city_placeholder: "e.g. Beijing" },
  { name: "Colombia", city_placeholder: "e.g. Bogotá" },
  { name: "Costa Rica", city_placeholder: "e.g. San José" },
  { name: "Croatia", city_placeholder: "e.g. Zagreb" },
  { name: "Cuba", city_placeholder: "e.g. Havana" },
  { name: "Cyprus", city_placeholder: "e.g. Nicosia" },
  { name: "Czech Republic", city_placeholder: "e.g. Prague" },
  { name: "Denmark", city_placeholder: "e.g. Copenhagen" },
  { name: "Dominican Republic", city_placeholder: "e.g. Santo Domingo" },
  { name: "Ecuador", city_placeholder: "e.g. Quito" },
  { name: "Egypt", city_placeholder: "e.g. Cairo" },
  { name: "El Salvador", city_placeholder: "e.g. San Salvador" },
  { name: "Estonia", city_placeholder: "e.g. Tallinn" },
  { name: "Ethiopia", city_placeholder: "e.g. Addis Ababa" },
  { name: "Finland", city_placeholder: "e.g. Helsinki" },
  { name: "France", city_placeholder: "e.g. Paris" },
  { name: "Georgia", city_placeholder: "e.g. Tbilisi" },
  { name: "Germany", city_placeholder: "e.g. Berlin" },
  { name: "Ghana", city_placeholder: "e.g. Accra" },
  { name: "Greece", city_placeholder: "e.g. Athens" },
  { name: "Guatemala", city_placeholder: "e.g. Guatemala City" },
  { name: "Honduras", city_placeholder: "e.g. Tegucigalpa" },
  { name: "Hong Kong", city_placeholder: "e.g. Hong Kong" },
  { name: "Hungary", city_placeholder: "e.g. Budapest" },
  { name: "Iceland", city_placeholder: "e.g. Reykjavik" },
  { name: "India", city_placeholder: "e.g. Mumbai" },
  { name: "Indonesia", city_placeholder: "e.g. Jakarta" },
  { name: "Iran", city_placeholder: "e.g. Tehran" },
  { name: "Iraq", city_placeholder: "e.g. Baghdad" },
  { name: "Ireland", city_placeholder: "e.g. Dublin" },
  { name: "Israel", city_placeholder: "e.g. Tel Aviv" },
  { name: "Italy", city_placeholder: "e.g. Rome" },
  { name: "Jamaica", city_placeholder: "e.g. Kingston" },
  { name: "Japan", city_placeholder: "e.g. Tokyo" },
  { name: "Jordan", city_placeholder: "e.g. Amman" },
  { name: "Kazakhstan", city_placeholder: "e.g. Almaty" },
  { name: "Kenya", city_placeholder: "e.g. Nairobi" },
  { name: "Kuwait", city_placeholder: "e.g. Kuwait City" },
  { name: "Kyrgyzstan", city_placeholder: "e.g. Bishkek" },
  { name: "Laos", city_placeholder: "e.g. Vientiane" },
  { name: "Latvia", city_placeholder: "e.g. Riga" },
  { name: "Lebanon", city_placeholder: "e.g. Beirut" },
  { name: "Libya", city_placeholder: "e.g. Tripoli" },
  { name: "Lithuania", city_placeholder: "e.g. Vilnius" },
  { name: "Luxembourg", city_placeholder: "e.g. Luxembourg City" },
  { name: "Macau", city_placeholder: "e.g. Macau" },
  { name: "Malaysia", city_placeholder: "e.g. Kuala Lumpur" },
  { name: "Maldives", city_placeholder: "e.g. Malé" },
  { name: "Malta", city_placeholder: "e.g. Valletta" },
  { name: "Mexico", city_placeholder: "e.g. Mexico City" },
  { name: "Moldova", city_placeholder: "e.g. Chișinău" },
  { name: "Mongolia", city_placeholder: "e.g. Ulaanbaatar" },
  { name: "Montenegro", city_placeholder: "e.g. Podgorica" },
  { name: "Morocco", city_placeholder: "e.g. Casablanca" },
  { name: "Mozambique", city_placeholder: "e.g. Maputo" },
  { name: "Myanmar", city_placeholder: "e.g. Yangon" },
  { name: "Nepal", city_placeholder: "e.g. Kathmandu" },
  { name: "Netherlands", city_placeholder: "e.g. Amsterdam" },
  { name: "New Zealand", city_placeholder: "e.g. Auckland" },
  { name: "Nicaragua", city_placeholder: "e.g. Managua" },
  { name: "Nigeria", city_placeholder: "e.g. Lagos" },
  { name: "North Korea", city_placeholder: "e.g. Pyongyang" },
  { name: "Norway", city_placeholder: "e.g. Oslo" },
  { name: "Oman", city_placeholder: "e.g. Muscat" },
  { name: "Pakistan", city_placeholder: "e.g. Karachi" },
  { name: "Palestine", city_placeholder: "e.g. Ramallah" },
  { name: "Panama", city_placeholder: "e.g. Panama City" },
  { name: "Paraguay", city_placeholder: "e.g. Asunción" },
  { name: "Peru", city_placeholder: "e.g. Lima" },
  { name: "Philippines", city_placeholder: "e.g. Manila" },
  { name: "Poland", city_placeholder: "e.g. Warsaw" },
  { name: "Portugal", city_placeholder: "e.g. Lisbon" },
  { name: "Qatar", city_placeholder: "e.g. Doha" },
  { name: "Romania", city_placeholder: "e.g. Bucharest" },
  { name: "Russia", city_placeholder: "e.g. Moscow" },
  { name: "Saudi Arabia", city_placeholder: "e.g. Riyadh" },
  { name: "Senegal", city_placeholder: "e.g. Dakar" },
  { name: "Serbia", city_placeholder: "e.g. Belgrade" },
  { name: "Singapore", city_placeholder: "e.g. Singapore" },
  { name: "Slovakia", city_placeholder: "e.g. Bratislava" },
  { name: "Slovenia", city_placeholder: "e.g. Ljubljana" },
  { name: "South Africa", city_placeholder: "e.g. Cape Town" },
  { name: "South Korea", city_placeholder: "e.g. Seoul" },
  { name: "Spain", city_placeholder: "e.g. Madrid" },
  { name: "Sri Lanka", city_placeholder: "e.g. Colombo" },
  { name: "Sudan", city_placeholder: "e.g. Khartoum" },
  { name: "Sweden", city_placeholder: "e.g. Stockholm" },
  { name: "Switzerland", city_placeholder: "e.g. Zurich" },
  { name: "Syria", city_placeholder: "e.g. Damascus" },
  { name: "Taiwan", city_placeholder: "e.g. Taipei" },
  { name: "Tajikistan", city_placeholder: "e.g. Dushanbe" },
  { name: "Tanzania", city_placeholder: "e.g. Dar es Salaam" },
  { name: "Thailand", city_placeholder: "e.g. Bangkok" },
  { name: "Tunisia", city_placeholder: "e.g. Tunis" },
  { name: "Turkey", city_placeholder: "e.g. Istanbul" },
  { name: "Turkmenistan", city_placeholder: "e.g. Ashgabat" },
  { name: "Uganda", city_placeholder: "e.g. Kampala" },
  { name: "Ukraine", city_placeholder: "e.g. Kyiv" },
  { name: "United Arab Emirates", city_placeholder: "e.g. Dubai" },
  { name: "United Kingdom", city_placeholder: "e.g. London" },
  { name: "United States", city_placeholder: "e.g. New York" },
  { name: "Uruguay", city_placeholder: "e.g. Montevideo" },
  { name: "Uzbekistan", city_placeholder: "e.g. Tashkent" },
  { name: "Venezuela", city_placeholder: "e.g. Caracas" },
  { name: "Vietnam", city_placeholder: "e.g. Ho Chi Minh City" },
  { name: "Yemen", city_placeholder: "e.g. Sanaa" },
  { name: "Zimbabwe", city_placeholder: "e.g. Harare" },
  { name: "Other", city_placeholder: "e.g. Your city" },
];

export default function CountrySelect({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = ALL_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (name: string) => {
    onChange(name);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search country..."
        value={open ? query : value}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onChange={(e) => setQuery(e.target.value)}
        className={className}
      />
      {open && (
        <div className="absolute z-50 w-full mt-1 max-h-52 overflow-y-auto rounded-lg border border-[#DDD8CE] bg-[#FFFBF5] shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">No results</div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.name}
                type="button"
                onMouseDown={() => handleSelect(c.name)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[#EDE8DC] ${
                  value === c.name ? "bg-[#EDE8DC] font-medium text-gray-900" : "text-gray-700"
                }`}
              >
                {c.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
