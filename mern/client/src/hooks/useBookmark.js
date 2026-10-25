import { useState } from 'react';

export function useBookmark() {
  const [bookmarks, setBookmarks] = useState(new Set());

  function toggle(id) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return { bookmarks, toggle, isSaved: (id) => bookmarks.has(id) };
}
