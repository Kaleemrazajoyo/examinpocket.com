import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { SEED_HEADLINES, SEED_VOCAB } from '../data/seedData.js';

export default function DawnPage() {
  const { data: vocabData } = useQuery({ queryKey: ['vocab'], queryFn: () => api.get('/vocab?limit=20'), retry: false });
  const { data: headlineData } = useQuery({ queryKey: ['headlines'], queryFn: () => api.get('/headlines?limit=20'), retry: false });

  const vocab = (vocabData?.items || []).length > 0 ? vocabData.items : SEED_VOCAB;
  const headlines = (headlineData?.items || []).length > 0 ? headlineData.items : SEED_HEADLINES;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="border-b pb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <i className="fa-solid fa-newspaper text-indigo-600"></i> Daily Dawn Editorial Vocabulary & Headlines
          </h2>
          <p className="text-xs text-slate-500 mt-1">High-yield vocabulary words with Urdu meanings, context, and daily national headlines.</p>
        </div>
        <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center gap-2">
          <i className="fa-solid fa-book text-amber-500"></i> Today's Editorial Vocab
        </h3>
        <div className="space-y-3">
          {vocab.map((item) => (
            <article key={item._id || item.word} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-indigo-900">
                  {item.word} {item.type && <span className="text-[11px] text-slate-500 font-normal">({item.type})</span>}
                </h3>
              </div>
              {item.urdu && <p className="text-slate-700"><strong>Urdu:</strong> <span className="font-bold text-emerald-800">{item.urdu}</span></p>}
              <p className="text-slate-700"><strong>Meaning:</strong> {item.meaning}</p>
              {item.sentence && <p className="text-slate-500 italic">"{item.sentence}"</p>}
            </article>
          ))}
        </div>
      </section>
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center gap-2">
          <i className="fa-solid fa-bullhorn text-amber-500"></i> Top National Headlines
        </h3>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-700 space-y-2">
            {headlines.map((item) => (
              <li key={item._id || item.title} className="hover:text-indigo-700 transition">
                {item.title}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
