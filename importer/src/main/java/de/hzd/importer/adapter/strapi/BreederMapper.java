package de.hzd.importer.adapter.strapi;

import de.hzd.importer.domain.Breeder;
import de.hzd.importer.domain.BreederRole;
import de.hzd.util.Ticker;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jboss.logging.Logger;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

public class BreederMapper {

    private static final Logger LOG = Logger.getLogger(BreederMapper.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    public static List<Breeder> parseBreeders(String json, Ticker ticker) throws Exception {
        LOG.info("[BreederMapper] Parsing breeders JSON, length: " + json.length() + " bytes");
        List<Breeder> breeders = new ArrayList<>();
        JsonNode root = objectMapper.readTree(json);
        JsonNode data = root.get("data");

        if (data == null || !data.isArray()) {
            LOG.warn("[BreederMapper] No 'data' array found in response");
            return breeders;
        }

        LOG.info("[BreederMapper] Found " + data.size() + " breeder records in response");

        for (JsonNode item : data) {
            JsonNode attrs = item.get("attributes");
            if (attrs == null) {
                attrs = item;
            }

            Breeder breeder = parseBreeder(attrs);
            if (breeder != null) {
                breeders.add(breeder);
            }
            final Integer cId = breeder != null ? breeder.getCId().orElse(null) : null;
            ticker.tick(() -> LOG.debug("[BreederMapper] Last parsed: cId=" + cId));
        }

        ticker.finish();
        LOG.info("[BreederMapper] Successfully parsed " + breeders.size() + " breeders");
        return breeders;
    }

    public static Breeder parseBreeder(JsonNode item) {
        JsonNode attrs = item.has("attributes") ? item.get("attributes") : item;
        try {
            Integer cId = getIntField(attrs, "cId");
            if (cId == null) {
                LOG.debug("[BreederMapper] Skipping breeder - missing cId");
                return null;
            }

            String kennelName = getStringField(attrs, "kennelName");
            String breederRoleStr = getStringField(attrs, "breederRole");
            BreederRole breederRole = parseBreederRole(breederRoleStr);

            LocalDate breedingLicenseSince = parseDate(getStringField(attrs, "breedingLicenseSince"));

            // Member relation
            JsonNode memberNode = attrs.get("member");
            Integer memberCId = null;
            if (memberNode != null && !memberNode.isNull()) {
                JsonNode memberAttrs = memberNode.get("data");
                if (memberAttrs != null && memberAttrs.has("attributes")) {
                    memberCId = getIntField(memberAttrs.get("attributes"), "cId");
                }
            }

            LOG.trace("[BreederMapper] Parsed breeder cId=" + cId + ", kennelName=" + kennelName + ", breederRole=" + breederRole);

            return Breeder.builder()
                    .cId(cId)
                    .kennelName(kennelName)
                    .breederRole(breederRole)
                    .breedingLicenseSince(breedingLicenseSince)
                    .memberCId(memberCId)
                    .build();
        } catch (Exception e) {
            LOG.error("[BreederMapper] Failed to parse breeder: " + e.getMessage());
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
            LOG.warn("[BreederMapper] Invalid integer for field '" + field + "': " + fieldNode.asText());
            return null;
        }
    }

    private static LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(dateStr.substring(0, 10), DATE_FORMATTER);
        } catch (Exception e) {
            LOG.warn("[BreederMapper] Invalid date format: " + dateStr);
            return null;
        }
    }

    private static BreederRole parseBreederRole(String role) {
        if (role == null) return null;
        return switch (role.toUpperCase()) {
            case "B" -> BreederRole.B;
            case "S" -> BreederRole.S;
            default -> {
                LOG.debug("[BreederMapper] Unknown breederRole value: " + role);
                yield null;
            }
        };
    }
}
