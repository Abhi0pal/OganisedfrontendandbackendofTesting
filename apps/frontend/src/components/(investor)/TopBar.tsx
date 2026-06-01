'use client';

interface TopBarProps {
  fontScale: number;
  increaseFont: () => void;
  decreaseFont: () => void;
  resetFont: () => void;
  locale: string;
  changeLanguage: (lang: string) => void;
}

export default function TopBar({
  fontScale,
  increaseFont,
  decreaseFont,
  resetFont,
  locale,
  changeLanguage,
}: TopBarProps) {
  return (
    <div
      style={{ fontSize: `${fontScale}rem` }}
      className="w-full text-xs top-bar"
    >
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left section */}
        <div className="flex items-center gap-2">
          <img
            src="/img/indian-flag.png"
            alt="Indian Flag"
            className="w-4 h-3 object-cover"
          />
          <span className="font-medium">Government of India</span>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          <a href="#main" className="hover:underline">
            Skip to Main Content
          </a>

          <span className="flex items-center gap-1 cursor-pointer hover:underline">
            Screen Reader
          </span>

          {/* Font controls */}
          <div className="flex items-center gap-1 border-l border-[#cba7a2] pl-3">
            <button onClick={decreaseFont} className="px-1 hover:underline">
              A-
            </button>
            <button onClick={resetFont} className="px-1 font-semibold hover:underline">
              A
            </button>
            <button onClick={increaseFont} className="px-1 hover:underline">
              A+
            </button>
          </div>

          {/* Language selector */}
          <select
            className="bg-transparent border-none outline-none cursor-pointer"
            value={locale}
            onChange={(e) => changeLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
        </div>
      </div>
    </div>
  );
}
