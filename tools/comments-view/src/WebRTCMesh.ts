import { DocHandle, PeerId } from "@automerge/automerge-repo";
import { Awareness } from "@patchwork/awareness";

type WebRTCState = {
  // We can use this for connection status if needed
  connectionStatus?: "connecting" | "connected" | "disconnected";
};

type WebRTCMessage =
  | { type: "offer"; to: PeerId; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; to: PeerId; sdp: RTCSessionDescriptionInit }
  | { type: "ice-candidate"; to: PeerId; candidate: RTCIceCandidateInit };

export class WebRTCMesh {
  private connections = new Map<PeerId, RTCPeerConnection>();
  private remoteStreams = new Map<PeerId, MediaStream>();
  private awareness: Awareness<WebRTCState, "connectionStatus">;
  private handle: DocHandle<unknown>;
  private myPeerId: PeerId;
  private rtcConfig?: RTCConfiguration;
  private localStream?: MediaStream;

  public onConnection?: (peerId: PeerId, connection: RTCPeerConnection) => void;
  public onDisconnection?: (peerId: PeerId) => void;
  public onRemoteStream?: (peerId: PeerId, stream: MediaStream) => void;
  public onError?: (peerId: PeerId, error: Error) => void;

  constructor(
    handle: DocHandle<unknown>,
    peerId: PeerId,
    rtcConfig?: RTCConfiguration,
    localStream?: MediaStream
  ) {
    this.handle = handle;
    this.myPeerId = peerId;
    this.rtcConfig = rtcConfig;
    this.localStream = localStream;

    // Create awareness instance, using peerId as the identifier
    this.awareness = new Awareness<WebRTCState, "connectionStatus">(
      handle,
      peerId,
      {
        connectionStatus: "disconnected",
      }
    );

    // Listen for new peers
    this.awareness.on("state", (peerId, _msg) => {
      // New peer discovered or state updated
      if (!this.connections.has(peerId)) {
        this.maybeInitiateConnection(peerId);
      }
    });

    this.awareness.on("heartbeat", (peerId, _msg) => {
      // Peer still alive
      if (!this.connections.has(peerId)) {
        this.maybeInitiateConnection(peerId);
      }
    });

    this.awareness.on("goodbye", (peerId, _msg) => {
      // Peer left - close connection
      this.closeConnection(peerId);
    });

    // Listen for WebRTC handshake messages
    handle.on("ephemeral-message", (e) => {
      const msg = e.message as WebRTCMessage;
      const from = e.senderId;

      // Ignore if not addressed to us
      if (msg.to !== this.myPeerId) return;

      switch (msg.type) {
        case "offer":
          this.handleOffer(from, msg.sdp);
          break;
        case "answer":
          this.handleAnswer(from, msg.sdp);
          break;
        case "ice-candidate":
          this.handleIceCandidate(from, msg.candidate);
          break;
      }
    });
  }

  private shouldOffer(peerId: PeerId): boolean {
    // Deterministic: lexicographically smaller peer offers
    return this.myPeerId < peerId;
  }

  private maybeInitiateConnection(peerId: PeerId) {
    if (this.shouldOffer(peerId)) {
      this.createOffer(peerId);
    }
    // else: wait for them to send offer
  }

  private async createOffer(peerId: PeerId) {
    const pc = new RTCPeerConnection(this.rtcConfig);
    this.connections.set(peerId, pc);
    this.setupPeerConnection(pc, peerId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.handle.broadcast({
      type: "offer",
      to: peerId,
      sdp: offer,
    });
  }

  private async handleOffer(peerId: PeerId, sdp: RTCSessionDescriptionInit) {
    const pc = new RTCPeerConnection(this.rtcConfig);
    this.connections.set(peerId, pc);
    this.setupPeerConnection(pc, peerId);

    await pc.setRemoteDescription(sdp);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.handle.broadcast({
      type: "answer",
      to: peerId,
      sdp: answer,
    });
  }

  private async handleAnswer(peerId: PeerId, sdp: RTCSessionDescriptionInit) {
    const pc = this.connections.get(peerId);
    if (pc) {
      await pc.setRemoteDescription(sdp);
    }
  }

  private async handleIceCandidate(
    peerId: PeerId,
    candidate: RTCIceCandidateInit
  ) {
    const pc = this.connections.get(peerId);
    if (pc?.remoteDescription) {
      await pc.addIceCandidate(candidate);
    }
    // TODO: queue candidates if remote description not set yet
  }

  private setupPeerConnection(pc: RTCPeerConnection, peerId: PeerId) {
    // Add local tracks if available
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteStream) {
        this.remoteStreams.set(peerId, remoteStream);
        this.onRemoteStream?.(peerId, remoteStream);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.handle.broadcast({
          type: "ice-candidate",
          to: peerId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case "connected":
          this.awareness.broadcast("connectionStatus", "connected");
          this.onConnection?.(peerId, pc);
          break;
        case "disconnected":
        case "failed":
          this.handleConnectionFailure(peerId);
          break;
        case "closed":
          this.closeConnection(peerId);
          break;
      }
    };

    pc.onicecandidateerror = (event) => {
      this.onError?.(
        peerId,
        new Error(`ICE candidate error: ${event.errorText || "Unknown error"}`)
      );
    };
  }

  private handleConnectionFailure(peerId: PeerId) {
    const pc = this.connections.get(peerId);
    if (pc) {
      pc.close();
      this.connections.delete(peerId);
    }

    // Check if peer still present in awareness
    const peerStates = this.awareness.getPeerStates();
    if (peerStates.has(peerId)) {
      // Peer still alive in awareness, retry after random delay
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        if (peerStates.has(peerId) && !this.connections.has(peerId)) {
          this.maybeInitiateConnection(peerId);
        }
      }, delay);
    } else {
      // Peer is gone from awareness, clean up
      this.remoteStreams.delete(peerId);
      this.onDisconnection?.(peerId);
    }
  }

  private closeConnection(peerId: PeerId) {
    const pc = this.connections.get(peerId);
    if (pc) {
      pc.close();
      this.connections.delete(peerId);
      this.remoteStreams.delete(peerId);
      this.awareness.broadcast("connectionStatus", "disconnected");
      this.onDisconnection?.(peerId);
    }
  }

  dispose() {
    // Close all connections
    for (const [_peerId, pc] of this.connections) {
      pc.close();
    }
    this.connections.clear();
    this.remoteStreams.clear();

    // Dispose awareness (this sends goodbye message to peers)
    this.awareness.dispose();
  }

  getConnection(peerId: PeerId): RTCPeerConnection | undefined {
    return this.connections.get(peerId);
  }

  getAllConnections(): Map<PeerId, RTCPeerConnection> {
    return new Map(this.connections);
  }

  getRemoteStreams(): Map<PeerId, MediaStream> {
    return new Map(this.remoteStreams);
  }

  getLocalStream(): MediaStream | undefined {
    return this.localStream;
  }
}
