/** A raw job fresh off a source, before normalization / DB write. */
export type RawJob = {
  sourceId: string
  url: string
  title: string
  company: string
  salary: string | null
  location: string | null
  skills: string[]
}

export type SourceFn = (keywords: string[], delaySeconds: number) => Promise<RawJob[]>
