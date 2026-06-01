-- Baseline-Schema für Import-Job-Persistenz (ImportJobEntity)

CREATE TABLE import_jobs (
	id UUID NOT NULL,
	status VARCHAR(255) NOT NULL,
	started_at TIMESTAMP NOT NULL,
	finished_at TIMESTAMP,
	message VARCHAR(4000),
	members_created INTEGER NOT NULL,
	members_updated INTEGER NOT NULL,
	members_skipped INTEGER NOT NULL,
	members_failed INTEGER NOT NULL,
	dogs_created INTEGER NOT NULL,
	dogs_updated INTEGER NOT NULL,
	dogs_failed INTEGER NOT NULL,
	breeders_created INTEGER NOT NULL,
	CONSTRAINT import_jobs_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_import_jobs_status ON import_jobs (status);
