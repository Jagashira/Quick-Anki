import type { HistoryItem } from "../types";

export const HistoryDetailModal = ({
  item,
  onClose,
}: {
  item: HistoryItem;
  onClose: () => void;
}) => {
  const { details } = item;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {item.word}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            &times;
          </button>
        </div>
        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
          {details.pronunciation && (
            <p>
              <b>発音:</b> /{details.pronunciation}/
            </p>
          )}
          {details.meanings && details.meanings.length > 0 && (
            <div>
              <b>意味:</b>
              <ul className="list-disc pl-5">
                {details.meanings.map((m, i) => (
                  <li key={i}>
                    <b>[{m.partOfSpeech}]</b> {m.definition}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {details.examples && details.examples.length > 0 && (
            <div>
              <b>例文:</b>
              <ul className="list-disc pl-5">
                {details.examples.map((ex, i) => (
                  <li key={i}>
                    {ex.english}
                    <br />
                    <i className="text-slate-500">{ex.japanese}</i>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {details.synonyms && details.synonyms.length > 0 && (
            <div>
              <b>類義語:</b>
              <ul className="list-disc pl-5">
                {details.synonyms.map((s, i) => (
                  <li key={i}>
                    <b>{s.word}</b>: {s.meaning} ({s.difference})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {details.usageNotes && (
            <p>
              <b>💡使い方:</b>
              <br />
              {details.usageNotes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
