import React from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { path: '/', label: ' Home' },
  { path: '/chorelist', label: ' Manager' },
  { path: '/review', label: ' Review Chores' },
  { path: '/workbook', label: ' Review Workbooks' },
  { path: '/extrachores', label: ' Extra Chores' },
  { path: '/rewards', label: 'Rewards' },
  { path: '/store', label: 'Store Manager' },
];

export const Navigation: React.FC = () => {
  return (
    <nav className="bg-gray-900 text-white px-4 py-3 flex justify-center space-x-4 border-b border-gray-700 sticky top-0 z-50">
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
    </nav>
  );
};
