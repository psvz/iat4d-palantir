import * as crypto from "crypto";
import { Client } from "@osdk/client";
import { tap, imark } from "@ontology/sdk";
import { getSource } from "@palantir/functions-sources";
import { Edits, createEditBatch } from "@osdk/functions";

interface VerifyTapInput {
  imarkName: string;
  tapGuid: string;
  tapTime: string;
  tapBy: string;
  signature: string;
}

type OntologyEdit = Edits.Object<tap>;
export const config = { sources: ["Keystore"] }
export default async function verifyTapPayload(
  client: Client,
  input: VerifyTapInput
): Promise<OntologyEdit[]> {
  const { imarkName, tapGuid, tapTime, tapBy, signature } = input;

  const payload = tapGuid + imarkName + tapTime;
  const tapIsoTimestamp = new Date(parseFloat(tapTime) * 1000).toISOString();

  let isValid = false;
  const getMark = await client(imark).fetchOneWithErrors(imarkName);

  if (!getMark.error && getMark.value.state === "Active") {

    const source = await getSource("Keystore");
    const keyBase64 = source.secrets["additionalSecretVerifier"];

    isValid = verifyEd25519(payload, signature, keyBase64!);
  }

  const batch = createEditBatch<OntologyEdit>(client);
  batch.create(tap, {
    uuid: crypto.randomUUID(),
    iMarkName: imarkName,
    tapGuid,
    tapTime: tapIsoTimestamp,
    tapBy,
    tapVerified: isValid,
  });

  return batch.getEdits();
}

function verifyEd25519(
  payload: string,
  signatureBase64: string,
  publicKeyBase64: string
): boolean {
  try {
    const rawKey = Buffer.from(publicKeyBase64, "base64");

    // Wrap raw 32‑byte Ed25519 key into SPKI DER
    const prefix = Buffer.from("302a300506032b6570032100", "hex");
    const spki = Buffer.concat([prefix, rawKey]);

    const publicKey = crypto.createPublicKey({
      key: spki,
      format: "der",
      type: "spki"
    });

    return crypto.verify(
      null,
      Buffer.from(payload, "utf8"),
      publicKey,
      Buffer.from(signatureBase64, "base64")
    );
  } catch {
    return false;
  }
}
