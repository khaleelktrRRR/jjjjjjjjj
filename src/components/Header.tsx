import React from 'react';
import { User } from 'lucide-react';

interface HeaderProps {
  onAdminLoginClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAdminLoginClick }) => {
  return (
    <header className="w-full bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Muhimmath Library
          </h1>
          <button
            onClick={onAdminLoginClick}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
          >
            <User size={20} />
            <span className="hidden sm:inline">Admin Login</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
