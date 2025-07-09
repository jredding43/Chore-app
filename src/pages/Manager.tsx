import React, { useEffect, useState } from 'react';
import { ChoreTemplate } from '../types/chore';
import { useNavigate } from 'react-router-dom';
import { KidProfile } from '../types/kids';
import { WoodBook } from '../types/workbooks';
import { db } from '../db';
import { ExtraChoreTemplate } from '../types/extrachores';
import { SectionList } from '../components/SectionList';
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
  const [extraChores, setExtraChores] = useState<ExtraChoreTemplate[]>([]);
  const [kids, setKids] = useState<KidProfile[]>([]);
  const [workbooks, setWorkbooks] = useState<WoodBook[]>([]);

  const [title, setTitle] = useState('');
  const [points, setPoints] = useState<number>(1);

  const [kidName, setKidName] = useState('');
  const [avatar, setAvatar] = useState('🧒');

  const [workbookTitle, setWorkbookTitle] = useState('');
  const [extraChoreTitle, setExtraChoreTitle] = useState('');

  const [authorized, setAuthorized] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const correctPin = '012018'; 
  

  useEffect(() => {
    const load = async () => {
      setChores(await db.choreTemplates.toArray());
      setKids(await db.kidProfiles.toArray());
      setWorkbooks(await db.woodBooks.toArray());
      setExtraChores(await db.extraChoreTemplates.toArray());
    };
    load();
  }, []);

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

  const handleExtraDeleteChore = async (id: number) => {
    await db.extraChoreTemplates.delete(id);
    setExtraChores(await db.extraChoreTemplates.toArray());
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

  const handleDeleteKid = async (id: string) => {
    await db.kidProfiles.delete(id);
    setKids(await db.kidProfiles.toArray());
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

  const handleDeleteWorkbook = async (id: number) => {
    await db.woodBooks.delete(id);
    setWorkbooks(await db.woodBooks.toArray());
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

  {/* Chores List */}
  <section className="bg-gray-800 rounded-3xl p-6 shadow-xl max-w-4xl mx-auto mb-10">
    <h2 className="text-2xl font-semibold text-green-300 mb-4">📝 Chores</h2>
    <ul className="space-y-4">
      {chores.map(chore => (
        <li key={chore.id} className="bg-gray-700 p-4 rounded-xl shadow">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-bold">{chore.title}</p>
              <p className="text-sm text-white">{chore.points} pts</p>
            </div>
            <button
              onClick={() => handleDeleteChore(chore.id)}
              className="text-red-400 hover:underline text-sm"
            >
              Delete
            </button>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-400">Assign to Days:</p>
            <div className="grid grid-cols-7 gap-1 mt-1">
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
        </li>
      ))}
    </ul>
  </section>

  {/* Lists for Kids, Workbooks, Extra Chores */}
  <SectionList
    title=" All Kids"
    items={kids}
    display={kid => `${kid.avatar} ${kid.name}`}
    sub={kid => `Points: ${kid.points}`}
    deleteFunc={handleDeleteKid}
  />

  <SectionList
    title=" All Workbooks"
    items={workbooks}
    display={wb => wb.title}
    sub={wb => `${wb.points} pts`}
    deleteFunc={handleDeleteWorkbook}
  />

  <SectionList
    title=" Extra Chores"
    items={extraChores}
    display={ec => ec.title}
    sub={ec => `${ec.points} pts`}
    deleteFunc={handleExtraDeleteChore}
  />
</main>

  );
};

export default Manager;
