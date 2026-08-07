export const nowIso = (): string => new Date().toISOString()

export const formatDateOnly = (value?: string): string => {
	if (!value) return '--'
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
	if (!match) return new Date(value).toLocaleDateString()
	return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toLocaleDateString()
}
