
import React from 'react';

interface HeaderProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, onLogout }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-6 sm:p-8 text-center relative shadow-lg">
      {isLoggedIn && (
        <div className="absolute top-4 left-4 flex items-center gap-3 bg-white/20 backdrop-blur-sm p-2 rounded-full">
          <span className="font-bold text-sm">מרצה</span>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-3 rounded-full transition-colors"
          >
            יציאה
          </button>
        </div>
      )}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-shadow-lg tracking-tight">🎓 מערכת מבחן SPSS</h1>
      <p className="mt-2 text-lg opacity-90">מערכת משולבת לניהול מבחנים והערכת סטודנטים</p>
    </div>
  );
};

export default Header;
