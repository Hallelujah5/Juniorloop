-- Structured minimum years of experience, when the source states one.
-- TopDev's listing API sends experiences_str ("2 năm, 5 năm" = min 2, max 5)
-- on the same call we already make — no extra requests. NULL = source did not
-- say. Feeds the experience gate: min_years >= 2 hides a posting from the
-- junior-facing default view the same way senior titles are hidden.
ALTER TABLE jobs ADD COLUMN min_years integer;
