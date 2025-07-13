import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { KidProfile } from '../types/kids';
import { ChoreTemplate } from '../types/chore';
import { db, PendingReward} from '../db';
import { WoodBook, WorkbookAssignment } from '../types/workbooks';
import { ExtraChoreTemplate, ExtraChoreAssignment } from '../types/extrachores';
import { useLiveQuery } from 'dexie-react-hooks';



const getTodayKey = (): string => {
  const keys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return keys[new Date().getDay()];
};

const todayDate = new Date().toDateString();

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [kid, setKid] = useState<KidProfile | null>(null);
  const [todaysChores, setTodaysChores] = useState<ChoreTemplate[]>([]);
  const [choreStatusMap, setChoreStatusMap] = useState<{[choreId: number]: { status: 'completed' | 'rejected' | 'not completed'; reason?: string };}>({});
  const [extraChores, setExtraChores] = useState<ExtraChoreTemplate[]>([]);
  const [extraAssignments, setExtraAssignments] = useState<ExtraChoreAssignment[]>([]);
  const [workbooks, setWorkbooks] = useState<WoodBook[]>([]);
  const [assignments, setAssignments] = useState<WorkbookAssignment[]>([]);

  const [allExtraAssignmentsToday, setAllExtraAssignmentsToday] = useState<ExtraChoreAssignment[]>([]);

  const pendingRewards = useLiveQuery(() => {
    if (!kid) return Promise.resolve([] as PendingReward[]);
    return db.pendingRewards.where('kidId').equals(kid.id).toArray();
  }, [kid?.id]); 

  const [checkedChores, setCheckedChores] = useState<Record<number, boolean>>({});

  const [authorized, setAuthorized] = useState(false);
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const profile = await db.kidProfiles.get(id);
      setKid(profile || null);

      const allChores = await db.choreTemplates.toArray();
      const todayKey = getTodayKey();
      const assignedChores = allChores.filter(
        chore => chore.weeklyAssignment?.[todayKey] === id
      );
      setTodaysChores(assignedChores);

      const extras = await db.extraChoreTemplates.toArray();
      const allAssignmentsToday = await db.extraChoreAssignments
        .where('date')
        .equals(todayDate)
        .toArray();

      setExtraChores(extras);
      setAllExtraAssignmentsToday(allAssignmentsToday);
      setExtraAssignments(allAssignmentsToday.filter(a => a.assignedTo === id));


      const books = await db.woodBooks.toArray();
      setWorkbooks(books);

      const kidAssignments = await db.workbookAssignments
        .where({ kidId: id })
        .filter(a => a.date === todayDate)
        .toArray();
      setAssignments(kidAssignments);

      const statuses = await db.choreStatuses
        .where({ kidId: id })
        .and(s => s.date === todayDate)
        .toArray();

      const map: {
        [choreId: number]: { status: 'completed' | 'rejected' | 'not completed'; reason?: string };
        } = {};
        statuses.forEach(s => {
          map[s.choreId] = { status: s.status, reason: s.reason }; 
      });

      setChoreStatusMap(map);

      const initialChecked: Record<number, boolean> = {};
        statuses.forEach((s) => {
          initialChecked[s.choreId] = s.status === 'completed';
      });
      setCheckedChores(initialChecked);
    };

    load();
  }, [id]);

useEffect(() => {
  const fixPins = async () => {
    const kids = await db.kidProfiles.toArray();
    for (const kid of kids) {
      let pin = '9999';
      const name = kid.name.toLowerCase();

      if (name === 'keira') pin = '1203';
      else if (name === 'eastyn') pin = '0628';

      // Always update to ensure pins are set correctly
      await db.kidProfiles.update(kid.id, { pin });
      console.log(`Set pin for ${kid.name}: ${pin}`);
    }
  };

  fixPins();
}, []);

