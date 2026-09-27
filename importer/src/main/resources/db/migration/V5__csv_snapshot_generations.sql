ALTER TABLE csv_members ADD COLUMN generation INTEGER NOT NULL DEFAULT 1;
ALTER TABLE csv_members DROP CONSTRAINT csv_members_pkey;
ALTER TABLE csv_members ADD CONSTRAINT csv_members_pkey PRIMARY KEY (c_id, generation);

ALTER TABLE csv_dogs ADD COLUMN generation INTEGER NOT NULL DEFAULT 1;
ALTER TABLE csv_dogs DROP CONSTRAINT csv_dogs_pkey;
ALTER TABLE csv_dogs ADD CONSTRAINT csv_dogs_pkey PRIMARY KEY (c_id, generation);

CREATE TABLE importer_config (
	id INTEGER NOT NULL,
	csv_generation INTEGER NOT NULL,
	CONSTRAINT importer_config_pkey PRIMARY KEY (id)
);

INSERT INTO importer_config (id, csv_generation)
SELECT 1, GREATEST(
	COALESCE((SELECT MAX(generation) FROM csv_members), 0),
	COALESCE((SELECT MAX(generation) FROM csv_dogs), 0)
);

CREATE TABLE importjobs (
	id UUID NOT NULL,
	generation INTEGER NOT NULL,
	started_at TIMESTAMP NOT NULL,
	finished_at TIMESTAMP,
	member_count INTEGER NOT NULL,
	dog_count INTEGER NOT NULL,
	CONSTRAINT importjobs_pkey PRIMARY KEY (id)
);
