import React, { useEffect, useState } from 'react';
import { ChoreTemplate } from '../types/chore';
import { useNavigate } from 'react-router-dom';
import { KidProfile } from '../types/kids';
import { WoodBook } from '../types/workbooks';
import { db } from '../db';
import { ExtraChoreTemplate } from '../types/extrachores';
import { Navigation } from '../components/Navigation';

const daysOfWeek = [
  { label: 'Mon', key: 'Mon' },
  { label: 'Tue', key: 'Tue' },
  { label: 'Wed', key: 'Wed' },
  { label: 'Thu', key: 'Thu' },
  { label: 'Fri', key: 'Fri' },
  { label: 'Sat', key: 'Sat' },
  { label: 'Sun', key: 'Sun' },
];


const Manager: React.FC = () => {
  const navigate = useNavigate();
  const [chores, setChores] = useState<ChoreTemplate[]>([]);
  const [kids, setKids] = useState<KidProfile[]>([]);

  const [title, setTitle] = useState('');
  const [points, setPoints] = useState<number>(1);

  const [kidName, setKidName] = useState('');
  const [avatar, setAvatar] = useState('🧒');

  const [workbookTitle, setWorkbookTitle] = useState('');
  const [extraChoreTitle, setExtraChoreTitle] = useState('');

  const [authorized, setAuthorized] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const correctPin = '012018'; 

  const [editingChore, setEditingChore] = useState<ChoreTemplate | null>(null);
  const [editChoreTitle, setEditChoreTitle] = useState('');
  const [editChorePoints, setEditChorePoints] = useState(1);

  const [workbooks, setWorkbooks] = useState<WoodBook[]>([]);
  const [extraChores, setExtraChores] = useState<ExtraChoreTemplate[]>([]);
  const [editingWorkbookId, setEditingWorkbookId] = useState<number | null>(null);
  const [editingExtraChoreId, setEditingExtraChoreId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPoints, setEditPoints] = useState(1);

  const [editingKidId, setEditingKidId] = useState<string | null>(null);
  const [editKidName, setEditKidName] = useState('');
  const [editKidAvatar, setEditKidAvatar] = useState('🧒');
  const [editKidPin, setEditKidPin] = useState('');


  

  useEffect(() => {
    const load = async () => {
      setChores(await db.choreTemplates.toArray());
      setKids(await db.kidProfiles.toArray());
      setWorkbooks(await db.woodBooks.toArray());
      setExtraChores(await db.extraChoreTemplates.toArray());
    };
    load();
  }, []);

  const handleUpdateKid = async () => {
    if (!editingKidId || !editKidName.trim()) return;

    await db.kidProfiles.update(editingKidId, {
      name: editKidName.trim(),
      avatar: editKidAvatar,
      pin: editKidPin.trim(),
    });

    setKids(await db.kidProfiles.toArray());
    setEditingKidId(null);
    setEditKidName('');
    setEditKidAvatar('🧒');
    setEditKidPin('');
  };


  const handleEditChore = (chore: ChoreTemplate) => {
    setEditingChore(chore);
    setEditChoreTitle(chore.title);
    setEditChorePoints(chore.points);
  };

  const handleUpdateChore = async () => {
    if (!editingChore) return;

    await db.choreTemplates.update(editingChore.id, {
      title: editChoreTitle,
      points: editChorePoints,
    });

    setChores(await db.choreTemplates.toArray());
    setEditingChore(null);
    setEditChoreTitle('');
    setEditChorePoints(1);
  };

   const startEditWorkbook = (wb: WoodBook) => {
    setEditingWorkbookId(wb.id);
    setEditTitle(wb.title);
  };

  const updateWorkbook = async () => {
    if (!editTitle.trim() || !editingWorkbookId) return;
    await db.woodBooks.update(editingWorkbookId, {
      title: editTitle.trim(),
      points: editPoints,
    });
    setWorkbooks(await db.woodBooks.toArray());
    setEditingWorkbookId(null);
  };

  const deleteWorkbook = async (id: number, title: string) => {
    if (confirm(`Are you sure you want to delete workbook "${title}"?`)) {
      await db.woodBooks.delete(id);
      setWorkbooks(await db.woodBooks.toArray());
    }
  };

  const startEditExtraChore = (chore: ExtraChoreTemplate) => {
    setEditingExtraChoreId(chore.id);
    setEditTitle(chore.title);
    setEditPoints(chore.points);
  };

  const updateExtraChore = async () => {
    if (!editTitle.trim() || !editingExtraChoreId) return;
    await db.extraChoreTemplates.update(editingExtraChoreId, {
      title: editTitle.trim(),
      points: editPoints,
    });
    setExtraChores(await db.extraChoreTemplates.toArray());
    setEditingExtraChoreId(null);
  };

  const deleteExtraChore = async (id: number, title: string) => {
    if (confirm(`Are you sure you want to delete extra chore "${title}"?`)) {
      await db.extraChoreTemplates.delete(id);
      setExtraChores(await db.extraChoreTemplates.toArray());
    }
  };


  const handleAddChore = async () => {
    if (title.trim() === '' || points <= 0) return;

    const newChore: ChoreTemplate = {
      id: Date.now(),
      title: title.trim(),
      points,
      weeklyAssignment: {},
    };

    await db.choreTemplates.add(newChore);
    setChores(await db.choreTemplates.toArray());
    setTitle('');
    setPoints(1);
  };

  const handleDeleteChore = async (id: number) => {
    await db.choreTemplates.delete(id);
    setChores(await db.choreTemplates.toArray());
  };

  const handleExtraAddChore = async () => {
    if (extraChoreTitle.trim() === '' || points <= 0) return;

    const newExtraChore: ExtraChoreTemplate = {
      id: Date.now(),
      title: extraChoreTitle.trim(),
      points,
    };

    await db.extraChoreTemplates.add(newExtraChore);
    setExtraChores(await db.extraChoreTemplates.toArray());
    setExtraChoreTitle('');
    setPoints(1);
  };



    const handleAddKid = async () => {
      if (!kidName.trim()) return;

      // Assign a PIN based on the name (you can change the logic)
      let pin = '';
      if (kidName.trim().toLowerCase() === 'Keira') {
        pin = '1203';
      } else if (kidName.trim().toLowerCase() === 'Eastyn') {
        pin = '1428';
      } else {
        pin = '9999';
      }

      const newKid: KidProfile = {
        id: `kid_${Date.now()}`,
        name: kidName.trim(),
        points: 0,
        lifetimePoints: 0,
        completedChores: 0,
        rejectedChores: 0,
        completedWorkbooks: 0,
        rejectedWorkbooks: 0,
        notCompletedChores: 0,
        avatar,
        pin, 
      };

      await db.kidProfiles.add(newKid);
      setKids(await db.kidProfiles.toArray());
      setKidName('');
      setAvatar('');
    };

  const handleAddWorkbook = async () => {
    if (!workbookTitle.trim()) return;

    const newWorkbook: WoodBook = {
      id: Date.now(),
      title: workbookTitle.trim(),
      points,
    };

    await db.woodBooks.add(newWorkbook);
    setWorkbooks(await db.woodBooks.toArray());
    setWorkbookTitle('');
    setPoints(1);
  };


  const handleCycleAssignment = async (choreId: number, dayKey: string) => {
    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;

    const current = chore.weeklyAssignment?.[dayKey] || null;
    const kidIds = kids.map(k => k.id);
    const order = [null, ...kidIds];
    const nextIndex = (order.indexOf(current) + 1) % order.length;
    const next = order[nextIndex];

    const updatedAssignment = {
      ...chore.weeklyAssignment,
      [dayKey]: next,
    };

    await db.choreTemplates.update(choreId, { weeklyAssignment: updatedAssignment });
    setChores(await db.choreTemplates.toArray());
  };

  if (!authorized) {
  return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-sm text-center space-y-6">
        <h1 className="text-2xl font-bold text-yellow-300">Enter Manager PIN</h1>
        <input
          type="password"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-center"
          placeholder="Enter PIN"
        />

        <div className="space-y-4">
          <button
            onClick={() => {
              if (pinInput === correctPin) {
                setAuthorized(true);
              } else {
                alert('Incorrect PIN');
              }
            }}
            className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg mb-5"
          >
            Unlock
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl shadow"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </main>

  );
}

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">

    <div className="mb-10 rounded">
      <Navigation />
    </div>
    
  {/* Tabbed Input Sections */}
  <div className="grid gap-6 sm:grid-cols-2 max-w-6xl mx-auto mb-10">
    {[
      {
        title: '🧹 Add a New Chore',
        inputs: [
          { value: title, setter: setTitle, placeholder: 'Chore Title' },
          { value: points, setter: (e: unknown) => setPoints(Number(e)), placeholder: 'Points', type: 'number' },
        ],
        onSubmit: handleAddChore,
        buttonText: 'Add Chore',
      },
      {
        title: ' Add a Kid',
        inputs: [
          { value: kidName, setter: setKidName, placeholder: "Kid's Name" },
          {
            type: 'select',
            value: avatar,
            setter: setAvatar,
            options: [],
          },
        ],
        onSubmit: handleAddKid,
        buttonText: 'Add Kid',
      },
      {
        title: '📘 Add a Workbook',
        inputs: [
          { value: workbookTitle, setter: setWorkbookTitle, placeholder: 'Workbook Title' },
          { value: points, setter: (e: unknown) => setPoints(Number(e)), placeholder: 'Points', type: 'number' },
        ],
        onSubmit: handleAddWorkbook,
        buttonText: 'Add Workbook',
      },
      {
        title: ' Extra Chores',
        inputs: [
          { value: extraChoreTitle, setter: setExtraChoreTitle, placeholder: 'Extra Chore Title' },
          { value: points, setter: (e: unknown) => setPoints(Number(e)), placeholder: 'Points', type: 'number' },
        ],
        onSubmit: handleExtraAddChore,
        buttonText: 'Add Extra Chore',
      },
    ].map((section, i) => (
      <section key={i} className="bg-gray-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-green-300 mb-4 border-b border-gray-600 pb-2">{section.title}</h2>
        <div className="flex flex-col gap-4">
          {section.inputs.map((input, j) =>
            'options' in input && input.options ? (
              <select
                key={j}
                value={input.value}
                onChange={e => input.setter(e.target.value)}
                className="bg-gray-700 text-white border border-gray-600 rounded-xl p-2"
              >
                {input.options.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                key={j}
                type={input.type || 'text'}
                value={input.value}
                onChange={e => input.setter(e.target.value)}
                className="bg-gray-700 text-white border border-gray-600 rounded-xl p-2"
                placeholder={input.placeholder}
              />
            )
          )}
          <button
            onClick={section.onSubmit}
            className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl shadow"
          >
            {section.buttonText}
          </button>
        </div>
      </section>
    ))}
  </div>

  <section className="bg-gray-800 rounded-xl p-6 shadow-xl max-w-4xl mx-auto mb-10">
    <h2 className="text-xl font-semibold text-pink-300 mb-4">👧 Kids</h2>
    <ul className="space-y-4">
      {kids.map(kid => (
        <li key={kid.id} className="bg-gray-700 p-4 rounded-xl">
          {editingKidId === kid.id ? (
            <div className="space-y-3">
              <input
                className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
                value={editKidName}
                onChange={e => setEditKidName(e.target.value)}
                placeholder="Kid's Name"
              />
              <select
                className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
                value={editKidAvatar}
                onChange={e => setEditKidAvatar(e.target.value)}
              >
                {['🧒', '👧', '👦', '👶', '🧑'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <input
                className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
                value={editKidPin}
                onChange={e => setEditKidPin(e.target.value)}
                placeholder="New PIN"
              />
              <div className="flex gap-4">
                <button
                  onClick={handleUpdateKid}
                  className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingKidId(null)}
                  className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-bold">{kid.avatar} {kid.name}</p>
                <p className="text-sm text-gray-300">Points: {kid.points} | Lifetime: {kid.lifetimePoints}</p>
                <p className="text-sm text-gray-400">PIN: {kid.pin}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditingKidId(kid.id);
                    setEditKidName(kid.name);
                    setEditKidPin(kid.pin);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-sm"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${kid.name}?`)) {
                      db.kidProfiles.delete(kid.id).then(() => {
                        db.kidProfiles.toArray().then(setKids);
                      });
                    }
                  }}
                  className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg text-sm"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  </section>



  {/* Chores List */}
  <section className="bg-gray-800 rounded-3xl p-6 shadow-xl max-w-4xl mx-auto mb-10">
    <h2 className="text-2xl font-semibold text-green-300 mb-4">📝 Chores</h2>
    <ul className="space-y-4">
      {chores.map(chore => (
        <li key={chore.id} className="bg-gray-700 p-4 rounded-xl shadow">
          {editingChore?.id === chore.id ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editChoreTitle}
                onChange={e => setEditChoreTitle(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                placeholder="Chore Title"
              />
              <input
                type="number"
                value={editChorePoints}
                onChange={e => setEditChorePoints(parseInt(e.target.value))}
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                placeholder="Points"
              />
              <div className="flex flex-wrap gap-4 mt-2">
                <button
                  onClick={handleUpdateChore}
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingChore(null)}
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-bold">{chore.title}</p>
                  <p className="text-sm text-white">{chore.points} pts</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => handleEditChore(chore)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1 rounded-lg text-sm"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${chore.title}"?`)) {
                        handleDeleteChore(chore.id);
                      }
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-1 rounded-lg text-sm"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-400">Assign to Days:</p>
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {daysOfWeek.map(({ label, key }) => (
                    <button
                      key={key}
                      onClick={() => handleCycleAssignment(chore.id, key)}
                      className="bg-indigo-600 hover:bg-indigo-500 rounded-lg px-2 py-1 text-white text-sm font-bold"
                    >
                      {(() => {
                        const assignedId = chore.weeklyAssignment?.[key];
                        if (!assignedId) return label;
                        const kid = kids.find(k => k.id === assignedId);
                        return kid ? kid.name.charAt(0) : label;
                      })()}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  </section>



   <section className="bg-gray-800 rounded-xl p-6 shadow-xl max-w-4xl mx-auto mb-10">
        <h2 className="text-xl font-semibold text-green-300 mb-4">📘 Workbooks</h2>
        <ul className="space-y-4">
          {workbooks.map(wb => (
            <li key={wb.id} className="bg-gray-700 p-4 rounded-xl">
              {editingWorkbookId === wb.id ? (
                <div className="space-y-2">
                  <input
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                  />
                  <input
                    type="number"
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                    value={editPoints}
                    onChange={e => setEditPoints(Number(e.target.value))}
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={updateWorkbook}
                      className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingWorkbookId(null)}
                      className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold">{wb.title}</p>
                    <p className="text-sm">{wb.points} pts</p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => startEditWorkbook(wb)}
                      className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-lg"
                    >✏️ Edit</button>
                    <button
                      onClick={() => deleteWorkbook(wb.id, wb.title)}
                      className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded-lg"
                    >🗑️ Delete</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-gray-800 rounded-xl p-6 shadow-xl max-w-4xl mx-auto mb-10">
        <h2 className="text-xl font-semibold text-yellow-300 mb-4">⚡ Extra Chores</h2>
        <ul className="space-y-4">
          {extraChores.map(chore => (
            <li key={chore.id} className="bg-gray-700 p-4 rounded-xl">
              {editingExtraChoreId === chore.id ? (
                <div className="space-y-2">
                  <input
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                  />
                  <input
                    type="number"
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                    value={editPoints}
                    onChange={e => setEditPoints(Number(e.target.value))}
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={updateExtraChore}
                      className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingExtraChoreId(null)}
                      className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold">{chore.title}</p>
                    <p className="text-sm">{chore.points} pts</p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => startEditExtraChore(chore)}
                      className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-lg"
                    >✏️ Edit</button>
                    <button
                      onClick={() => deleteExtraChore(chore.id, chore.title)}
                      className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded-lg"
                    >🗑️ Delete</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
</main>

  );
};

export default Manager;
