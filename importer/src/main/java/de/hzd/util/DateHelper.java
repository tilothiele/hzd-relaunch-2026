package de.hzd.util;

import java.text.DecimalFormat;
import java.text.NumberFormat;

public class DateHelper {

	public static String formatDauerMillis(long millis) {
		NumberFormat nf = new DecimalFormat("00");
		NumberFormat nf3 = new DecimalFormat("000");
		long x = millis / 1000;
		long s = x % 60;
		x /= 60;
		long m = x % 60;
		x /= 60;
		return nf.format(x) + ":" + nf.format(m) + ":" + nf.format(s) + ":" + nf3.format(millis % 1000);
	}

	public static String formatDauer(long millis) {
		NumberFormat nf = new DecimalFormat("00");
		long x = millis / 1000;
		long s = x % 60;
		x /= 60;
		long m = x % 60;
		x /= 60;
		return nf.format(x) + ":" + nf.format(m) + ":" + nf.format(s);
	}

	public static String formatDauerLang(long millis) {
		int h = (int) (millis / 60000);
		double secs = (millis - h * 60000) / 1000.0;

		int mins = h % 60;

		int hours = h / 60;

		StringBuilder rv = new StringBuilder();
		if (hours != 0) {
			rv.append(hours).append("h ");
		}
		if (mins != 0) {
			rv.append(mins).append("' ");
		}
		if (secs != 0.0) {
			rv.append(new DecimalFormat("0.00").format(secs));
			rv.append("s");
		}
		return rv.toString().trim();
	}
}
