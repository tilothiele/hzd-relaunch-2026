CREATE TABLE delete_all_users_jobs (
	id UUID NOT NULL,
	status VARCHAR(255) NOT NULL,
	started_at TIMESTAMP NOT NULL,
	finished_at TIMESTAMP,
	message VARCHAR(4000),
	users_deleted INTEGER NOT NULL,
	users_total INTEGER NOT NULL,
	CONSTRAINT delete_all_users_jobs_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_delete_all_users_jobs_status ON delete_all_users_jobs (status);
