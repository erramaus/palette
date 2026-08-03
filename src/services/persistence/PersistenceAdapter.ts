export interface PersistenceAdapter {
  load(): string | null
  save(serializedSnapshot: string): void
  remove(): void
}