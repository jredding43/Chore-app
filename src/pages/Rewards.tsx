import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, PendingReward } from '../db';
import { KidProfile } from '../types/kids';
import { Navigation } from '../components/Navigation';

const RewardsPage: React.FC = () => {
  const navigate = useNavigate();
  const [pendingRewards, setPendingRewards] = useState<PendingReward[]>([]);
  const [kidsMap, setKidsMap] = useState<Record<string, KidProfile>>({});
  const [selectedKidId, setSelectedKidId] = useState('');
  const [pointsToAdd, setPointsToAdd] = useState(0);


  useEffect(() => {
    const fetchData = async () => {
      const rewards = await db.pendingRewards.toArray();
      setPendingRewards(rewards);

      const allKids = await db.kidProfiles.toArray();
      const kidMap = Object.fromEntries(allKids.map((k) => [k.id, k]));
      setKidsMap(kidMap);
    };

    fetchData();
  }, []);

  const markAsRedeemed = async (id: number) => {
    const now = new Date().toISOString();
    await db.pendingRewards.update(id, { redeemed: true, redeemedAt: now });
    setPendingRewards((prev) =>
      prev.map((r) => (r.id === id ? { ...r, redeemed: true, redeemedAt: now } : r))
    );
  };


  // Group redeemed rewards by kid
  const redeemedByKid: Record<string, PendingReward[]> = {};
  pendingRewards
    .filter((r) => r.redeemed)
    .forEach((r) => {
      if (!redeemedByKid[r.kidId]) redeemedByKid[r.kidId] = [];
      redeemedByKid[r.kidId].push(r);
    });

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 space-y-6">
      <div className="mb-4">
        <Navigation />
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        {/* 📋 Sidebar: Redeemed Rewards */}
        <aside className="bg-gray-800 rounded-3xl p-6 shadow-2xl text-center">
          <h1 className="text-2xl font-bold text-green-400 mb-4"> Completed Rewards</h1>

          {Object.keys(redeemedByKid).length === 0 ? (
            <p className="text-sm text-gray-300">No rewards have been marked as redeemed yet.</p>
          ) : (
            Object.entries(redeemedByKid).map(([kidId, rewards]) => {
              const kid = kidsMap[kidId];
              return (
                <div key={kidId} className="bg-gray-700 p-4 rounded-xl mb-4 text-left">
                  <h2 className="text-lg text-yellow-300 font-bold mb-2">
                    {kid?.avatar} {kid?.name}
                  </h2>
                  <ul className="text-sm text-white space-y-1">
                    {rewards.map((r) => (
                      <li key={r.id}>
                         {r.rewardName} <span className="text-yellow-300">({r.cost} pts)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}

          <hr className="my-4 border-gray-600" />

          <h2 className="text-lg font-bold text-white mb-2">Add Points</h2>

          <div className="space-y-2">
            <select
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600"
              onChange={(e) => setSelectedKidId(e.target.value)}
              value={selectedKidId}
            >
              <option value="">Select Kid</option>
              {Object.values(kidsMap).map((kid) => (
                <option key={kid.id} value={kid.id}>
                  {kid.avatar} {kid.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Enter points"
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600"
              value={pointsToAdd}
              onChange={(e) => setPointsToAdd(parseInt(e.target.value))}
            />

            <button
              onClick={async () => {
                if (!selectedKidId || isNaN(pointsToAdd)) return;
                const kid = kidsMap[selectedKidId];
                const updatedPoints = (kid?.points ?? 0) + pointsToAdd;

                await db.kidProfiles.update(selectedKidId, { points: updatedPoints });
                setKidsMap({ ...kidsMap, [selectedKidId]: { ...kid, points: updatedPoints } });
                setPointsToAdd(0);
              }}
              className="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm"
            >
              Add Points
            </button>
          </div>


          <button
            onClick={() => navigate('/')}
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl w-full"
          >
            ← Back to Home
          </button>
        </aside>

        {/*  Main: Pending Redemptions */}
        <section className="space-y-6">
          <h1 className="text-3xl font-bold text-yellow-300"> Rewards Ready for Manager Approval</h1>

          {pendingRewards.filter((r) => !r.redeemed && r.requestedForCashIn).length === 0 ? (
            <div className="bg-gray-800 rounded-3xl p-6 shadow-xl text-center">
              <p className="text-gray-400 text-lg py-10">No rewards currently being cashed in.</p>
            </div>
          ) : (
            pendingRewards
            .filter((r) => !r.redeemed && r.requestedForCashIn)
            .map((reward) => {
                const kid = kidsMap[reward.kidId];
                return (
                  <div
                    key={reward.id}
                    className="bg-gray-800 p-4 rounded-xl shadow flex justify-between items-center"
                  >
                    <div>
                      <p className="text-lg font-bold text-white">{reward.rewardName}</p>
                      <p className="text-sm text-yellow-300">{reward.cost} pts</p>
                      {kid && (
                        <p className="text-sm text-gray-300 mt-1">
                          Redeemed by: {kid.avatar} {kid.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Requested on: {new Date(reward.redeemedAt).toLocaleString()}
                      </p>
                    </div>

                   <button
                    onClick={() => {
                      const confirmed = window.confirm("Are you sure you want to redeem this reward?");
                      if (confirmed) {
                        markAsRedeemed(reward.id!);
                      }
                    }}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Redeem Reward
                  </button>
                  </div>
                );
              })
          )}
        </section>
      </div>
    </main>
  );
};

export default RewardsPage;
