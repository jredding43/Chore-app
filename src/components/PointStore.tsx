import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { KidProfile } from '../types/kids';
import { db } from '../db';

type RewardItem = {
  id: number;
  name: string;
  description: string;
  image: string;
  cost: number;
};

const rewardItems: RewardItem[] = [
  { id: 1, name: 'Small Ice Cream', description: 'Small Icecream cone at Sandys', cost: 120, image: '🍦' }, // Every other day
  { id: 2, name: 'Small McFlurry/Milkshake', description: 'Small McFlurry or Milkshake', cost: 250, image: '🥤' }, // Once per week
  { id: 3, name: 'Medium McFlurry/Milkshake', description: 'Medium McFlurry or Milkshake', cost: 350, image: '🍧' }, // Once per week
  { id: 4, name: 'Movie Night', description: '1 Movie (you pick)', cost: 350, image: '🎬' }, // Once per week max
  { id: 5, name: 'Family Night', description: '1 Hour of family time (You pick)', cost: 300, image: '👨‍👩‍👧‍👦' },
  { id: 6, name: 'Pool 2 Hours', description: '2 Hours at pool', cost: 70, image: '🏊‍♂️' }, // Can do 2–3x/week
  { id: 7, name: 'Pool 4 Hours', description: '4 Hours at pool', cost: 100, image: '🏊‍♀️' }, // Daily reward possibility
  { id: 8, name: 'Camp Fire', description: 'Fire with smores', cost: 250, image: '🔥' }, // Weekend
  { id: 9, name: 'Free Time (Game/TV/Computer)', description: '1 hour of free time', cost: 150, image: '🕒' }, // Daily-ish
  { id: 10, name: 'Bike Ride', description: '3 mile bike ride', cost: 200, image: '🚴' }, // 2–3x per week
  { id: 11, name: 'Beach', description: '2 hours at beach', cost: 400, image: '🏖️' }, // Weekend reward
  { id: 12, name: 'Movie Theater', description: '1 movie theater (max 1 per month)', cost:1500, image: '🍿' }, // Save-up item
];


export const PointsStore: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [kid, setKid] = useState<KidProfile | null>(null);
  const [message, setMessage] = useState('');

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

    await db.pendingRewards.add({
    kidId: kid.id,
    rewardName: item.name,
    cost: item.cost,
    redeemedAt: new Date().toISOString()
    });


    if ((kid.points ?? 0) >= item.cost) {
      const newPoints = (kid.points ?? 0) - item.cost;
      await db.kidProfiles.update(kid.id, { points: newPoints });
      setKid({ ...kid, points: newPoints });
      setMessage(` You redeemed "${item.name}" for ${item.cost} points!`);
    } else {
      setMessage(` Not enough points for "${item.name}".`);
    }
  };

  if (!kid) {
    return <div className="p-6 text-center text-white text-lg">Loading...</div>;
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
        {rewardItems.map(item => (
          <div
            key={item.id}
            className="bg-gray-700 rounded-2xl shadow-lg p-6 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300"
          >

            <h2 className="text-xl font-bold text-white">{item.name}</h2>
            <p className="text-sm text-gray-300 mb-2">{item.description}</p>
            <p className="text-yellow-300 font-bold text-lg">{item.cost} points</p>
            <button
              onClick={() => handleRedeem(item)}
              disabled={(kid.points ?? 0) < item.cost}
              className="mt-4 px-4 py-2 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Redeem
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
