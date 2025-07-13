import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { KidProfile } from '../types/kids';
import { db } from '../db';
import { RewardItem } from '../types/Rewards';

export const PointsStore: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [kid, setKid] = useState<KidProfile | null>(null);
  const [message, setMessage] = useState('');

  const rewardItems = useLiveQuery(() => db.rewardItems.toArray(), []);

  useEffect(() => {
    const fetchKid = async () => {
      if (!id) return;
      const result = await db.kidProfiles.get(id);
      if (result) {
        setKid(result);
      } else {
        setMessage('Kid not found.');
      }
    };
    fetchKid();
  }, [id]);

  const handleRedeem = async (item: RewardItem) => {
    if (!kid) return;
    const currentPoints = kid.points ?? 0;

    if (currentPoints >= item.cost) {
      const newPoints = currentPoints - item.cost;

      await db.kidProfiles.update(kid.id, { points: newPoints });
      setKid({ ...kid, points: newPoints });

      await db.pendingRewards.add({
        kidId: kid.id,
        rewardName: item.name,
        cost: item.cost,
        redeemedAt: new Date().toISOString(),
        redeemed: false,
        requestedForCashIn: false,
      });

      setMessage(`You redeemed "${item.name}" for ${item.cost} points!`);
    } else {
      setMessage(`Not enough points for "${item.name}".`);
    }
  };

  if (!kid) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-lg">Loading kid info...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 sm:p-10 flex flex-col items-center">
      <div className="w-full max-w-7xl bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-10">
        <h1 className="text-4xl font-extrabold text-green-400 mb-2 text-center drop-shadow">
          Points Store
        </h1>
        <p className="text-center text-white text-lg sm:text-xl mb-6">
          {kid.avatar || '🧒'} <span className="font-bold">{kid.name}</span> has{' '}
          <span className="text-yellow-300 font-bold">{kid.points ?? 0}</span> points.
        </p>

        {message && (
          <div className="text-center mb-6">
            <p className="bg-green-900 bg-opacity-40 text-green-300 font-semibold rounded-xl px-4 py-2 inline-block shadow">
              {message}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
          {rewardItems?.map(item => (
            <div
              key={item.id}
              className="bg-gray-700 rounded-2xl shadow-lg p-6 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300"
            >
              <h2 className="text-xl font-bold text-white">{item.name}</h2>
              <p className="text-sm text-gray-300 mb-2">{item.description}</p>
              <p className="text-yellow-300 font-bold text-lg">{item.cost} points</p>

              <button
                onClick={() => {
                  const confirmed = window.confirm("Are you sure you want to redeem this reward?");
                  if (confirmed) {
                    handleRedeem(item);
                  }
                }}
                disabled={(kid.points ?? 0) < item.cost}
                className="mt-4 px-4 py-2 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Purchase Reward
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => navigate(`/profile/${kid.id}`)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm transition"
          >
            ← Back to Profile
          </button>
        </div>
      </div>
    </div>
  );
};
