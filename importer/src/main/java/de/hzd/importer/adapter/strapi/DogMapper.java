package de.hzd.importer.adapter.strapi;

import de.hzd.importer.domain.Dog;
import de.hzd.importer.domain.DogColor;
import de.hzd.importer.domain.DogHd;
import de.hzd.importer.domain.DogSex;
import de.hzd.importer.domain.DogSod1;
import de.hzd.util.Ticker;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jboss.logging.Logger;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

public class DogMapper {

    private static final Logger LOG = Logger.getLogger(DogMapper.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    public static List<Dog> parseDogs(String json, Ticker ticker) throws Exception {
        LOG.info("[DogMapper] Parsing dogs JSON, length: " + json.length() + " bytes");
        List<Dog> dogs = new ArrayList<>();
        JsonNode root = objectMapper.readTree(json);
        JsonNode data = root.get("data");

        if (data == null || !data.isArray()) {
            LOG.warn("[DogMapper] No 'data' array found in response");
            return dogs;
        }

        LOG.info("[DogMapper] Found " + data.size() + " dog records in response");

        for (JsonNode item : data) {
            JsonNode attrs = item.get("attributes");
            if (attrs == null) {
                attrs = item;
            }

            Dog dog = parseDog(attrs);
            if (dog != null) {
                dogs.add(dog);
            }
            final Integer cId = dog != null ? dog.getCId().orElse(null) : null;
            ticker.tick(() -> LOG.debug("[DogMapper] Last parsed: cId=" + cId));
        }

        ticker.finish();
        LOG.info("[DogMapper] Successfully parsed " + dogs.size() + " dogs");
        return dogs;
    }

    public static Dog parseDog(JsonNode item) {
        JsonNode attrs = item.has("attributes") ? item.get("attributes") : item;
        try {
            Integer cId = getIntField(attrs, "cId");
            if (cId == null) {
                LOG.debug("[DogMapper] Skipping dog - missing cId");
                return null;
            }

            String givenName = getStringField(attrs, "givenName");
            String fullKennelName = getStringField(attrs, "fullKennelName");
            String microchipNo = getStringField(attrs, "microchipNo");

            Integer breederCId = getBreederCId(attrs);
            Integer ownerCId = getOwnerCId(attrs);

            DogSex sex = parseDogSex(getStringField(attrs, "sex"));
            DogHd hd = parseDogHd(getStringField(attrs, "hd"));
            DogSod1 sod1 = parseDogSod1(getStringField(attrs, "sod1"));
            DogColor color = parseDogColor(getStringField(attrs, "color"));

            LocalDate dateOfBirth = parseDate(getStringField(attrs, "dateOfBirth"));
            LocalDate dateOfDeath = parseDate(getStringField(attrs, "dateOfDeath"));

            Boolean eyesCheck = getBoolField(attrs, "eyesCheck");
            Boolean heartCheck = getBoolField(attrs, "heartCheck");

            String exhibitions = getStringField(attrs, "exhibitions");
            String breedSurvey = getStringField(attrs, "breedSurvey");

            LOG.trace("[DogMapper] Parsed dog cId=" + cId + ", name=" + givenName + ", breederCId=" + breederCId + ", ownerCId=" + ownerCId);

            return Dog.builder()
                    .cId(cId)
                    .givenName(givenName)
                    .fullKennelName(fullKennelName)
                    .microchipNo(microchipNo)
                    .breederCId(breederCId)
                    .ownerCId(ownerCId)
                    .sex(sex)
                    .hd(hd)
                    .sod1(sod1)
                    .color(color)
                    .dateOfBirth(dateOfBirth)
                    .dateOfDeath(dateOfDeath)
                    .eyesCheck(eyesCheck != null && eyesCheck)
                    .heartCheck(heartCheck != null && heartCheck)
                    .exhibitions(exhibitions)
                    .breedSurvey(breedSurvey)
                    .build();
        } catch (Exception e) {
            LOG.error("[DogMapper] Failed to parse dog: " + e.getMessage());
            return null;
        }
    }

    private static Integer getBreederCId(JsonNode attrs) {
        JsonNode breederNode = attrs.get("breeder");
        if (breederNode == null || breederNode.isNull()) {
            return null;
        }
        JsonNode data = breederNode.get("data");
        if (data == null) {
            return null;
        }
        JsonNode attrsNode = data.get("attributes");
        if (attrsNode == null) {
            return getIntField(data, "cId");
        }
        return getIntField(attrsNode, "cId");
    }

    private static Integer getOwnerCId(JsonNode attrs) {
        JsonNode ownerNode = attrs.get("owner");
        if (ownerNode == null || ownerNode.isNull()) {
            return null;
        }
        JsonNode data = ownerNode.get("data");
        if (data == null) {
            return null;
        }
        JsonNode attrsNode = data.get("attributes");
        if (attrsNode == null) {
            return getIntField(data, "cId");
        }
        return getIntField(attrsNode, "cId");
    }

    private static String getStringField(JsonNode node, String field) {
        JsonNode fieldNode = node.get(field);
        return (fieldNode != null && !fieldNode.isNull()) ? fieldNode.asText() : null;
    }

    private static Integer getIntField(JsonNode node, String field) {
        JsonNode fieldNode = node.get(field);
        if (fieldNode == null || fieldNode.isNull()) {
            return null;
        }
        if (fieldNode.isNumber()) {
            return fieldNode.asInt();
        }
        try {
            return Integer.parseInt(fieldNode.asText());
        } catch (NumberFormatException e) {
            LOG.warn("[DogMapper] Invalid integer for field '" + field + "': " + fieldNode.asText());
            return null;
        }
    }

    private static Boolean getBoolField(JsonNode node, String field) {
        JsonNode fieldNode = node.get(field);
        return (fieldNode != null && !fieldNode.isNull()) ? fieldNode.asBoolean() : null;
    }

    private static LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(dateStr.substring(0, 10), DATE_FORMATTER);
        } catch (Exception e) {
            LOG.warn("[DogMapper] Invalid date format: " + dateStr);
            return null;
        }
    }

    private static DogSex parseDogSex(String sex) {
        if (sex == null) return null;
        return switch (sex.toUpperCase()) {
            case "MALE", "M", "RÜDE" -> DogSex.M;
            case "FEMALE", "F", "HÜNDIN" -> DogSex.F;
            default -> {
                LOG.debug("[DogMapper] Unknown sex value: " + sex);
                yield null;
            }
        };
    }

    private static DogHd parseDogHd(String hd) {
        if (hd == null) return null;
        return switch (hd.toUpperCase()) {
            case "A1", "A" -> DogHd.A1;
            case "A2" -> DogHd.A2;
            case "B1", "B" -> DogHd.B1;
            case "B2" -> DogHd.B2;
            default -> {
                LOG.debug("[DogMapper] Unknown hd value: " + hd);
                yield null;
            }
        };
    }

    private static DogSod1 parseDogSod1(String sod1) {
        if (sod1 == null) return null;
        return switch (sod1.toUpperCase()) {
            case "N/N" -> DogSod1.N_N;
            case "N/DM" -> DogSod1.N_DM;
            case "DM/DM" -> DogSod1.DM_DM;
            default -> {
                LOG.debug("[DogMapper] Unknown sod1 value: " + sod1);
                yield null;
            }
        };
    }

    private static DogColor parseDogColor(String color) {
        if (color == null) return null;
        return switch (color.toUpperCase()) {
            case "SCHWARZ", "BLACK" -> DogColor.S;
            case "SCHWARZMARKEN", "BLACK MARKING" -> DogColor.SM;
            case "BLOND", "BLONDE" -> DogColor.B;
            default -> {
                LOG.debug("[DogMapper] Unknown color value: " + color);
                yield null;
            }
        };
    }
}
