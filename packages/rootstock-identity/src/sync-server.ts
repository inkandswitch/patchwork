import { PeerId } from "@automerge/automerge-repo/slim";
import {
  ContactCard,
  Individual,
  Keyhive,
  Identifier,
} from "@keyhive/keyhive/slim";

export type SyncServer = {
  individualId: Uint8Array;
  contactCard: string;
  peerId: PeerId;
};

export async function syncServerFromContactCard(
  contactCardJson: string,
  serverPeerId: PeerId,
  keyhive: Keyhive
): Promise<SyncServer> {
  const serverContactCard = ContactCard.fromJson(contactCardJson);
  const serverIndividual: Individual =
    keyhive.receiveContactCard(serverContactCard);

  const individualId = serverIndividual.id.toBytes();

  return {
    individualId,
    contactCard: contactCardJson,
    peerId: serverPeerId,
  };
}

export function getSyncServerIndividual(
  syncServer: SyncServer,
  keyhive: Keyhive
): Individual | null {
  const contactCard = ContactCard.fromJson(syncServer.contactCard);
  console.log("BEFORE Getting individual for server");
  // Try to get the Individual from keyhive
  const individual = keyhive.receiveContactCard(contactCard);
  console.log("AFTER Got individual for server");
  return individual;
}
