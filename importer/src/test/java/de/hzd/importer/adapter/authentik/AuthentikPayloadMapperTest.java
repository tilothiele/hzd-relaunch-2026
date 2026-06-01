package de.hzd.importer.adapter.authentik;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import de.hzd.importer.domain.Member;
import de.hzd.importer.domain.UserSex;

class AuthentikPayloadMapperTest {

	private static final String HZD_MEMBER_UUID =
		"6b2f8f1a-4d3c-4b5e-9f0a-1c2d3e4f5a6b";

	@Test
	void mapsIsActiveAndGroups() {
		Member member = activeMember();

		Map<String, Object> payload = AuthentikPayloadMapper.toUserPayload(
			member,
			AuthentikGroupMapper.fromEntries(Map.of("hzd-member", HZD_MEMBER_UUID))
		);

		assertEquals("hzd.152544", payload.get("username"));
		assertEquals("lena@example.de", payload.get("email"));
		assertEquals("Lena Babel", payload.get("name"));
		assertEquals(true, payload.get("is_active"));
		assertEquals(List.of(HZD_MEMBER_UUID), payload.get("groups"));
	}

	@Test
	void mapsInactiveMemberWithoutKnownGroups() {
		Member member = new Member(
			10927,
			Optional.of(false),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.of("lena@example.de"),
			Optional.empty(),
			Optional.empty(),
			Optional.of(152544),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Member.UNDEFINED_DOCUMENT_ID,
			Member.UNDEFINED_ID
		);

		Map<String, Object> payload = AuthentikPayloadMapper.toUserPayload(
			member,
			AuthentikGroupMapper.empty()
		);

		assertTrue((Boolean) payload.get("is_active"));
		assertFalse(payload.containsKey("groups"));
	}

	@Test
	void mapsGroupUuidReferences() {
		Member member = activeMember();

		Map<String, Object> payload = AuthentikPayloadMapper.toUserPayload(
			member,
			AuthentikGroupMapper.fromEntries(Map.of("hzd-member", HZD_MEMBER_UUID))
		);

		assertEquals(List.of(HZD_MEMBER_UUID), payload.get("groups"));
	}

	@Test
	void ignoresUnknownGroupNames() {
		Member member = activeMember();

		Map<String, Object> payload = AuthentikPayloadMapper.toUserPayload(
			member,
			AuthentikGroupMapper.empty()
		);

		assertFalse(payload.containsKey("groups"));
	}

	private Member activeMember() {
		return new Member(
			10927,
			Optional.of(true),
			Optional.empty(),
			Optional.of("Lena"),
			Optional.of("Babel"),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.of("lena@example.de"),
			Optional.of(UserSex.F),
			Optional.of(false),
			Optional.of(152544),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Optional.empty(),
			Member.UNDEFINED_DOCUMENT_ID,
			Member.UNDEFINED_ID
		);
	}
}
