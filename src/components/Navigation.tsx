import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const links = [
  { path: '/', label: 'Home' },
  { path: '/chorelist', label: 'Manager' },
  { path: '/review', label: 'Review Chores' },
  { path: '/workbook', label: 'Review Workbooks' },
  { path: '/extrachores', label: 'Review Extra Chores' },
  { path: '/rewards', label: 'Review Rewards' },
  { path: '/store', label: 'Store Manager' },
];

export const Navigation: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-gray-900 text-white border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between md:justify-center">
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white focus:outline-none"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-4">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  isActive ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-3 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  isActive ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
};
