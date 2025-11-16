import { useState, useRef, useEffect, useCallback } from "react";
import type { DocHandle, PeerId } from "@automerge/automerge-repo";
import { WebRTCMesh } from "./WebRTCMesh";

interface UseWebRTCMeshOptions {
  rtcConfig?: RTCConfiguration;
  mediaConstraints?: MediaStreamConstraints;
}

interface UseWebRTCMeshReturn {
  localStream: MediaStream | null;
  remoteStreams: Map<PeerId, MediaStream>;
  isInCall: boolean;
  error: Error | null;
  startCall: (handle: DocHandle<unknown>, peerId: PeerId) => Promise<void>;
  joinCall: (handle: DocHandle<unknown>, peerId: PeerId) => Promise<void>;
  hangUp: () => void;
}

const DEFAULT_MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  video: { width: 640, height: 480 },
  audio: true,
};

const DEFAULT_RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useWebRTCMesh(
  options: UseWebRTCMeshOptions = {}
): UseWebRTCMeshReturn {
  const {
    rtcConfig = DEFAULT_RTC_CONFIG,
    mediaConstraints = DEFAULT_MEDIA_CONSTRAINTS,
  } = options;

  const meshRef = useRef<WebRTCMesh | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [remoteStreams, setRemoteStreams] = useState<Map<PeerId, MediaStream>>(
    new Map()
  );
  const [isInCall, setIsInCall] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setupMesh = useCallback(
    (handle: DocHandle<unknown>, peerId: PeerId, stream: MediaStream) => {
      const mesh = new WebRTCMesh(handle, peerId, rtcConfig, stream);

      mesh.onRemoteStream = (_peerId, _remoteStream) => {
        setRemoteStreams(mesh.getRemoteStreams());
      };

      mesh.onDisconnection = (_peerId) => {
        setRemoteStreams(mesh.getRemoteStreams());
      };

      mesh.onError = (peerId, err) => {
        console.error(`WebRTC error for peer ${peerId}:`, err);
        setError(err);
      };

      meshRef.current = mesh;
      return mesh;
    },
    [rtcConfig]
  );

  const startCall = useCallback(
    async (handle: DocHandle<unknown>, peerId: PeerId) => {
      try {
        setError(null);

        // Get user media
        const stream =
          await navigator.mediaDevices.getUserMedia(mediaConstraints);
        localStreamRef.current = stream;

        // Setup mesh
        setupMesh(handle, peerId, stream);

        setIsInCall(true);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to start call");
        setError(error);
        console.error("Error starting call:", error);
      }
    },
    [mediaConstraints, setupMesh]
  );

  const joinCall = useCallback(
    async (handle: DocHandle<unknown>, peerId: PeerId) => {
      try {
        setError(null);

        // Get user media
        const stream =
          await navigator.mediaDevices.getUserMedia(mediaConstraints);
        localStreamRef.current = stream;

        // Setup mesh
        setupMesh(handle, peerId, stream);

        setIsInCall(true);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to join call");
        setError(error);
        console.error("Error joining call:", error);
      }
    },
    [mediaConstraints, setupMesh]
  );

  const hangUp = useCallback(() => {
    // Stop local media
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Dispose mesh
    if (meshRef.current) {
      meshRef.current.dispose();
      meshRef.current = null;
    }

    // Clear state
    setRemoteStreams(new Map());
    setIsInCall(false);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      hangUp();
    };
  }, [hangUp]);

  return {
    localStream: localStreamRef.current,
    remoteStreams,
    isInCall,
    error,
    startCall,
    joinCall,
    hangUp,
  };
}