const handleSubmitWorkbook = async (bookId: number) => {
    if (!id) return;

    const alreadySubmitted = assignments.find(
      a => a.workBookId === bookId && a.date === todayDate && a.status !== 'rejected'
    );
    if (alreadySubmitted) return;

    const kidProfile = await db.kidProfiles.get(id);

    // Check for override
    const override = await db.kidWorkbookPointOverrides
      .where({ kidId: id, workBookId: bookId })
      .first();

    const pointsToAward = override?.points ?? 0;

    const newAssignment: WorkbookAssignment = {
      id: Date.now(),
      workBookId: bookId,
      kidId: id,
      date: todayDate,
      status: 'pending',
      points: pointsToAward,
    };

    await db.workbookAssignments.add(newAssignment);

    // Optionally update profile stats now or wait until approval
    if (kidProfile) {
      await db.kidProfiles.update(id, {
        lifetimePoints: (kidProfile.lifetimePoints ?? 0) + pointsToAward,
      });
    }

    const updated = await db.workbookAssignments
      .where({ kidId: id })
      .filter(a => a.date === todayDate)
      .toArray();

    setAssignments(updated);
  };


  const handleSubmitExtraChore = async (choreId: number) => {
    if (!id) return;

    const allTodayAssignments = await db.extraChoreAssignments
      .where('date')
      .equals(todayDate)
      .filter(a => a.choreId === choreId)
      .toArray();

    const alreadySubmittedByKid = allTodayAssignments.find(a => a.assignedTo === id && a.status !== 'rejected');
    if (alreadySubmittedByKid) return;

    const approvedOrPendingByOthers = allTodayAssignments.find(
      a => a.assignedTo !== id && a.status !== 'rejected'
    );

    const rejectedByOthers = allTodayAssignments.find(
      a => a.assignedTo !== id && a.status === 'rejected'
    );

    // If another kid already submitted and it wasn't rejected → block it
    if (approvedOrPendingByOthers) return;

    // If rejected by another kid → mark as partial points
    const isPartial = !!rejectedByOthers;

    const newAssignment: ExtraChoreAssignment = {
      id: Date.now(),
      choreId,
      assignedTo: id,
      date: todayDate,
      status: 'pending',
      timestamp: new Date().toISOString(),
      ...(isPartial ? { partialPoints: true } : {})
    };

    await db.extraChoreAssignments.add(newAssignment);
    const updated = await db.extraChoreAssignments
      .where({ assignedTo: id })
      .filter(a => a.date === todayDate)
      .toArray();
    setExtraAssignments(updated);
  };


  if (!kid) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6 text-center">
        <div>
          <p className="text-xl text-gray-700 mb-4"> Profile not found.</p>
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 underline text-base hover:text-indigo-800"
          >
            ← Back to Home
          </button>
        </div>
      </main>
    );
  }

