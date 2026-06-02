package de.hzd.util;


public class Ticker {

	private long intervall;
	private long recentInvocation;

	public Ticker(long intervall) {
		this.intervall = intervall;
	}

	public void tick(Runnable cmd) {
		long now = System.currentTimeMillis();
		if (now > recentInvocation + intervall) {
			recentInvocation = now;
			cmd.run();
		}
	}

	public static String formatProceedingMessage(final long t0, final int totalcount, final long ith, final String what) {
		if (totalcount == 0) {
			return "#" + what + " -> no items to process";
		}
		long d = System.currentTimeMillis() - t0;
		long dtotal = ith == 0 ? 1 : totalcount * d / ith;
		String dtotal_part = dtotal == 0 ? "?" : "" + (totalcount * 60l * 1000 / dtotal );
		String msg = "#" + what + " items: " + ith + "/" + totalcount + " durationSoFar=" + DateHelper.formatDauer(d) + " estimatedTotal="
				+ DateHelper.formatDauer(dtotal) + " => " + dtotal_part + " items/min " + DateHelper.formatDauer(dtotal - d)
				+ " left";
		return msg;
	}
	
}
