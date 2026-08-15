package de.hzd.importer.application;

import de.hzd.importer.adapter.strapi.StrapiClient;
import de.hzd.importer.domain.BreederCache;
import de.hzd.importer.domain.DogCache;
import de.hzd.importer.domain.ImportStatistics;
import de.hzd.importer.domain.StrapiUserCache;
import de.hzd.util.Ticker;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import java.util.concurrent.atomic.AtomicBoolean;

@ApplicationScoped
public class ImportService {

    private static final Logger LOG = Logger.getLogger(ImportService.class);

    @Inject
    StrapiClient strapiClient;

    @Inject
    StrapiUserCache userCache;

    @Inject
    DogCache dogCache;

    @Inject
    BreederCache breederCache;

    @ConfigProperty(name = "importer.logging.ticker-interval", defaultValue = "10000")
    long tickerInterval;

    private final AtomicBoolean running = new AtomicBoolean(false);
    private ImportStatistics statistics = new ImportStatistics();

    public ImportStatistics getStatistics() {
        return statistics;
    }

    public boolean isRunning() {
        return running.get();
    }

    public StrapiUserCache getUserCache() {
        return userCache;
    }

    public DogCache getDogCache() {
        return dogCache;
    }

    public BreederCache getBreederCache() {
        return breederCache;
    }

    public void importStrapiUser() throws Exception {
        LOG.info("Starting Strapi import user process...");
        Ticker ticker = new Ticker(tickerInterval);
        LOG.info("Fetching all users from Strapi (with pagination)...");
        int usersCount = strapiClient.fetchAllUsers(userCache, ticker);
        statistics.incrementMembersRead(usersCount);
        LOG.info("Loaded " + usersCount + " users from Strapi");
    }

    public void importAll() {
        LOG.info("Starting Strapi import process...");
        statistics = new ImportStatistics();

        try {
            // Clear caches
            userCache.clear();
            dogCache.clear();
            breederCache.clear();

            // Create ticker for progress logging
            Ticker ticker = new Ticker(tickerInterval);

            // Import users from Strapi (directly to cache)
            LOG.info("Fetching all users from Strapi (with pagination)...");
            int usersCount = strapiClient.fetchAllUsers(userCache, ticker);
            statistics.incrementMembersRead(usersCount);
            LOG.info("Loaded " + usersCount + " users from Strapi");

            // Import breeders from Strapi (directly to cache)
            ticker = new Ticker(tickerInterval);
            LOG.info("Fetching all breeders from Strapi (with pagination)...");
            int breedersCount = strapiClient.fetchAllBreeders(breederCache, ticker);
            statistics.incrementBreedersIdentified(breedersCount);
            LOG.info("Loaded " + breedersCount + " breeders from Strapi");

            // Import dogs from Strapi (directly to cache)
            ticker = new Ticker(tickerInterval);
            LOG.info("Fetching all dogs from Strapi (with pagination)...");
            int dogsCount = strapiClient.fetchAllDogs(dogCache, ticker);
            statistics.incrementDogsRead(dogsCount);
            LOG.info("Loaded " + dogsCount + " dogs from Strapi");

            LOG.info("Strapi import complete. " + statistics);
        } catch (Exception e) {
            LOG.error("Strapi import failed", e);
            throw new RuntimeException("Import failed", e);
        } finally {
            running.set(false);
        }
    }

    /**
     * Starts the import if not already running.
     * @return true if import was started, false if already running
     */
    public boolean startImportIfNotRunning() {
        if (!running.compareAndSet(false, true)) {
            LOG.info("Import already running, skipping");
            return false;
        }

        LOG.info("Starting background Strapi import...");
        new Thread(() -> {
            try {
                importAll();
            } catch (Exception e) {
                LOG.error("Import failed", e);
                running.set(false);
            }
        }).start();

        return true;
    }
}