const toggleChoreCheck = (choreId: number) => {
  setCheckedChores(prev => ({
    ...prev,
    [choreId]: !prev[choreId],
  }));
};



  if (!authorized) {
  return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-sm text-center space-y-4">
        <h1 className="text-2xl font-bold text-yellow-300">Enter PIN for {kid.name}</h1>
        <input
          type="password"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-center"
          placeholder="Enter PIN"
        />
        <button
          onClick={() => {
            if (pinInput === kid.pin) {
              setAuthorized(true);
            } else {
              alert('Incorrect PIN');
            }
          }}
          className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg mb-5"
        >
          Unlock Profile
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg"
        >
          ← Back to Home
        </button>

      </div>
    </main>
  );
}



  return (
    <>
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 p-6">
      {/* Sidebar */}
      <aside className="bg-gray-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        <div className="text-6xl mb-3">{kid.avatar || ''}</div>
        <h1 className="text-2xl font-bold text-green-400">{kid.name}</h1>

        <p className="mt-2 text-lg text-white">
          ⭐ <span className="font-bold text-yellow-400">{kid.points}</span> Points
        </p>

        <div className="mt-6 w-full grid grid-cols-1 gap-3 text-sm text-white">
          {[
            { label: 'Lifetime', value: kid.lifetimePoints ?? 0, bg: 'bg-indigo-700' },
            { label: 'Chores Done', value: kid.completedChores ?? 0, bg: 'bg-green-700' },
            { label: 'Books Done', value: kid.completedWorkbooks ?? 0, bg: 'bg-green-600' },
            { label: 'Rejected', value: kid.rejectedWorkbooks ?? 0, bg: 'bg-red-600' },
            { label: 'Not Completed', value: kid.notCompletedChores ?? 0, bg: 'bg-orange-600' },
          ].map((stat, idx) => (
            <div key={idx} className={`${stat.bg} p-3 rounded-xl text-center`}>
              <p className="font-bold text-white">{stat.value}</p>
              <p className="mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/*  Pending Rewards Section */}
        {pendingRewards && pendingRewards.length > 0 && (
        <div className="mt-8 w-full text-white">
          <h2 className="text-xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
             Pending Rewards
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {pendingRewards
              .filter((r) => !r.redeemed)
              .map((reward) => (
                <div
                  key={reward.id}
                  className="bg-gradient-to-br from-gray-700 to-gray-800 p-4 rounded-2xl shadow-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-lg font-semibold text-white">{reward.rewardName}</p>
                      <p className="text-sm text-yellow-400">{reward.cost} pts</p>
                    </div>
                  </div>

                  {reward.requestedForCashIn ? (
                    <span className="text-yellow-400 font-semibold">⏳ Pending</span>
                  ) : (
                    <button
                      onClick={async () => {
                        const confirmed = window.confirm("Are you sure you want to cash in this reward?");
                        if (confirmed) {
                          await db.pendingRewards.update(reward.id!, { requestedForCashIn: true });
                        }
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all duration-200"
                    >
                      Cash In
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}


        <div className="mt-25">
          <button
            onClick={() => navigate(`/store/${kid.id}`)}
            className="mt-6 bg-yellow-500 text-black px-6 py-2 rounded-xl hover:bg-yellow-600 transition"
          >
            🛍️ Go to Points Store
          </button>

          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition"
          >
            ← Back to Home
          </button>
        </div>
      </aside>



      {/* Main Panel */}
      <section className="space-y-8">
        {/* Chores */}
        <div className="bg-gray-800 rounded-3xl p-6 shadow-xl">
          <h2 className="text-2xl font-semibold text-green-400 mb-4">Today's Chores</h2>
          {todaysChores.length === 0 ? (
            <p className="text-gray-400">🎉 No chores today!</p>
          ) : (
            <ul className="space-y-3">
              {todaysChores.map(chore => {
                const statusEntry = choreStatusMap[chore.id];
                const status = statusEntry?.status;

                const bg =
                  status === 'completed' ? 'bg-green-600' :
                  status === 'rejected' ? 'bg-red-600' :
                  status === 'not completed' ? 'bg-orange-600' :
                  'bg-gray-700';

                const statusText =
                  status === 'completed' ? ' Completed' :
                  status === 'rejected' ? ' Rejected' :
                  status === 'not completed' ? ' Not Completed' :
                  '';


                return (
                  <li
                    key={chore.id}
                    className={`flex justify-between items-center p-4 rounded-xl ${bg} transition-all duration-200`}
                    onClick={() => toggleChoreCheck(chore.id)}
                  >
                    <div>
                      <p className={`text-lg font-bold ${checkedChores[chore.id] ? 'line-through text-gray-300' : 'text-white'}`}>
                        <input
                          type="checkbox"
                          checked={!!checkedChores[chore.id]}
                          onChange={() => toggleChoreCheck(chore.id)}
                          className="mr-2 accent-green-400"
                        />
                        {chore.title}
                      </p>
                      {status && (
                        <>
                          <p className="text-sm text-white">{statusText}</p>
                          {status === 'rejected' && statusEntry.reason && (
                            <p className="text-sm text-yellow-300 italic mt-1">“{statusEntry.reason}”</p>
                          )}
                        </>
                      )}
                    </div>
                    <span className="text-yellow-300 font-bold">{chore.points} pts</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Workbooks */}
        <div className="bg-gray-800 rounded-3xl p-6 shadow-xl">
          <h2 className="text-2xl font-semibold text-blue-400 mb-4">📘 Workbooks</h2>
          <p className="text-xs text-red-400">5 Pages minimum for submission</p>
          <p className="text-xs text-red-400 mb-4">Must score 80% or higher for points!</p>
          {workbooks.length === 0 ? (
            <p className="text-gray-400">No workbooks available.</p>
          ) : (
            <ul className="space-y-3">
              {workbooks.map(book => {
                const assignment = assignments.find(a => a.workBookId === book.id);
                const status = assignment?.status ?? 'pending';

                let bg = 'bg-gray-700';
                let label = '';
                if (status === 'approved') {
                  bg = 'bg-green-600'; label = '✅ Completed';
                } else if (status === 'rejected') {
                  bg = 'bg-red-600'; label = '❌ Rejected';
                } else if (status === 'submitted') {
                  bg = 'bg-yellow-600'; label = '📨 Submitted';
                } else {
                  label = '⏳ Pending';
                }

                return (
                  <li key={book.id} className={`flex justify-between items-center p-4 rounded-xl ${bg}`}>
                    <div>
                      <p className="text-lg font-bold text-white">{book.title}</p>
                      {assignment && <p className="text-sm text-white">{label}</p>}
                    </div>

                    {!assignment && (
                      <button
                        onClick={() => handleSubmitWorkbook(book.id)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1 rounded-lg"
                      >
                        Submit
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Extra Chores */}
       <div className="bg-gray-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-2xl font-semibold text-yellow-400 mb-4">✨ Extra Chores (Optional)</h2>
        <p className="text-sm text-gray-300 mb-4">Do these for bonus points!</p>
        {extraChores.length === 0 ? (
          <p className="text-gray-400">No extra chores available today.</p>
        ) : (
          <ul className="space-y-3">
            {extraChores.map(chore => {
              const thisKidAssignment = extraAssignments.find(a => a.choreId === chore.id);
              const siblingAssignment = allExtraAssignmentsToday.find(
                a => a.choreId === chore.id && a.assignedTo !== id
              );

              // Determine status for display
              let status = 'not submitted';
              if (thisKidAssignment) {
                status = thisKidAssignment.status;
              } else if (siblingAssignment?.status === 'approved') {
                status = 'sibling-approved';
              } else if (siblingAssignment && siblingAssignment.status !== 'rejected') {
                status = 'sibling-submitted';
              }

              // Determine background and label
              let bg = 'bg-gray-700';
              let label = '';
              if (status === 'approved') {
                bg = 'bg-green-600'; label = '✅ Completed';
              } else if (status === 'rejected') {
                bg = 'bg-red-600'; label = '❌ Rejected';
              } else if (status === 'submitted' || status === 'pending') {
                bg = 'bg-yellow-600'; label = '📨 Submitted';
              } else if (status === 'sibling-submitted') {
                bg = 'bg-yellow-800'; label = '📨 Submission pending by sibling...';
              } else if (status === 'sibling-approved') {
                bg = 'bg-purple-700'; label = '✅ Completed by sibling';
              } else {
                label = '⏳ Not Submitted';
              }

              // Determine if current kid is allowed to submit
              const canSubmit = !thisKidAssignment && (
                !siblingAssignment || siblingAssignment.status === 'rejected'
              );

              return (
                <li key={chore.id} className={`flex justify-between items-center p-4 rounded-xl ${bg}`}>
                  <div>
                    <p className={`text-lg font-bold ${checkedChores[chore.id] ? 'line-through text-gray-300' : 'text-white'}`}>
                      <input
                        type="checkbox"
                        checked={!!checkedChores[chore.id]}
                        onChange={() => toggleChoreCheck(chore.id)}
                        className="mr-2 accent-green-400"
                      />
                      {chore.title}
                    </p>

                    <p className="text-sm mt-1">
                      <span className="text-yellow-300">
                        {thisKidAssignment?.partialPoints
                          ? `${Math.floor(chore.points / 2)} pts`
                          : `${chore.points} pts`}
                      </span>
                      {thisKidAssignment?.partialPoints && (
                        <span className="text-yellow-400 italic"> (Partial Credit)</span>
                      )}
                    </p>

                    {label && <p className="text-sm text-white">{label}</p>}
                  </div>

                  {canSubmit && (
                    <button
                      onClick={() => handleSubmitExtraChore(chore.id)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1 rounded-lg"
                    >
                      Submit
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      </section>
    </main>
    </>
  );
};

export default ProfilePage;