import React from 'react';
import { Settings } from 'lucide-react';

function Header({ onSettingsClick }) {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white shadow-lg">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-3xl">💨</span>
          <h1 className="text-xl font-bold tracking-tight">The Fart App</h1>
        </div>
        <button
          onClick={onSettingsClick}
          className="p-2 rounded-full hover:bg-white/20 transition-colors btn-press"
          aria-label="Settings"
        >
          <Settings size={24} />
        </button>
      </div>
    </header>
  );
}

export default Header;
