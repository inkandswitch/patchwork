import type { AutomergeUrl } from "@automerge/automerge-repo/slim";
import {
  Access,
  ChangeRef,
  Document as KeyhiveDocument,
  DocumentId as KeyhiveDocumentId,
  Identifier,
  Individual,
  Keyhive,
} from "@keyhive/keyhive/slim";
import { docIdFromAutomergeUrl } from "./keyhive";
import { hexToUint8Array } from "@automerge/automerge-keyhive-network-adapter";

export async function generateDoc(kh: Keyhive): Promise<KeyhiveDocument> {
  console.log("[generateDoc] START");
  // For now, randomly generate a ChangeRef
  const changeRefArray = Uint8Array.from({ length: 10 }, () =>
    Math.floor(Math.random() * 256)
  );
  const changeRef = new ChangeRef(changeRefArray);
  const g = await kh.generateGroup([]);
  const doc = await kh.generateDocument([g.toPeer()], changeRef, []);
  console.log(
    `[generateDoc] Generated Keyhive document with id ${doc.doc_id.toBytes()}`
  );
  return doc;
}

export async function addMemberToDoc(
  kh: Keyhive,
  docUrl: AutomergeUrl,
  member: Individual,
  access: Access
) {
  console.log("[addMemberToDoc]");
  const agent = member.toAgent();
  if (!access || !agent) {
    console.error("Failed to add member: invalid access or agent!");
    return;
  }

  console.log("[addMemberToDoc] Calling docIdFromAutomergeUrl");
  const docId: KeyhiveDocumentId = docIdFromAutomergeUrl(docUrl);
  console.log(
    `addMemberToDoc: From url ${docUrl} derived Doc Id ${docId.toBytes()}`
  );
  if (!docId) {
    console.error(`Failed to parse docId from AutomergeUrl`);
    return;
  }
  const doc = kh.getDocument(docId);
  if (!doc) {
    console.error(`Failed to add member: doc not found for id ${docId}`);
    return;
  }
  console.log(`Found doc. Adding member...`);
  await kh.addMember(agent, doc.toMembered(), access, []);
}

export async function revokeMemberFromDoc(
  kh: Keyhive,
  docUrl: AutomergeUrl,
  hexId: string
) {
  const identifier = new Identifier(hexToUint8Array(hexId));
  const agent = kh.getAgent(identifier);

  if (!agent) {
    console.error("Agent to revoke not found");
    return;
  }

  console.log("[revokeMemberFromDoc] Calling docIdFromAutomergeUrl");
  const docId = docIdFromAutomergeUrl(docUrl);
  const doc = kh.getDocument(docId);
  if (!doc) {
    console.error(`Failed to revoke member: doc not found for id ${docId}`);
    return;
  }

  const membered = doc.toMembered();
  await kh.revokeMember(agent, true, membered);
}
