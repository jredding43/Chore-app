import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import { KidProfile } from '../types/kids';
import { WoodBook, WorkbookAssignment, KidWorkbookPointOverride } from '../types/workbooks';
import { Navigation } from '../components/Navigation';

const todayDate = new Date().toDateString();

const ReviewWorkbook: React.FC = () => {
  const navigate = useNavigate();
  const [workbooks, setWorkbooks] = useState<WoodBook[]>([]);
  const [kids, setKids] = useState<KidProfile[]>([]);
  const [assignments, setAssignments] = useState<WorkbookAssignment[]>([]);
  const [overrides, setOverrides] = useState<KidWorkbookPointOverride[]>([]);


  useEffect(() => {
    const load = async () => {
      const [wb, k, a, o] = await Promise.all([
        db.woodBooks.toArray(),
        db.kidProfiles.toArray(),
        db.workbookAssignments.where('date').equals(todayDate).toArray(),
        db.kidWorkbookPointOverrides.toArray(), 
      ]);
      setWorkbooks(wb);
      setKids(k);
      setAssignments(a);
      setOverrides(o); 
    };
    load();
  }, []);


  const updateStatus = async (
    assignment: WorkbookAssignment,
    status: 'approved' | 'rejected'
  ) => {
    const updated = { ...assignment, status };
    await db.workbookAssignments.put(updated);

    const kid = await db.kidProfiles.get(assignment.kidId);
    const book = await db.woodBooks.get(assignment.workBookId);
    if (!kid || !book) return;

    if (status === 'approved') {
      let pointsToAward = 0;

      const override = await db.kidWorkbookPointOverrides
        .where({ kidId: kid.id, workBookId: book.id })
        .first();

      if (override) {
        pointsToAward = override.points;
      } else {
        const input = prompt(`How many points should ${kid.name} get for ${book.title}?`);
        const parsed = parseInt(input ?? '');
        if (!isNaN(parsed)) {
          pointsToAward = parsed;
          // Optionally save it as a new override for the future
          await db.kidWorkbookPointOverrides.add({
            kidId: kid.id,
            workBookId: book.id,
            points: parsed,
          });
        } else {
          alert("Invalid point value. No points awarded.");
          return;
        }
      }

      await db.kidProfiles.update(kid.id, {
        points: kid.points + pointsToAward,
        completedWorkbooks: (kid.completedWorkbooks || 0) + 1,
        lifetimePoints: (kid.lifetimePoints || 0) + pointsToAward,
      });

      // (Optional) save the points awarded into the assignment itself
      await db.workbookAssignments.update(assignment.id, {
        points: pointsToAward,
      });
    }


    setAssignments(await db.workbookAssignments.where('date').equals(todayDate).toArray());
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 space-y-6">

      {/* Top Navigation */}
      <div className="mb-4">
        <Navigation />
      </div>

      {/*  Page Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">

        {/*  Sidebar Summary */}
        <aside className="bg-gray-800 rounded-3xl p-6 shadow-2xl text-center">
          <h1 className="text-2xl font-bold text-green-400 mb-4">Review Workbooks</h1>
          <p className="text-sm text-gray-300 mb-2">Today: {todayDate}</p>

          <div className="text-white text-sm mt-6 space-y-2">
            <p>
              Submissions: <span className="text-yellow-300 font-bold">{assignments.length}</span>
            </p>
            <p>
              Kids Involved: <span className="text-blue-400 font-bold">{[...new Set(assignments.map(a => a.kidId))].length}</span>
            </p>
          </div>

          {/* Points Overview */}
          <div className="mt-10 space-y-6 text-sm text-left">
            <div className="bg-gray-700 p-4 rounded-xl">
              <h2 className="text-lg text-pink-400 font-bold mb-2">Keira's Workbook Points</h2>
              <ul className="space-y-1 text-white">
                <li>📘 Math: <span className="text-yellow-300 font-semibold">10 pts</span></li>
                <li>📗 Reading: <span className="text-yellow-300 font-semibold">5 pts</span></li>
                <li>📙 Writing: <span className="text-yellow-300 font-semibold">5 pts</span></li>
              </ul>
            </div>

            <div className="bg-gray-700 p-4 rounded-xl">
              <h2 className="text-lg text-sky-400 font-bold mb-2">Eastyn's Workbook Points</h2>
              <ul className="space-y-1 text-white">
                <li>📘 Math: <span className="text-yellow-300 font-semibold">5 pts</span></li>
                <li>📗 Reading: <span className="text-yellow-300 font-semibold">5 pts</span></li>
                <li>📙 Writing: <span className="text-yellow-300 font-semibold">10 pts</span></li>
              </ul>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="space-y-4 mt-10">
            <button
              onClick={() => navigate('/review')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl shadow w-full"
            >
              ← Back to Chores
            </button>
            <button
              onClick={() => navigate('/extrachores')}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-xl shadow w-full"
            >
              Next ➜
            </button>
          </div>
        </aside>

        {/* 📘 Main Panel */}
        <section className="space-y-6">
          {assignments.length === 0 ? (
            <div className="bg-gray-800 rounded-3xl p-6 shadow-xl text-center">
              <p className="text-gray-400 text-lg py-10">No workbook submissions today 🎉</p>
            </div>
          ) : (
            assignments.map(a => {
              const kid = kids.find(k => k.id === a.kidId);
              const book = workbooks.find(w => w.id === a.workBookId);
              if (!kid || !book) return null;

              const override = overrides.find(o => o.kidId === kid.id && o.workBookId === book.id); 

              let bg = 'bg-gray-700';
              let label = ' Pending';
              if (a.status === 'approved') {
                bg = 'bg-green-600';
                label = ' Approved';
              } else if (a.status === 'rejected') {
                bg = 'bg-red-600';
                label = ' Rejected';
              } else if (a.status === 'submitted') {
                bg = 'bg-yellow-600';
                label = ' Submitted';
              }

              return (
                <div key={a.id} className={`rounded-xl p-4 shadow ${bg}`}>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    {/* 📘 Info */}
                    <div>
                      <p className="text-lg font-bold text-white">
                        {kid.avatar} {kid.name} — <span className="text-indigo-300">{book.title}</span>
                      </p>
                      <p className="text-sm text-white">
                        {override?.points ?? book.points} pts • {label}
                      </p>
                    </div>

                    {/* ✅❌ Buttons */}
                    {(!a.status || a.status === 'pending') && (
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

export default ReviewWorkbook;
