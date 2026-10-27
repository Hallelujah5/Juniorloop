-- Retrieval coverage ("the Unity problem"): crawl keywords move from a hardcoded
-- CLI default into data, grouped into tracks. One track is scanned per run, in
-- least-recently-scanned rotation, so coverage grows without growing the request
-- volume per run (politeness budget stays constant).

CREATE TABLE scan_keywords (
  id              serial PRIMARY KEY,
  track           text NOT NULL,
  keyword         text NOT NULL,
  enabled         boolean NOT NULL DEFAULT true,
  last_scanned_at timestamptz,
  UNIQUE (track, keyword)
);

ALTER TABLE scan_runs ADD COLUMN track text;

-- Keywords are slug-safe (dashes, no spaces): they go into ITviec/TopCV URLs
-- as-is; the TopDev source converts dashes to spaces for its API query.
INSERT INTO scan_keywords (track, keyword) VALUES
  ('web',    'nodejs'),
  ('web',    'reactjs'),
  ('web',    'typescript'),
  ('web',    'fullstack'),
  ('mobile', 'android'),
  ('mobile', 'ios'),
  ('mobile', 'flutter'),
  ('mobile', 'react-native'),
  ('game',   'unity'),
  ('game',   'unreal'),
  ('game',   'game'),
  ('data',   'python'),
  ('data',   'data-engineer'),
  ('data',   'sql'),
  ('qa',     'qa'),
  ('qa',     'tester'),
  ('qa',     'automation-test'),
  ('devops', 'devops'),
  ('devops', 'kubernetes'),
  ('devops', 'cloud');
