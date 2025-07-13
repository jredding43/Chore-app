import React, { useEffect, useState } from 'react';
import { RewardItem } from '../types/Rewards';
import { db } from '../db';
import { Plus, Trash2, Save} from 'lucide-react'; 
import { Navigation } from '../components/Navigation'; 



export const StoreManagement: React.FC = () => {
  const [items, setItems] = useState<RewardItem[]>([]);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await db.rewardItems.toArray();
      setItems(data);
    };
    load();
  }, []);

  const handleChange = (id: number, field: keyof RewardItem, value: string | number) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: field === 'cost' ? Number(value) : value } : item
      )
    );
  };

  const handleDelete = async (id: number) => {
    const confirm = window.confirm('Delete this reward?');
    if (!confirm) return;

    await db.rewardItems.delete(id);
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAdd = () => {
    const newId = Date.now();
    setItems(prev => [
      ...prev,
      {
        id: newId,
        name: '',
        description: '',
        cost: 0,
        image: '',
      },
    ]);
    setExpandedItemId(newId);
  };

  const handleSave = async () => {
    await db.rewardItems.bulkPut(items);
    alert('Rewards saved!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-6 sm:p-10">

    {/* Top Navigation */}
    <div className="mb-4">
    <Navigation />
    </div>
    
      <div className="max-w-7xl mx-auto bg-gray-900 rounded-3xl shadow-2xl p-6 sm:p-10">
        <h1 className="text-4xl font-extrabold text-green-400 text-center mb-8 drop-shadow">
           Reward Store Manager
        </h1>

        <div className="space-y-4">
          {items.map(item => (
            <div
              key={item.id}
              className="rounded-2xl bg-gray-800 hover:ring-1 hover:ring-green-400 shadow-lg transition p-4"
            >
              <div
                onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                className="cursor-pointer flex justify-between items-center"
              >
                <h2 className="text-lg font-semibold text-white">
                  {item.name || <span className="italic text-gray-400">Untitled Reward</span>}
                </h2>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="text-red-400 hover:text-red-200"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {expandedItemId === item.id && (
                <div className="mt-4 space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Reward Name</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => handleChange(item.id, 'name', e.target.value)}
                      className="w-full p-2 rounded-xl bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring focus:ring-green-400"
                      placeholder="e.g., Movie Night"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Description</label>
                    <textarea
                      value={item.description}
                      onChange={e => handleChange(item.id, 'description', e.target.value)}
                      className="w-full p-2 rounded-xl bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring focus:ring-green-400"
                      placeholder="e.g., 1 movie of your choice"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Point Cost</label>
                    <input
                      type="number"
                      value={item.cost}
                      onChange={e => handleChange(item.id, 'cost', e.target.value)}
                      className="w-full p-2 rounded-xl bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring focus:ring-green-400"
                      placeholder="e.g., 250"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center flex-wrap gap-4">
          <button
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-xl flex items-center gap-2 shadow"
          >
            <Plus size={18} /> Add Reward
          </button>
          <button
            onClick={handleSave}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-6 py-2 rounded-xl flex items-center gap-2 shadow"
          >
            <Save size={18} /> Save Changes
          </button>

        </div>
      </div>
    </div>
  );
};
