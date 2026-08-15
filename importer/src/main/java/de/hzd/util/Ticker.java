package de.hzd.util;

import org.jboss.logging.Logger;

/**
 * Utility class for progress logging at configurable intervals.
 * Logs a tick message every N processed items to show import progress.
 */
public class Ticker {

    private static final Logger LOG = Logger.getLogger(Ticker.class);

    private final long interval;
    private int processed = 0;
    private long startTime;

    public Ticker(long interval) {
        this.interval = interval;
        this.startTime = System.currentTimeMillis();
    }

    /**
     * Call this method after processing each item.
     * Logs progress at configured intervals.
     * @param debugLog anonymous class that provides debug output
     */
    public void tick(Runnable debugLog) {
        processed++;
        if (processed % interval == 0) {
            long elapsed = System.currentTimeMillis() - startTime;
            double rate = processed / (elapsed / 1000.0);
            LOG.info("Processed " + processed + " items (" + String.format("%.1f", rate) + " items/sec)");
            debugLog.run();
        }
    }

    /**
     * Logs the final summary.
     */
    public void finish() {
        long elapsed = System.currentTimeMillis() - startTime;
        double rate = processed / (elapsed / 1000.0);
        LOG.info("Finished: " + processed + " items processed in " + (elapsed / 1000) + "s (" + String.format("%.1f", rate) + " items/sec)");
    }

    public int getProcessed() {
        return processed;
    }
}
