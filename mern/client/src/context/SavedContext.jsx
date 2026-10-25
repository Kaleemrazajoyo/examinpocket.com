import { createContext, useContext, useEffect, useState } from 'react';

const SavedContext = createContext(null);

const KEYS = {
  mcqs: 'eip_saved_mcqs',
  vocab: 'eip_saved_vocab',
  articles: 'eip_saved_articles',
  books: 'eip_saved_books',
};

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function normalizeId(id) {
  if (id === undefined || id === null) return id;
  const num = Number(id);
  if (!Number.isNaN(num) && String(num) === String(id)) return num;
  return id;
}

export function SavedProvider({ children }) {
  const [savedMcqs, setSavedMcqs] = useState(() => load(KEYS.mcqs));
  const [savedVocab, setSavedVocab] = useState(() => load(KEYS.vocab));
  const [savedArticles, setSavedArticles] = useState(() => load(KEYS.articles));
  const [savedBooks, setSavedBooks] = useState(() => load(KEYS.books));

  useEffect(() => save(KEYS.mcqs, savedMcqs), [savedMcqs]);
  useEffect(() => save(KEYS.vocab, savedVocab), [savedVocab]);
  useEffect(() => save(KEYS.articles, savedArticles), [savedArticles]);
  useEffect(() => save(KEYS.books, savedBooks), [savedBooks]);

  function toggleBookmarkMcq(id) {
    const nId = normalizeId(id);
    setSavedMcqs((prev) => {
      const exists = prev.some((i) => String(i) === String(nId));
      if (exists) {
        return prev.filter((i) => String(i) !== String(nId));
      }
      return [...prev, nId];
    });
  }

  function toggleBookmarkVocab(id) {
    const nId = normalizeId(id);
    setSavedVocab((prev) => {
      const exists = prev.some((i) => String(i) === String(nId));
      if (exists) {
        return prev.filter((i) => String(i) !== String(nId));
      }
      return [...prev, nId];
    });
  }

  function toggleBookmarkArticle(id) {
    const nId = normalizeId(id);
    setSavedArticles((prev) => {
      const exists = prev.some((i) => String(i) === String(nId));
      if (exists) {
        return prev.filter((i) => String(i) !== String(nId));
      }
      return [...prev, nId];
    });
  }

  function toggleBookmarkBook(id) {
    const nId = normalizeId(id);
    setSavedBooks((prev) => {
      const exists = prev.some((i) => String(i) === String(nId));
      if (exists) {
        return prev.filter((i) => String(i) !== String(nId));
      }
      return [...prev, nId];
    });
  }

  const total = savedMcqs.length + savedVocab.length + savedArticles.length + savedBooks.length;

  return (
    <SavedContext.Provider
      value={{
        savedMcqs,
        savedVocab,
        savedArticles,
        savedBooks,
        toggleBookmarkMcq,
        toggleBookmarkVocab,
        toggleBookmarkArticle,
        toggleBookmarkBook,
        total,
      }}
    >
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved must be used within SavedProvider');
  return ctx;
}
