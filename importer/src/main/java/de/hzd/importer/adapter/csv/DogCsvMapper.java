package de.hzd.importer.adapter.csv;

import de.hzd.importer.domain.Dog;
import de.hzd.importer.domain.DogColor;
import de.hzd.importer.domain.DogHd;
import de.hzd.importer.domain.DogSex;
import de.hzd.importer.domain.DogSod1;
import java.util.Map;

public final class DogCsvMapper {

    private static final Map<String, DogSex> SEX_MAPPING = Map.of(
        "rüde", DogSex.M,
        "männlich", DogSex.M,
        "m", DogSex.M,
        "male", DogSex.M,
        "hündin", DogSex.F,
        "weiblich", DogSex.F,
        "f", DogSex.F,
        "female", DogSex.F,
        "1", DogSex.F,
        "0", DogSex.M
    );

    private static final Map<String, DogHd> HD_MAPPING = Map.ofEntries(
        Map.entry("A1", DogHd.A1),
        Map.entry("A2", DogHd.A2),
        Map.entry("B1", DogHd.B1),
        Map.entry("B2", DogHd.B2),
        Map.entry("A1(G)", DogHd.A1),
        Map.entry("A2(G)", DogHd.A2),
        Map.entry("B1(G)", DogHd.B1),
        Map.entry("B2(G)", DogHd.B2)
    );

    private static final Map<String, DogSod1> SOD1_MAPPING = Map.ofEntries(
        Map.entry("N/N", DogSod1.N_N),
        Map.entry("N/DM", DogSod1.N_DM),
        Map.entry("DM/DM", DogSod1.DM_DM)
    );

    private static final Map<String, DogColor> COLOR_MAPPING = Map.of(
        "schwarz", DogColor.S,
        "schwarzmarken", DogColor.SM,
        "blond", DogColor.B
    );

    private DogCsvMapper() {
    }

    public static Dog mapRow(Map<String, String> row) {
        Dog.Builder builder = Dog.builder();

        CsvParsingUtils.parseInteger(row.get("ID Animal"))
            .ifPresent(builder::cId);

        CsvParsingUtils.parseString(row.get("Given Name"))
            .ifPresent(builder::givenName);

        CsvParsingUtils.parseString(row.get("Full Name"))
            .ifPresent(builder::fullKennelName);

        CsvParsingUtils.parseInteger(row.get("ID Breeder"))
            .ifPresent(builder::breederCId);

        CsvParsingUtils.parseInteger(row.get("ID Owner"))
            .ifPresent(builder::ownerCId);

        CsvParsingUtils.parseString(row.get("chip number"))
            .ifPresent(builder::microchipNo);

        CsvParsingUtils.parseString(row.get("sex"))
            .map(s -> SEX_MAPPING.get(s.toLowerCase()))
            .ifPresent(builder::sex);

        CsvParsingUtils.parseDate(row.get("date of birth"))
            .ifPresent(builder::dateOfBirth);

        CsvParsingUtils.parseDate(row.get("date of death"))
            .ifPresent(builder::dateOfDeath);

        // HD: Prefer HD(G) if available, otherwise HD
        CsvParsingUtils.parseString(row.get("HD(G)"))
            .filter(hd -> !hd.isEmpty() && !hd.equals("-"))
            .or(() -> CsvParsingUtils.parseString(row.get("HD"))
                .filter(hd -> !hd.isEmpty() && !hd.equals("-")))
            .map(hd -> hd.replace("(G)", "").trim())
            .map(HD_MAPPING::get)
            .ifPresent(builder::hd);

        CsvParsingUtils.parseString(row.get("Gentest SOD1"))
            .map(s -> SOD1_MAPPING.get(s.trim()))
            .ifPresent(builder::sod1);

        CsvParsingUtils.parseString(row.get("color"))
            .map(s -> COLOR_MAPPING.get(s.toLowerCase()))
            .ifPresent(builder::color);

        // Boolean checks - any non-empty value means the check was done
        parseCheckBoolean(row.get("Augenuntersuchung"))
            .ifPresent(builder::eyesCheck);

        parseCheckBoolean(row.get("Herzuntersuchung"))
            .ifPresent(builder::heartCheck);

        // Exhibitions (Richterbericht)
        CsvParsingUtils.parseString(row.get("Richterbericht"))
            .filter(s -> !s.isEmpty() && !s.equals("-"))
            .ifPresent(builder::exhibitions);

        // BreedSurvey - combine columns starting with "Verhalten" or "Körung"
        StringBuilder breedSurvey = new StringBuilder();
        for (Map.Entry<String, String> entry : row.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (value != null && !value.isEmpty() && !value.equals("-")) {
                String keyLower = key.toLowerCase();
                if (keyLower.startsWith("verhalten") || keyLower.startsWith("körung")) {
                    if (breedSurvey.length() > 0) {
                        breedSurvey.append("\n");
                    }
                    breedSurvey.append(value);
                }
            }
        }
        if (breedSurvey.length() > 0) {
            builder.breedSurvey(breedSurvey.toString());
        }

        return builder.build();
    }

    private static java.util.Optional<Boolean> parseCheckBoolean(String value) {
        if (value == null || value.isEmpty() || value.equals("-")) {
            return java.util.Optional.empty();
        }
        String lower = value.toLowerCase();
        if (lower.equals("o. b.") || lower.equals("o.b.") || lower.equals("ohne befund") ||
            lower.equals("ok") || lower.equals("1") || lower.equals("true")) {
            return java.util.Optional.of(true);
        }
        return java.util.Optional.of(true); // Any other value means check was performed
    }
}
