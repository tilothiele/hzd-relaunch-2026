package de.hzd.importer.adapter.strapi;

import de.hzd.importer.domain.StrapiUser;
import de.hzd.importer.domain.UserRegion;
import de.hzd.importer.domain.UserSex;
import de.hzd.util.Ticker;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jboss.logging.Logger;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

public class MemberMapper {

    private static final Logger LOG = Logger.getLogger(MemberMapper.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    public static List<StrapiUser> parseUsers(String json, Ticker ticker) throws Exception {
        LOG.info("[MemberMapper] Parsing users JSON, length: " + json.length() + " bytes");
        LOG.debug("[MemberMapper] Raw JSON sample: " + json.substring(0, Math.min(500, json.length())));

        List<StrapiUser> users = new ArrayList<>();
        JsonNode root = objectMapper.readTree(json);
        JsonNode data = root.get("data");

        if (data == null || !data.isArray()) {
            LOG.warn("[MemberMapper] No 'data' array found in response. Root keys: " + root.fieldNames().next());
            return users;
        }

        LOG.info("[MemberMapper] Found " + data.size() + " user records in response");

        for (JsonNode item : data) {
            JsonNode attributes = item.get("attributes");
            if (attributes == null) {
                attributes = item;
            }

            StrapiUser user = parseUser(attributes);
            if (user != null) {
                users.add(user);
            }
            final Integer cId = user != null ? user.getCId().orElse(null) : null;
            ticker.tick(() -> LOG.debug("[MemberMapper] Last parsed: cId=" + cId));
        }

        ticker.finish();
        LOG.info("[MemberMapper] Successfully parsed " + users.size() + " users");
        return users;
    }

    public static StrapiUser parseUser(JsonNode item) {
        // Log all field names at INFO level
        StringBuilder fields = new StringBuilder();
        item.fieldNames().forEachRemaining(f -> fields.append(f).append(","));
        LOG.info("[MemberMapper] Item fields: " + fields);

        try {
            // Strapi /users returns objects with 'id' field
            Integer cId = getIntField(item, "id");
            if (cId == null) {
                LOG.info("[MemberMapper] Skipping user - missing id. Available fields: " + fields);
                return null;
            }

            String firstName = getStringField(item, "firstName");
            String lastName = getStringField(item, "lastName");
            String email = getStringField(item, "email");
            String phone = getStringField(item, "phone");

            Boolean breeder = getBoolField(item, "breeder");
            String username = getStringField(item, "username");
            if (username == null) {
                username = String.valueOf(cId);
            }

            UserSex sex = parseUserSex(getStringField(item, "sex"));
            UserRegion region = parseUserRegion(getStringField(item, "region"));

            LocalDate dateOfBirth = parseDate(getStringField(item, "dateOfBirth"));
            LocalDate dateOfDeath = parseDate(getStringField(item, "dateOfDeath"));

            LOG.info("[MemberMapper] Parsed user id=" + cId + ", name=" + firstName + " " + lastName);

            return StrapiUser.builder()
                    .cId(cId)
                    .firstName(firstName)
                    .lastName(lastName)
                    .email(email)
                    .phone(phone)
                    .breeder(breeder != null && breeder)
                    .username(username)
                    .sex(sex)
                    .region(region)
                    .dateOfBirth(dateOfBirth)
                    .dateOfDeath(dateOfDeath)
                    .build();
        } catch (Exception e) {
            LOG.error("[MemberMapper] Failed to parse user: " + e.getMessage());
            return null;
        }
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
            LOG.warn("[MemberMapper] Invalid integer for field '" + field + "': " + fieldNode.asText());
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
            LOG.warn("[MemberMapper] Invalid date format: " + dateStr);
            return null;
        }
    }

    private static UserSex parseUserSex(String sex) {
        if (sex == null) return null;
        return switch (sex.toUpperCase()) {
            case "MALE", "M" -> UserSex.M;
            case "FEMALE", "F" -> UserSex.F;
            default -> {
                LOG.debug("[MemberMapper] Unknown sex value: " + sex);
                yield null;
            }
        };
    }

    private static UserRegion parseUserRegion(String region) {
        if (region == null) return null;
        try {
            return UserRegion.valueOf(region.toUpperCase());
        } catch (IllegalArgumentException e) {
            LOG.debug("[MemberMapper] Unknown region value: " + region);
            return null;
        }
    }
}