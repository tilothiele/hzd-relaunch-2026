package de.hzd.importer.adapter.persistence;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "importer_config")
public class ImporterConfigEntity extends PanacheEntityBase {

	static final int SINGLETON_ID = 1;

	@Id
	public int id;

	@Column(name = "csv_generation", nullable = false)
	public int csvGeneration;
}
