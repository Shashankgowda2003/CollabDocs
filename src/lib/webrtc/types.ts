export type CallStatus = "idle" | "in-call";
export type ScreenShareStatus = "idle" | "sharing";

export interface CallSignal {
  type: "offer" | "answer" | "ice-candidate" | "hangup";
  target: number;
  sdp?: string;
  candidate?: string;
}

export interface MediaState {
  audio: boolean;
  video: boolean;
  screen: boolean;
}

export interface CallParticipant {
  clientId: number;
  name: string;
  color: string;
  stream: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenEnabled: boolean;
  peerConnection: RTCPeerConnection | null;
}

export interface CallManagerState {
  status: CallStatus;
  participants: Map<number, CallParticipant>;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenEnabled: boolean;
  error: string | null;
}

const STUN_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function getRTCConfig(): RTCConfiguration {
  return STUN_SERVERS;
}
