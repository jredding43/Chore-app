import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import { ChoreTemplate } from '../types/chore';
import { KidProfile } from '../types/kids';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const [kids, setKids] = useState<KidProfile[]>([]);
  const [chores, setChores] = useState<ChoreTemplate[]>([]);

  useEffect(() => {
    const load = async () => {
      const [k, c] = await Promise.all([
        db.kidProfiles.toArray(),
        db.choreTemplates.toArray(),
      ]);
      setKids(k);
      setChores(c);
    };
    load();
  }, []);

  return (
  <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
    <div className="flex justify-between items-center mb-10">
      <h1 className="text-3xl font-bold text-green-400">📅 Weekly Chore Calendar</h1>
      <button
        onClick={() => navigate('/')}
        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl shadow"
      >
        ← Back to Home
      </button>
    </div>

    <div className="space-y-10">
      {kids.map((kid) => (
        <section key={kid.id} className="bg-gray-800 rounded-3xl p-6 shadow-2xl">
          {/* Kid Header */}
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-green-300">{kid.name}</h2>
          </div>

          {/* Weekly Chore Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {days.map((day) => {
              const dayChores = chores.filter(
                (chore) => chore.weeklyAssignment?.[day] === kid.id
              );

              return (
                <div
                  key={day}
                  className="bg-gray-700 rounded-2xl p-4 border border-gray-600 shadow-md"
                >
                  <h3 className="font-semibold text-yellow-300 text-center mb-2">{day}</h3>
                  {dayChores.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center italic">No chores</p>
                  ) : (
                    <ul className="space-y-1">
                      {dayChores.map((chore) => (
                        <li
                          key={chore.id}
                          className="bg-indigo-600 text-white text-sm px-3 py-1 rounded-md shadow-sm"
                        >
                          {chore.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  </main>
);

};

export default Calendar;
