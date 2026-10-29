/** A raw job fresh off a source, before normalization / DB write. */
export type RawJob = {
  sourceId: string
  url: string
  title: string
  company: string
  salary: string | null
  location: string | null
  skills: string[]
  /** Structured minimum years of experience, when the source states one (TopDev does). */
  minYears?: number | null
}

export type SourceFn = (keywords: string[], delaySeconds: number) => Promise<RawJob[]>
