CREATE TABLE sources (
  code            text PRIMARY KEY,
  name            text NOT NULL,
  ingest_enabled  boolean NOT NULL DEFAULT true,
  display_enabled boolean NOT NULL DEFAULT true,
  notes           text
);

CREATE TABLE jobs (
  id            serial PRIMARY KEY,
  source        text NOT NULL REFERENCES sources(code),
  source_id     text NOT NULL,
  url           text NOT NULL,
  title_raw     text NOT NULL,
  title_norm    text NOT NULL,
  company_raw   text NOT NULL,
  company_norm  text NOT NULL,
  salary_raw    text,
  location      text,
  skills        text[] NOT NULL DEFAULT '{}',
  is_senior     boolean NOT NULL DEFAULT false,
  status        text NOT NULL DEFAULT 'open' CHECK (status IN ('open','expired','hidden')),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL,
  dup_group     integer,
  UNIQUE (source, source_id)
);

CREATE INDEX jobs_display_idx ON jobs (status, is_senior, last_seen_at DESC);
CREATE INDEX jobs_company_idx ON jobs (company_norm);

CREATE TABLE scan_runs (
  id          serial PRIMARY KEY,
  source      text NOT NULL REFERENCES sources(code),
  started_at  timestamptz NOT NULL,
  finished_at timestamptz,
  status      text NOT NULL CHECK (status IN ('ok','error')),
  jobs_seen   integer NOT NULL DEFAULT 0,
  jobs_new    integer NOT NULL DEFAULT 0,
  error_text  text
);

CREATE INDEX scan_runs_source_idx ON scan_runs (source, started_at DESC);

INSERT INTO sources (code, name, ingest_enabled, display_enabled, notes) VALUES
  ('topdev', 'TopDev',        true,  true,  'Public JSON API — safe to run on CI'),
  ('itviec', 'ITviec',        true,  true,  'Public HTML — run from a residential machine (Cloudflare)'),
  ('topcv',  'TopCV',         true,  true,  'Public HTML — run from a residential machine'),
  ('vnw',    'VietnamWorks',  false, false, 'DISABLED: their public API hides jobUrl — we respect that signal, see ROADMAP');
