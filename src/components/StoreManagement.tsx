import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RewardItem } from '../types/Rewards';
import { db } from '../db';

export const StoreManagement: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<RewardItem[]>([]);

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
    const confirm = window.confirm('Are you sure you want to delete this reward?');
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
  };

  const handleSave = async () => {
    await db.rewardItems.bulkPut(items);
    alert('Reward store updated!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-6 sm:p-10">
      <div className="max-w-7xl mx-auto bg-gray-900 rounded-3xl shadow-2xl p-6 sm:p-10">
        <h1 className="text-4xl font-extrabold text-green-400 text-center mb-8 drop-shadow">
          Manage Reward Store
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="relative bg-gray-800 rounded-2xl p-6 shadow-lg space-y-4">
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute top-2 right-2 text-red-400 hover:text-red-300 text-lg"
              >
                ✖
              </button>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-300">Reward Name</label>
                <input
                  type="text"
                  value={item.name}
                  onChange={e => handleChange(item.id, 'name', e.target.value)}
                  className="w-full p-2 rounded-xl bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring focus:ring-green-400"
                  placeholder="e.g., Movie Night"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-300">Description</label>
                <textarea
                  value={item.description}
                  onChange={e => handleChange(item.id, 'description', e.target.value)}
                  className="w-full p-2 rounded-xl bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring focus:ring-green-400"
                  placeholder="Describe what this reward includes..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-300">Cost (Points)</label>
                <input
                  type="number"
                  value={item.cost}
                  onChange={e => handleChange(item.id, 'cost', e.target.value)}
                  className="w-full p-2 rounded-xl bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring focus:ring-green-400"
                  placeholder="e.g., 250"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center flex-wrap gap-4">
          <button
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition shadow"
          >
            + Add Reward
          </button>
          <button
            onClick={handleSave}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-6 py-2 rounded-xl transition shadow"
          >
            Save Changes
          </button>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-xl transition shadow"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};
