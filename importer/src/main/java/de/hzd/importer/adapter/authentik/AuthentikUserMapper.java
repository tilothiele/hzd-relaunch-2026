package de.hzd.importer.adapter.authentik;

import de.hzd.importer.domain.AuthentikUser;
import com.fasterxml.jackson.databind.JsonNode;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class AuthentikUserMapper {

    private static final Logger LOG = Logger.getLogger(AuthentikUserMapper.class);

    public static AuthentikUser parseUser(JsonNode item) {
        try {
            Integer cId = getIntField(item, "pk");
            if (cId == null) {
                LOG.debug("[AuthentikUserMapper] Skipping user - missing pk");
                return null;
            }

            String username = getStringField(item, "username");
            String email = getStringField(item, "email");
            String firstName = getStringField(item, "first_name");
            String lastName = getStringField(item, "last_name");
            Boolean isActive = getBoolField(item, "is_active");
            LocalDateTime createdAt = parseDateTime(getStringField(item, "date_joined"));

            LOG.trace("[AuthentikUserMapper] Parsed user pk=" + cId + ", username=" + username);

            return AuthentikUser.builder()
                    .cId(cId)
                    .username(username)
                    .email(email)
                    .firstName(firstName)
                    .lastName(lastName)
                    .active(isActive != null && isActive)
                    .createdAt(createdAt)
                    .build();
        } catch (Exception e) {
            LOG.error("[AuthentikUserMapper] Failed to parse user: " + e.getMessage());
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
            LOG.warn("[AuthentikUserMapper] Invalid integer for field '" + field + "': " + fieldNode.asText());
            return null;
        }
    }

    private static Boolean getBoolField(JsonNode node, String field) {
        JsonNode fieldNode = node.get(field);
        return (fieldNode != null && !fieldNode.isNull()) ? fieldNode.asBoolean() : null;
    }

    private static LocalDateTime parseDateTime(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return null;
        }
        try {
            // Authentik format: "2024-01-15T10:30:00"
            return LocalDateTime.parse(dateStr.substring(0, 19), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (Exception e) {
            LOG.warn("[AuthentikUserMapper] Invalid datetime format: " + dateStr);
            return null;
        }
    }
}