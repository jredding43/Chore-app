import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import { ChoreTemplate } from '../types/chore';
import { KidProfile } from '../types/kids';
import { DaySummary, KidChoreSummary } from '../types/calendardata';
import { WorkbookAssignment } from '../types/workbooks';
import { ExtraChoreAssignment, ExtraChoreTemplate } from '../types/extrachores';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getMostRecentDateFor = (dayStr: string): Date => {
  const today = new Date();
  const targetDay = days.indexOf(dayStr);
  const diff = (today.getDay() - targetDay + 7) % 7;
  const result = new Date(today);
  result.setDate(today.getDate() - diff);
  return result;
};

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const [kids, setKids] = useState<KidProfile[]>([]);
  const [chores, setChores] = useState<ChoreTemplate[]>([]);
  const [workbooks, setWorkbooks] = useState<WorkbookAssignment[]>([]);
  const [extraAssignments, setExtraAssignments] = useState<ExtraChoreAssignment[]>([]);
  const [extraChores, setExtraChores] = useState<ExtraChoreTemplate[]>([]);
  const [kidSummaries, setKidSummaries] = useState<KidChoreSummary>({});

  const todayIndex = new Date().getDay();

  useEffect(() => {
    const load = async () => {
      const [k, c, statuses, allWorkbooks, allExtras, extraTemplates] = await Promise.all([
        db.kidProfiles.toArray(),
        db.choreTemplates.toArray(),
        db.choreStatuses.toArray(),
        db.workbookAssignments.toArray(),
        db.extraChoreAssignments.toArray(),
        db.extraChoreTemplates.toArray(),
      ]);

      setKids(k);
      setChores(c);
      setWorkbooks(allWorkbooks);
      setExtraAssignments(allExtras);
      setExtraChores(extraTemplates);

      const summary: KidChoreSummary = {};

      for (const kid of k) {
        summary[kid.id] = {};

        for (const day of days) {
          const dayDate = getMostRecentDateFor(day);
          const dateStr = dayDate.toDateString();

          const filteredChores = statuses.filter(
            s => s.kidId === kid.id && new Date(s.date).toDateString() === dateStr
          );

          const filteredWorkbooks = allWorkbooks.filter(
            w => w.kidId === kid.id && new Date(w.date).toDateString() === dateStr && w.status === 'approved'
          );

          const filteredExtras = allExtras.filter(
            e => e.assignedTo === kid.id && new Date(e.date).toDateString() === dateStr && e.status === 'approved'
          );

          const daySummary: DaySummary = {
            completed: [],
            rejected: [],
            notCompleted: [],
            points: 0,
          };

          for (const s of filteredChores) {
            const chore = c.find(ch => ch.id === s.choreId);
            if (!chore) continue;

            const bonus = kid.name === 'Keira' ? 5 : 0;

            if (s.status === 'completed') {
              daySummary.completed.push({ title: chore.title, points: chore.points + bonus });
              daySummary.points += chore.points + bonus;
            } else if (s.status === 'rejected') {
              daySummary.rejected.push(chore.title);
            } else if (s.status === 'not completed') {
              daySummary.notCompleted.push(chore.title);
              daySummary.points -= 1;
            }
          }

          for (const wb of filteredWorkbooks) {
            daySummary.completed.push({
              title: `📘 Workbook ID ${wb.workBookId}`,
              points: wb.points ?? 0,
            });
            daySummary.points += wb.points ?? 0;
          }

          for (const extra of filteredExtras) {
            const template = extraTemplates.find(t => t.id === extra.choreId);
            if (!template) continue;
            const title = `✨ ${template.title}${extra.partialPoints ? ' (Partial)' : ''}`;
            const points = extra.partialPoints ? Math.floor(template.points / 2) : template.points;
            daySummary.completed.push({ title, points });
            daySummary.points += points;
          }

          summary[kid.id][day] = daySummary;
        }
      }

      setKidSummaries(summary);
    };

    load();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold text-green-400">📅 Weekly Chore Calendar</h1>
        <button
          onClick={() => navigate('/')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl shadow"
        >
          ← Back to Home
        </button>
      </div>

      <div className="space-y-10">
        {kids.map((kid) => (
          <section key={kid.id} className="bg-gray-800 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-green-300 mb-6">{kid.name}</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {days.map((day, index) => {
                const isPastOrToday = index <= todayIndex;
                const summary = kidSummaries[kid.id]?.[day];
                const scheduledChores = chores.filter(ch => ch.weeklyAssignment?.[day] === kid.id);

                return (
                  <div key={day} className="bg-gray-700 rounded-2xl p-4 border border-gray-600 shadow-md">
                    <h3 className="font-semibold text-yellow-300 text-center mb-2">{day}</h3>

                    {isPastOrToday && summary ? (
                      <div className="space-y-3 text-sm">
                        {/* ✅ Daily Chores */}
                        {summary.completed.filter(item => !item.title.startsWith('📘') && !item.title.startsWith('✨')).length > 0 && (
                          <div>
                            <h4 className="text-green-400 font-semibold mb-1">✅ Daily Chores</h4>
                            {summary.completed
                              .filter(item => !item.title.startsWith('📘') && !item.title.startsWith('✨'))
                              .map((item, idx) => (
                                <p key={idx} className="text-green-300">
                                  ✅ {item.title} <span className="text-yellow-300">(+{item.points})</span>
                                </p>
                              ))}
                          </div>
                        )}

                        {/* ⚠️ Not Completed */}
                        {summary.notCompleted.length > 0 && (
                          <div>
                            <h4 className="text-orange-400 font-semibold mb-1">⚠️ Not Completed</h4>
                            {summary.notCompleted.map((title, idx) => (
                              <p key={idx} className="text-orange-300">⚠️ {title}</p>
                            ))}
                          </div>
                        )}

                        {/* ❌ Rejected */}
                        {summary.rejected.length > 0 && (
                          <div>
                            <h4 className="text-red-400 font-semibold mb-1">❌ Rejected</h4>
                            {summary.rejected.map((title, idx) => (
                              <p key={idx} className="text-red-300">❌ {title}</p>
                            ))}
                          </div>
                        )}

                        {/* 📘 Workbooks */}
                        {summary.completed.filter(item => item.title.startsWith('📘')).length > 0 && (
                          <div>
                            <h4 className="text-blue-400 font-semibold mb-1">📘 Workbooks</h4>
                            {summary.completed
                              .filter(item => item.title.startsWith('📘'))
                              .map((item, idx) => (
                                <p key={idx} className="text-blue-300">
                                  {item.title} <span className="text-yellow-300">(+{item.points})</span>
                                </p>
                              ))}
                          </div>
                        )}

                        {/* ✨ Extra Chores */}
                        {summary.completed.filter(item => item.title.startsWith('✨')).length > 0 && (
                          <div>
                            <h4 className="text-yellow-300 font-semibold mb-1">✨ Extra Chores</h4>
                            {summary.completed
                              .filter(item => item.title.startsWith('✨'))
                              .map((item, idx) => (
                                <p key={idx} className="text-yellow-200">
                                  {item.title} <span className="text-yellow-300">(+{item.points})</span>
                                </p>
                              ))}
                          </div>
                        )}

                        {/* ⭐ Total Points */}
                        <p className="mt-2 font-bold text-yellow-300 border-t border-gray-600 pt-2">
                          ⭐ Total Points: {summary.points}
                        </p>
                      </div>
                    ) : scheduledChores.length > 0 ? (
                      <ul className="space-y-1 text-sm">
                        {scheduledChores.map(chore => (
                          <li key={chore.id} className="text-indigo-300">
                            📋 {chore.title} <span className="text-yellow-300">(+{chore.points})</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400 italic text-center text-sm">No chores</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
};

export default Calendar;
