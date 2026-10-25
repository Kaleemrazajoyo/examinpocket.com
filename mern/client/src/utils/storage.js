const KEYS = {
  mcqs: 'eip_mcqs_custom',
  vocab: 'eip_vocab_custom',
  articles: 'eip_articles_custom',
  books: 'eip_books_custom',
};

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function getCustomMcqs() {
  return load(KEYS.mcqs);
}
export function addCustomMcq(item) {
  const list = load(KEYS.mcqs);
  const withId = { ...item, id: item.id || Date.now(), _id: item._id || `custom-mcq-${Date.now()}` };
  save(KEYS.mcqs, [withId, ...list]);
  return withId;
}
export function updateCustomMcq(id, updates) {
  const list = load(KEYS.mcqs);
  const next = list.map((m) => (String(m.id) === String(id) || String(m._id) === String(id) ? { ...m, ...updates } : m));
  save(KEYS.mcqs, next);
  return next;
}
export function deleteCustomMcq(id) {
  const list = load(KEYS.mcqs);
  const next = list.filter((m) => !(String(m.id) === String(id) || String(m._id) === String(id)));
  save(KEYS.mcqs, next);
  return next;
}

export function getCustomVocab() {
  return load(KEYS.vocab);
}
export function addCustomVocab(item) {
  const list = load(KEYS.vocab);
  const withId = { ...item, id: item.id || Date.now(), _id: item._id || `custom-vocab-${Date.now()}` };
  save(KEYS.vocab, [withId, ...list]);
  return withId;
}
export function updateCustomVocab(id, updates) {
  const list = load(KEYS.vocab);
  const next = list.map((m) => (String(m.id) === String(id) || String(m._id) === String(id) ? { ...m, ...updates } : m));
  save(KEYS.vocab, next);
  return next;
}
export function deleteCustomVocab(id) {
  const list = load(KEYS.vocab);
  const next = list.filter((m) => !(String(m.id) === String(id) || String(m._id) === String(id)));
  save(KEYS.vocab, next);
  return next;
}

export function getCustomArticles() {
  return load(KEYS.articles);
}
export function addCustomArticle(item) {
  const list = load(KEYS.articles);
  const withId = { ...item, id: item.id || Date.now(), _id: item._id || `custom-art-${Date.now()}` };
  save(KEYS.articles, [withId, ...list]);
  return withId;
}
export function updateCustomArticle(id, updates) {
  const list = load(KEYS.articles);
  const next = list.map((m) => (String(m.id) === String(id) || String(m._id) === String(id) ? { ...m, ...updates } : m));
  save(KEYS.articles, next);
  return next;
}
export function deleteCustomArticle(id) {
  const list = load(KEYS.articles);
  const next = list.filter((m) => !(String(m.id) === String(id) || String(m._id) === String(id)));
  save(KEYS.articles, next);
  return next;
}

export function getCustomBooks() {
  return load(KEYS.books);
}
export function addCustomBook(item) {
  const list = load(KEYS.books);
  const withId = { ...item, id: item.id || Date.now(), _id: item._id || `custom-book-${Date.now()}` };
  save(KEYS.books, [withId, ...list]);
  return withId;
}
export function updateCustomBook(id, updates) {
  const list = load(KEYS.books);
  const next = list.map((m) => (String(m.id) === String(id) || String(m._id) === String(id) ? { ...m, ...updates } : m));
  save(KEYS.books, next);
  return next;
}
export function deleteCustomBook(id) {
  const list = load(KEYS.books);
  const next = list.filter((m) => !(String(m.id) === String(id) || String(m._id) === String(id)));
  save(KEYS.books, next);
  return next;
}
