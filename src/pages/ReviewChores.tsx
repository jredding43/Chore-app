import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, ChoreStatus } from '../db';
import { ChoreTemplate } from '../types/chore';
import { KidProfile } from '../types/kids';
import { Navigation } from '../components/Navigation';


const ReviewChores: React.FC = () => {
  const navigate = useNavigate();
  const [chores, setChores] = useState<ChoreTemplate[]>([]);
  const [kids, setKids] = useState<KidProfile[]>([]);
  const [reviewStatus, setReviewStatus] = useState<{ [key: string]: 'completed' | 'rejected' | 'not completed'}>({});

  const todayKey = new Date().toLocaleDateString('en-US', { weekday: 'short' }); // "Mon", "Tue", etc.
  const todayDate = new Date().toDateString();

  const [rejectionReasons, setRejectionReasons] = useState<{ [key: string]: string }>({});


  useEffect(() => {
    const load = async () => {
      const [allChores, allKids, statuses] = await Promise.all([
        db.choreTemplates.toArray(),
        db.kidProfiles.toArray(),
        db.choreStatuses.where('date').equals(todayDate).toArray()
      ]);

      setChores(allChores);
      setKids(allKids);

      const statusMap: { [key: string]: 'completed' | 'rejected' | 'not completed' } = {};
      statuses.forEach(s => {
        statusMap[`${s.kidId}_${s.choreId}`] = s.status;
      });

      setReviewStatus(statusMap);
    };

    load();
  }, [todayDate]);

  const saveStatus = async (
    chore: ChoreTemplate,
    kidId: string,
    status: 'completed' | 'rejected' | 'not completed',
    reason?: string
  ) => {
    const id = `${kidId}_${chore.id}_${todayDate}`;
    const choreStatus: ChoreStatus = {
      id,
      kidId,
      choreId: chore.id,
      date: todayDate,
      status,
      reason,
    };
    await db.choreStatuses.put(choreStatus);
    setReviewStatus(prev => ({ ...prev, [`${kidId}_${chore.id}`]: status }));
  };


  const handleComplete = async (chore: ChoreTemplate, kidId: string) => {
  const kid = await db.kidProfiles.get(kidId);
  if (!kid) return;

  // Add bonus for Keira
  const bonus = kid.name === 'Keira' ? 5 : 0;
  const earnedPoints = chore.points + bonus;

  await db.kidProfiles.update(kidId, {
    points: kid.points + earnedPoints,
    lifetimePoints: (kid.lifetimePoints || 0) + earnedPoints,
    completedChores: (kid.completedChores || 0) + 1,
  });

  await saveStatus(chore, kidId, 'completed');
  setKids(await db.kidProfiles.toArray());
};


  const handleReject = async (chore: ChoreTemplate, kidId: string) => {
    const kid = await db.kidProfiles.get(kidId);
    if (!kid) return;

    const reason = rejectionReasons[`${kidId}_${chore.id}`] || '';
    await db.kidProfiles.update(kidId, {
      rejectedChores: (kid.rejectedChores || 0) + 1,
    });

    await saveStatus(chore, kidId, 'rejected', reason);
    setKids(await db.kidProfiles.toArray());
  };


  const handleNotCompleted = async (chore: ChoreTemplate, kidId: string) => {
    const kid = await db.kidProfiles.get(kidId);
    if (!kid) return;

    await db.kidProfiles.update(kidId, {
      notCompletedChores: (kid.notCompletedChores || 0) + 1,
      points: Math.max((kid.points || 0) - 1, 0), 
    });

    await saveStatus(chore, kidId, 'not completed');
    setKids(await db.kidProfiles.toArray());
  };


  // Group chores by assigned kid
  const choresByKid: { [kidId: string]: ChoreTemplate[] } = {};
  chores.forEach(chore => {
    const assignedKidId = chore.weeklyAssignment?.[todayKey];
    if (assignedKidId) {
      if (!choresByKid[assignedKidId]) choresByKid[assignedKidId] = [];
      choresByKid[assignedKidId].push(chore);
    }
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 space-y-6">

      {/* Top Navigation */}
      <div className="mb-4">
        <Navigation />
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        
        {/* Sidebar */}
        <aside className="bg-gray-800 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center">
          <h1 className="text-2xl font-bold text-green-400 mb-2">Review Chores</h1>
          <p className="text-sm text-gray-300 mb-1">{todayDate}</p>
          <p className="text-yellow-300 font-semibold mb-6">
            Chores Assigned Today: {Object.keys(choresByKid).length}
          </p>

          <div className="flex flex-col w-full gap-3 mt-auto">
            <button
              onClick={() => navigate('/chorelist')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl shadow w-full"
            >
              ← Back to Manager
            </button>
            <button
              onClick={() => navigate('/workbook')}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-xl shadow w-full"
            >
              Next ➜
            </button>
          </div>
        </aside>

        {/* Main Chore Review Section */}
        <section className="space-y-8">
          {kids
            .filter(kid => choresByKid[kid.id]?.length > 0)
            .map(kid => (
              <div key={kid.id} className="bg-gray-800 rounded-3xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-green-300 mb-4">
                  {kid.avatar} {kid.name}
                </h2>

                <ul className="space-y-4">
                  {choresByKid[kid.id].map(chore => {
                    const status = reviewStatus[`${kid.id}_${chore.id}`];
                    let bg = 'bg-gray-700';
                    let label = '';

                    if (status === 'completed') {
                      bg = 'bg-green-600'; label = '✅ Completed';
                    } else if (status === 'rejected') {
                      bg = 'bg-red-600'; label = '❌ Rejected';
                    } else if (status === 'not completed') {
                      bg = 'bg-orange-600'; label = '⚠️ Not Completed';
                    }

                    return (
                      <li key={chore.id} className={`p-4 rounded-xl shadow ${bg}`}>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">

                          {/* Chore Info */}
                          <div>
                            <p className="text-lg font-bold text-white">{chore.title}</p>
                            <p className="text-sm text-gray-300">{chore.points} pts</p>
                            {status && <p className="text-sm mt-1">{label}</p>}
                          </div>

                          {/* Actions + Rejection Note */}
                          {!status && (
                            <div className="flex flex-col gap-2 w-full sm:w-auto">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleComplete(chore, kid.id)}
                                  className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-lg text-sm"
                                >
                                  ✅ Complete
                                </button>
                                <button
                                  onClick={() => handleReject(chore, kid.id)}
                                  className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg text-sm"
                                >
                                  ❌ Reject
                                </button>
                                <button
                                  onClick={() => handleNotCompleted(chore, kid.id)}
                                  className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded-lg text-sm"
                                >
                                  ⚠️ Not Done
                                </button>
                              </div>

                              <textarea
                                placeholder="Reason for rejection..."
                                className="bg-gray-700 text-white p-2 rounded-lg text-sm resize-none min-h-[60px] w-full"
                                value={rejectionReasons[`${kid.id}_${chore.id}`] || ''}
                                onChange={(e) =>
                                  setRejectionReasons(prev => ({
                                    ...prev,
                                    [`${kid.id}_${chore.id}`]: e.target.value
                                  }))
                                }
                              />
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
        </section>
      </div>
    </main>

);

};

export default ReviewChores;
