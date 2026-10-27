CREATE TABLE nguon (
  ma               text PRIMARY KEY,
  ten              text NOT NULL,
  enabled_ingest   boolean NOT NULL DEFAULT true,
  enabled_hien_thi boolean NOT NULL DEFAULT true,
  ghi_chu          text
);

CREATE TABLE viec (
  id            serial PRIMARY KEY,
  nguon         text NOT NULL REFERENCES nguon(ma),
  nguon_id      text NOT NULL,
  url           text NOT NULL,
  tieu_de_raw   text NOT NULL,
  tieu_de_chuan text NOT NULL,
  cong_ty_raw   text NOT NULL,
  cong_ty_chuan text NOT NULL,
  luong_raw     text,
  dia_diem      text,
  skills        text[] NOT NULL DEFAULT '{}',
  la_senior     boolean NOT NULL DEFAULT false,
  trang_thai    text NOT NULL DEFAULT 'mo' CHECK (trang_thai IN ('mo','het_han','an')),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL,
  nhom_trung    integer,
  UNIQUE (nguon, nguon_id)
);

CREATE INDEX viec_hien_thi_idx ON viec (trang_thai, la_senior, last_seen_at DESC);
CREATE INDEX viec_cong_ty_idx ON viec (cong_ty_chuan);

CREATE TABLE lan_quet (
  id          serial PRIMARY KEY,
  nguon       text NOT NULL REFERENCES nguon(ma),
  started_at  timestamptz NOT NULL,
  finished_at timestamptz,
  trang_thai  text NOT NULL CHECK (trang_thai IN ('ok','loi')),
  so_tin_thay integer NOT NULL DEFAULT 0,
  so_tin_moi  integer NOT NULL DEFAULT 0,
  loi_text    text
);

CREATE INDEX lan_quet_nguon_idx ON lan_quet (nguon, started_at DESC);

INSERT INTO nguon (ma, ten, enabled_ingest, enabled_hien_thi, ghi_chu) VALUES
  ('topdev', 'TopDev',        true,  true,  'API JSON công khai — chạy được trên CI'),
  ('itviec', 'ITviec',        true,  true,  'HTML công khai — chạy từ máy cá nhân (Cloudflare)'),
  ('topcv',  'TopCV',         true,  true,  'HTML công khai — chạy từ máy cá nhân'),
  ('vnw',    'VietnamWorks',  false, false, 'TẮT: API công khai giấu jobUrl — tôn trọng tín hiệu đó, xem ROADMAP');
