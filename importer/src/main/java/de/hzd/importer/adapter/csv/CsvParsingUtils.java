package de.hzd.importer.adapter.csv;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Optional;
import java.util.regex.Pattern;

public final class CsvParsingUtils {

    private static final Pattern INTEGER_PATTERN = Pattern.compile("-?\\d+");
    private static final DateTimeFormatter[] DATE_FORMATTERS = {
        DateTimeFormatter.ofPattern("dd/MM/yyyy"),
        DateTimeFormatter.ofPattern("dd-MM-yyyy"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd"),
        DateTimeFormatter.ofPattern("dd.MM.yyyy")
    };

    private CsvParsingUtils() {
    }

    public static Optional<String> parseString(String value) {
        if (value == null || value.strip().isEmpty() || value.strip().equals("-")) {
            return Optional.empty();
        }
        return Optional.of(value.strip());
    }

    public static Optional<Integer> parseInteger(String value) {
        if (value == null || value.strip().isEmpty() || value.strip().equals("-")) {
            return Optional.empty();
        }
        String cleaned = value.strip().replaceAll("[^\\d-]", "");
        if (cleaned.isEmpty() || cleaned.equals("-")) {
            return Optional.empty();
        }
        try {
            return Optional.of(Integer.parseInt(cleaned));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    public static Optional<LocalDate> parseDate(String value) {
        if (value == null || value.strip().isEmpty() || value.strip().equals("-")) {
            return Optional.empty();
        }
        String cleaned = value.strip();
        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                return Optional.of(LocalDate.parse(cleaned, formatter));
            } catch (DateTimeParseException e) {
                // try next formatter
            }
        }
        return Optional.empty();
    }

    public static Optional<Boolean> parseBoolean(String value) {
        if (value == null || value.strip().isEmpty() || value.strip().equals("-")) {
            return Optional.empty();
        }
        String cleaned = value.strip().toLowerCase();
        if (cleaned.equals("1") || cleaned.equals("true")) {
            return Optional.of(true);
        }
        if (cleaned.equals("0") || cleaned.equals("false")) {
            return Optional.of(false);
        }
        return Optional.empty();
    }
}
