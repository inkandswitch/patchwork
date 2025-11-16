import { DocHandle, PeerId } from "@automerge/automerge-repo";
import { EventEmitter } from "eventemitter3";

// TODO: delete this package once awareness is in automerge-repo.

type UserId = unknown;

type PeerState<State> = {
  userId: UserId;
  value: State;
};

export type AwarenessMessageState<State = any> = {
  userId: UserId;
  type: "state";
  value: State;
};

export type AwarenessMessageHeartbeat = {
  userId: UserId;
  type: "heartbeat";
};

export type AwarenessMessageGoodbye = {
  userId: UserId;
  type: "goodbye";
};

export type AwarenessMessage<State = any> =
  | AwarenessMessageState<State>
  | AwarenessMessageHeartbeat
  | AwarenessMessageGoodbye;

export type AwarenessMessageType = AwarenessMessage["type"];

export type AwarenessEvents<State = any> = {
  state: (peerId: PeerId, msg: AwarenessMessageState<State>) => void;
  heartbeat: (peerId: PeerId, msg: AwarenessMessageHeartbeat) => void;
  goodbye: (peerId: PeerId, msg: AwarenessMessageGoodbye) => void;
};

export type AwarenessOpts = {
  heartbeatMs?: number;
  timeoutMs?: number;
};

export const HEARTBEAT_INTERVAL_MS = 15000;
export const HEARTBEAT_TIMEOUT_MS = HEARTBEAT_INTERVAL_MS * 3;

export class Awareness<
  State,
  Channel extends keyof State,
> extends EventEmitter<AwarenessEvents> {
  private peersLastSeen = new Map<PeerId, number>();
  private peerStates = new Map<PeerId, PeerState<State>>();
  private localState: PeerState<State>;

  private heartbeatInterval: ReturnType<typeof setInterval> | undefined;
  private timeoutInterval: ReturnType<typeof setInterval> | undefined;
  private opts: AwarenessOpts = {};

  constructor(
    private handle: DocHandle<unknown>,
    userId: string,
    initialState: State,
    opts?: AwarenessOpts
  ) {
    super();
    if (opts) {
      this.opts = opts;
    }
    this.localState = {
      userId,
      value: initialState,
    };

    this.handle.on("ephemeral-message", (e) => {
      const peerId = e.senderId;
      const message = e.message as AwarenessMessage<State>;

      if (!this.peersLastSeen.has(peerId)) {
        // introduce ourselves
        this.broadcastLocalState();
      }

      this.peersLastSeen.set(peerId, Date.now());

      switch (message.type) {
        case "heartbeat":
          this.emit("heartbeat", peerId, {
            type: "heartbeat",
            userId: message.userId,
          });
          break;
        case "goodbye":
          this.peerStates.delete(peerId);
          this.peersLastSeen.delete(peerId);
          this.emit("goodbye", peerId, {
            type: "goodbye",
            userId: message.userId,
          });
          break;
        case "state":
          const newPeerState = message.value as State;
          this.peerStates.set(peerId, {
            userId: message.userId,
            value: newPeerState,
          });
          this.emit("state", peerId, {
            type: "state",
            userId: this.localState.userId,
            value: newPeerState,
          });
          break;
      }
    });
    this.broadcastLocalState();
    this.startTimeoutChecker();
  }

  getPeerStates(channel?: Channel) {
    if (!channel) {
      return new Map(this.peerStates);
    }

    const peerChannelStates = Array.from(this.peerStates).map(
      ([peerId, peerState]) => {
        return [peerId, peerState.value[channel]] as const;
      }
    );

    return new Map(peerChannelStates);
  }

  getUserStates(channel?: Channel) {
    const freshestPeers = new Map<unknown, PeerId>();

    return Array.from(this.peerStates).reduce((map, [peerId, peerState]) => {
      const value = channel ? peerState.value[channel] : peerState.value;
      const userId = peerState.userId;

      // Use the most-recently-updated peer's value for each user
      const peerLastSeen = this.peersLastSeen.get(peerId);
      const freshestSoFar = freshestPeers.get(userId);
      const freshesSoFarLastSeen =
        freshestSoFar && this.peersLastSeen.get(freshestSoFar);

      if (
        !freshesSoFarLastSeen ||
        (peerLastSeen && peerLastSeen > freshesSoFarLastSeen) ||
        !map.has(userId)
      ) {
        map.set(userId, value);
        freshestPeers.set(userId, peerId);
      }

      return map;
    }, new Map());
  }

  broadcast(channel: Channel, msg: State[Channel]) {
    this.localState.value = {
      ...this.localState.value,
      [channel]: msg,
    };
    this.broadcastLocalState();
  }

  dispose() {
    this.handle.broadcast({
      userId: this.localState.userId,
      type: "goodbye",
    });
    this.handle.off("ephemeral-message");
    this.stopHeartbeats();
    this.stopTimeoutChecker();
  }

  private broadcastLocalState() {
    this.handle.broadcast({
      userId: this.localState.userId,
      type: "state",
      value: this.localState.value,
    });
    // Reset heartbeats every time we broadcast a message to avoid sending
    // unnecessary heartbeats when there is plenty of actual update activity
    // happening.
    this.stopHeartbeats();
    this.startHeartbeats();
  }

  private sendHeartbeat() {
    this.handle.broadcast({
      userId: this.localState.userId,
      type: "heartbeat",
    });
  }

  private startHeartbeats() {
    const heartbeatMs = this.opts.heartbeatMs ?? HEARTBEAT_INTERVAL_MS;
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, heartbeatMs);
  }

  private stopHeartbeats() {
    clearInterval(this.heartbeatInterval);
  }

  private checkStalePeers() {
    const now = Date.now();
    const timeoutMs = this.opts.timeoutMs ?? HEARTBEAT_TIMEOUT_MS;

    for (const [peerId, lastSeen] of this.peersLastSeen) {
      if (now - lastSeen > timeoutMs) {
        // Peer hasn't sent heartbeat in too long - assume gone
        const peerState = this.peerStates.get(peerId);
        const userId = peerState?.userId;

        this.peerStates.delete(peerId);
        this.peersLastSeen.delete(peerId);

        this.emit("goodbye", peerId, {
          type: "goodbye",
          userId: userId ?? "unknown",
        });
      }
    }
  }

  private startTimeoutChecker() {
    const heartbeatMs = this.opts.heartbeatMs ?? HEARTBEAT_INTERVAL_MS;
    // Check for stale peers at the same frequency as heartbeats
    this.timeoutInterval = setInterval(() => {
      this.checkStalePeers();
    }, heartbeatMs);
  }

  private stopTimeoutChecker() {
    clearInterval(this.timeoutInterval);
  }
}
