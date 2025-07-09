// src/pages/Home.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db';
import type { KidProfile } from '../types/kids';

const Home: React.FC = () => {
  const [kids, setKids] = useState<KidProfile[]>([]);

  useEffect(() => {
    const loadProfiles = async () => {
      const profiles = await db.kidProfiles.toArray();
      setKids(profiles);
    };
    loadProfiles();
  }, []);

const resetDatabase = async () => {
  // Clear all pending rewards
  await db.pendingRewards.clear();

  // Clear all chore status records (resets chore completions)
  await db.choreStatuses.clear();

  // Reset points and stats for all kids
  const allKids = await db.kidProfiles.toArray();
  for (const kid of allKids) {
    await db.kidProfiles.update(kid.id, {
      points: 0,
      lifetimePoints: 0,
      completedChores: 0,
      completedWorkbooks: 0,
      rejectedChores: 0,
      rejectedWorkbooks: 0,
      notCompletedChores: 0,
    });
  }

  window.location.reload();
};



  return (
  <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 flex flex-col items-center">
    <h1 className="text-4xl font-extrabold text-green-400 mb-10 tracking-tight"> Dashboard</h1>

    {/* Profile Selection */}
    <section className="w-full max-w-3xl bg-gray-800 rounded-3xl p-6 shadow-xl mb-8">
      <h2 className="text-2xl font-semibold text-green-400 mb-4"> Choose Your Profile</h2>
      <div className="grid grid-cols-2 gap-6">
        {kids.length === 0 ? (
          <p className="text-white col-span-2 text-center">
            No profiles yet. Add them in the Profile Manager.
          </p>
        ) : (
          kids.map(kid => (
            <Link to={`/profile/${kid.id}`} key={kid.id}>
              <div className="bg-gray-700 hover:bg-gray-600 transition rounded-2xl p-6 text-center shadow-sm cursor-pointer">
                <p className="text-4xl mb-2">{kid.avatar || ''}</p>
                <p className="text-lg font-bold text-white">{kid.name}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>

    {/* Calendar Access */}
    <section className="w-full max-w-3xl bg-gray-800 rounded-3xl p-6 shadow-xl mb-8">
      <h2 className="text-2xl font-semibold text-blue-400 mb-4">📅 Chore Calendar</h2>
      <Link to="/calendar">
        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white text-lg font-medium py-3 rounded-xl transition">
          View Calendar
        </button>
      </Link>
    </section>

    {/* Management Access */}
    <section className="w-full max-w-3xl bg-gray-800 rounded-3xl p-6 shadow-xl mb-8">
      <h2 className="text-2xl font-semibold text-orange-400 mb-4">🛠️ Management</h2>
      <Link to="/chorelist">
        <button className="w-full bg-orange-600 hover:bg-orange-500 text-white text-lg font-medium py-3 rounded-xl transition">
          Go to Manager Page
        </button>
      </Link>
    </section>

    {/* Reset Button */}
    <button
      onClick={resetDatabase}
      className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-xl transition mt-2 shadow hidden"
    >
      🧹 Reset Database
    </button>
  </main>
);

};

export default Home;
