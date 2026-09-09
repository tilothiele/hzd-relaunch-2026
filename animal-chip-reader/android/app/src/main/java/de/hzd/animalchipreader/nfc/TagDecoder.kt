package de.hzd.animalchipreader.nfc

import android.nfc.NdefMessage
import android.nfc.NdefRecord
import android.nfc.Tag
import android.nfc.tech.Ndef
import android.nfc.tech.NfcA
import android.nfc.tech.NfcV
import android.nfc.tech.TagTechnology
import de.hzd.animalchipreader.data.ChipScan
import java.io.ByteArrayOutputStream
import java.nio.charset.Charset

object TagDecoder {
	fun decode(tag: Tag): ChipScan {
		val technologies = tag.techList.map { it.substringAfterLast('.') }
		val uid = tag.id ?: ByteArray(0)
		val payloads = mutableListOf<ByteArray>()
		val texts = mutableListOf<String>()

		readNdef(tag)?.let { ndef ->
			payloads += ndef.raw
			texts += ndef.texts
		}
		readNfcVMemory(tag)?.let { payloads += it }
		readNfcAPages(tag)?.let { payloads += it }

		val iso = Iso11784Parser.parseBest(uid, payloads, texts)
		val combinedPayload = payloads.fold(ByteArray(0)) { acc, bytes -> acc + bytes }
		return ChipScan.from(
			iso = iso,
			technologies = technologies,
			uidHex = uid.toHex(),
			payloadHex = combinedPayload.toHex(),
			ndefSummary = texts.takeIf { it.isNotEmpty() }?.joinToString(" · "),
		)
	}

	private data class NdefRead(val raw: ByteArray, val texts: List<String>)

	private fun readNdef(tag: Tag): NdefRead? {
		val ndef = Ndef.get(tag) ?: return null
		return ndef.useConnected {
			val message = ndef.ndefMessage ?: ndef.cachedNdefMessage ?: return@useConnected null
			NdefRead(raw = message.toByteArray(), texts = extractTexts(message))
		}
	}

	private fun extractTexts(message: NdefMessage): List<String> =
		message.records.mapNotNull { record -> decodeRecord(record) }

	private fun decodeRecord(record: NdefRecord): String? {
		return try {
			when {
				record.tnf == NdefRecord.TNF_WELL_KNOWN &&
					record.type.contentEquals(NdefRecord.RTD_TEXT) -> {
					val payload = record.payload
					if (payload.isEmpty()) return null
					val status = payload[0].toInt()
					val langLen = status and 0x3F
					val encoding = if (status and 0x80 == 0) Charsets.UTF_8 else Charset.forName("UTF-16")
					String(payload, 1 + langLen, payload.size - 1 - langLen, encoding)
				}
				record.tnf == NdefRecord.TNF_WELL_KNOWN &&
					record.type.contentEquals(NdefRecord.RTD_URI) -> {
					record.toUri()?.toString() ?: record.toMimeType()
				}
				record.toMimeType() != null -> {
					String(record.payload, Charsets.UTF_8)
				}
				else -> record.payload.takeIf { it.isNotEmpty() }?.let { String(it, Charsets.UTF_8) }
			}
		} catch (_: Exception) {
			null
		}?.takeIf { it.isNotBlank() }
	}

	private fun readNfcVMemory(tag: Tag): ByteArray? {
		val nfcV = NfcV.get(tag) ?: return null
		return nfcV.useConnected {
			val uid = nfcV.tag.id ?: ByteArray(0)
			val out = ByteArrayOutputStream()
			val flags = byteArrayOf(0x02, 0x00, 0x22, 0x42)
			for (block in 0 until 16) {
				var blockBytes: ByteArray? = null
				for (flag in flags) {
					val addressed = flag.toInt() and 0x20 != 0
					val command = if (addressed) {
						byteArrayOf(flag, 0x20) + uid + byteArrayOf(block.toByte())
					} else {
						byteArrayOf(flag, 0x20, block.toByte())
					}
					val response = transceiveQuiet(nfcV, command) ?: continue
					if (response.isNotEmpty() && response[0] == 0.toByte() && response.size > 1) {
						blockBytes = response.copyOfRange(1, response.size)
						break
					}
				}
				if (blockBytes == null) break
				out.write(blockBytes)
			}
			out.toByteArray().takeIf { it.isNotEmpty() }
		}
	}

	private fun readNfcAPages(tag: Tag): ByteArray? {
		val nfcA = NfcA.get(tag) ?: return null
		return nfcA.useConnected {
			val out = ByteArrayOutputStream()
			for (page in 0 until 16 step 4) {
				val response = transceiveQuiet(nfcA, byteArrayOf(0x30, page.toByte())) ?: break
				if (response.isEmpty()) break
				out.write(response)
			}
			out.toByteArray().takeIf { it.isNotEmpty() }
		}
	}

	private fun transceiveQuiet(tech: TagTechnology, command: ByteArray): ByteArray? {
		return try {
			when (tech) {
				is NfcV -> tech.transceive(command)
				is NfcA -> tech.transceive(command)
				else -> null
			}
		} catch (_: Exception) {
			null
		}
	}

	private inline fun <T : TagTechnology, R> T.useConnected(block: T.() -> R): R? {
		return try {
			connect()
			block()
		} catch (_: Exception) {
			null
		} finally {
			try {
				close()
			} catch (_: Exception) {
			}
		}
	}
}

fun ByteArray.toHex(): String =
	joinToString(":") { "%02X".format(it) }
