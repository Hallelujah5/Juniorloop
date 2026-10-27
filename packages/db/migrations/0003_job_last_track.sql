-- Expiry needs to know WHICH track last saw a job: scans are keyword-scoped, so a
-- game-track job must only expire when game-track scans miss it — a data-track scan
-- of the same source says nothing about it. NULL = found before tracking existed,
-- or by an explicit --keywords run.
ALTER TABLE jobs ADD COLUMN last_track text;
