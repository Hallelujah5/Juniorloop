export const metadata = { title: 'Data principles' }

export default function PrinciplesPage() {
  return (
    <article className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Data principles</h1>
      <div className="mt-4 space-y-4 text-[15px] leading-7 text-stone-700">
        <p>
          JuniorLoop is a <strong>non-commercial</strong> tool that helps junior developers
          find jobs faster. We aggregate postings from the <em>public</em> search pages of
          TopDev, ITviec and TopCV, under these rules:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Metadata only</strong>: job title, company name, displayed salary, location, skills and a link to the original posting. We never copy job descriptions.</li>
          <li><strong>Always link to the source</strong>: to read details or apply, you click through to the original site. JuniorLoop does not replace the source boards — it sends them readers.</li>
          <li><strong>No personal data</strong> from postings (recruiter names, phone numbers, emails) and no user accounts — your scoring profile lives in your own browser.</li>
          <li><strong>Polite scanning</strong>: 4 times a day, with delays between requests and a User-Agent that identifies us. No logins, no CAPTCHA workarounds.</li>
          <li><strong>Removal on request</strong>: every source has its own kill switch. If you represent a source site and want us to stop, open an issue on the project's GitHub or use the contact email in the GitHub profile — the source will be disabled within 48 hours.</li>
        </ul>
        <p className="text-sm text-stone-500">
          Displayed data can lag the source site by a few hours; postings we no longer see
          on the source are hidden, but that does not necessarily mean the position closed.
        </p>
      </div>
    </article>
  )
}
