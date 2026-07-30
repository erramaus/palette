export const addUniqueId = (ids: string[], id: string): string[] =>
  ids.includes(id) ? ids : [...ids, id]

export const removeId = (ids: string[], id: string): string[] => ids.filter((value) => value !== id)
