import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import { KidProfile } from '../types/kids';
import { ExtraChoreTemplate, ExtraChoreAssignment } from '../types/extrachores';
import { Navigation } from '../components/Navigation';

const todayDate = new Date().toDateString();

const ReviewExtraChores: React.FC = () => {
  const navigate = useNavigate();
  const [chores, setChores] = useState<ExtraChoreTemplate[]>([]);
  const [kids, setKids] = useState<KidProfile[]>([]);
  const [assignments, setAssignments] = useState<ExtraChoreAssignment[]>([]);

  useEffect(() => {
    const load = async () => {
      const [c, k, a] = await Promise.all([
        db.extraChoreTemplates.toArray(),
        db.kidProfiles.toArray(),
        db.extraChoreAssignments.where('date').equals(todayDate).toArray(),
      ]);
      setChores(c);
      setKids(k);
      setAssignments(a);
    };
    load();
  }, []);

  const updateStatus = async (
    assignment: ExtraChoreAssignment,
    status: 'approved' | 'rejected'
  ) => {
    const updated = { ...assignment, status };
    await db.extraChoreAssignments.put(updated);

    const kid = await db.kidProfiles.get(assignment.assignedTo);
    const chore = await db.extraChoreTemplates.get(assignment.choreId);
    if (!kid || !chore) return;

    if (status === 'approved') {
      await db.kidProfiles.update(kid.id, {
        points: kid.points + chore.points,
        lifetimePoints: (kid.lifetimePoints || 0) + chore.points,
        completedChores: (kid.completedChores || 0) + 1,
      });
    } else {
      await db.kidProfiles.update(kid.id, {
        rejectedChores: (kid.rejectedChores || 0) + 1,
      });
    }

    setAssignments(await db.extraChoreAssignments.where('date').equals(todayDate).toArray());
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 space-y-6">

     {/* Top Navigation */}
      <div className="mb-4">
        <Navigation />
      </div>

      {/* 🧱 Main Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">

        {/* 📋 Sidebar Summary */}
        <aside className="bg-gray-800 rounded-3xl p-6 shadow-2xl text-center">
          <h1 className="text-2xl font-bold text-yellow-400 mb-4">Review Extra Chores</h1>
          <p className="text-sm text-white mb-2">Today: {todayDate}</p>
          <div className="text-white text-sm mt-6 space-y-2">
            <p>Submissions: <span className="text-yellow-300 font-bold">{assignments.length}</span></p>
            <p>Kids Involved: <span className="text-blue-400 font-bold">{[...new Set(assignments.map(a => a.assignedTo))].length}</span></p>
          </div>
          <div className="space-y-4 mt-8">
            <button
              onClick={() => navigate('/workbook')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl shadow w-full"
            >
              ← Back
            </button>
          </div>
        </aside>

        {/* 📄 Main Review Panel */}
        <section className="space-y-6">
          {assignments.length === 0 ? (
            <div className="bg-gray-800 rounded-3xl p-6 shadow-xl text-center">
              <p className="text-white text-lg py-10">No extra chore submissions today </p>
            </div>
          ) : (
            assignments.map(a => {
              const kid = kids.find(k => k.id === a.assignedTo);
              const chore = chores.find(c => c.id === a.choreId);
              if (!kid || !chore) return null;

              let bg = 'bg-gray-700';
              let label = '⏳ Not Submitted';
              if (a.status === 'approved') {
                bg = 'bg-green-600'; label = '✅ Approved';
              } else if (a.status === 'rejected') {
                bg = 'bg-red-600'; label = '❌ Rejected';
              } else if (a.status === 'submitted' || a.status === 'pending') {
                bg = 'bg-yellow-600'; label = '📨 Submitted';
              }

              return (
                <div key={a.id} className={`rounded-xl p-4 shadow ${bg}`}>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    {/* Kid & Chore Info */}
                    <div>
                      <p className="text-lg font-bold text-white">
                        {kid.avatar} {kid.name} — <span className="text-yellow-300">{chore.title}</span>
                      </p>
                      <p className="text-sm text-white">{chore.points} pts • {label}</p>
                    </div>

                    {/* Review Actions */}
                    {(a.status === 'pending' || a.status === 'submitted') && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(a, 'approved')}
                          className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-lg"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => updateStatus(a, 'rejected')}
                          className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
};

export default ReviewExtraChores;
