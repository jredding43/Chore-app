

type SectionProps<T extends { id: string | number }> = {
  title: string;
  items: T[];
  display: (item: T) => string;
  sub: (item: T) => string;
  deleteFunc: (id: T['id']) => Promise<void>;
};

export function SectionList<T extends { id: string | number }>({
  title,
  items,
  display,
  sub,
  deleteFunc,
}: SectionProps<T>) {
  return (
    <section className="bg-gray-800 rounded-3xl p-6 shadow-2xl max-w-3xl mx-auto mb-10">
      <h2 className="text-2xl font-semibold text-green-300 mb-4">{title}</h2>
      {items.length === 0 ? (
        <p className="text-gray-400">No items found.</p>
      ) : (
        <ul className="space-y-4">
          {items.map(item => (
            <li
              key={item.id}
              className="bg-gray-700 p-4 rounded-xl shadow flex justify-between items-center"
            >
              <div>
                <p className="text-lg font-bold text-white">{display(item)}</p>
                <p className="text-sm text-gray-300">{sub(item)}</p>
              </div>
              <button
                onClick={() => deleteFunc(item.id)}
                className="text-red-400 hover:underline text-sm"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
