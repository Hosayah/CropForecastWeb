const STORAGE_KEY = 'agrisense:saved_comparisons';

export function loadSavedComparisons() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveComparison(entry) {
  const existing = loadSavedComparisons();

  const updated = [
    ...existing.filter(
      (c) =>
        !(
          c.province === entry.province &&
          c.crops.join('|') === entry.crops.join('|')
        )
    ),
    entry
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function deleteComparison(index) {
  const existing = loadSavedComparisons();
  existing.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}
