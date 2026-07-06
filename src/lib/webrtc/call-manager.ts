"use client";

import type { WebsocketProvider } from "y-websocket";
import type { AwarenessUser } from "@/lib/collaboration";
import type {
  CallManagerState,
  CallParticipant,
  CallSignal,
  MediaState,
} from "./types";
import { getRTCConfig } from "./types";

type Listener = () => void;

export class CallManager {
  private state: CallManagerState = {
    status: "idle",
    participants: new Map(),
    localStream: null,
    screenStream: null,
    audioEnabled: true,
    videoEnabled: true,
    screenEnabled: false,
    error: null,
  };

  private awareness: WebsocketProvider["awareness"];
  private documentId: string;
  private userName: string;
  private userColor: string;
  private myClientId = -1;
  private listeners = new Set<Listener>();
  private signalUnsubscribe: (() => void) | null = null;
  private seenSignals = new Set<string>();

  constructor(
    documentId: string,
    userName: string,
    userColor: string,
    awareness: WebsocketProvider["awareness"]
  ) {
    this.documentId = documentId;
    this.userName = userName;
    this.userColor = userColor;
    this.awareness = awareness;

    this.myClientId = this.awareness.clientID;

    this.signalUnsubscribe = this.subscribeToSignals();
  }

  getState(): CallManagerState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  private updateLocalAwareness(partial: Partial<AwarenessUser>) {
    const current = this.awareness.getLocalState() as AwarenessUser | null;
    if (current) {
      this.awareness.setLocalState({ ...current, ...partial });
    }
  }

  async startCall(): Promise<void> {
    if (this.state.status === "in-call") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      this.state = {
        ...this.state,
        status: "in-call",
        localStream: stream,
        audioEnabled: true,
        videoEnabled: true,
        screenEnabled: false,
        error: null,
      };

      this.updateLocalAwareness({
        callStatus: "in-call",
        mediaState: { audio: true, video: true, screen: false },
      });

      this.connectToExistingParticipants();
      this.emit();
    } catch (err) {
      this.state = { ...this.state, error: "Failed to access camera/microphone" };
      this.emit();
    }
  }

  async startAudioOnly(): Promise<void> {
    if (this.state.status === "in-call") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.state = {
        ...this.state,
        status: "in-call",
        localStream: stream,
        audioEnabled: true,
        videoEnabled: false,
        screenEnabled: false,
        error: null,
      };

      this.updateLocalAwareness({
        callStatus: "in-call",
        mediaState: { audio: true, video: false, screen: false },
      });

      this.connectToExistingParticipants();
      this.emit();
    } catch (err) {
      this.state = { ...this.state, error: "Failed to access microphone" };
      this.emit();
    }
  }

  joinCall(): void {
    if (this.state.status === "in-call") {
      this.startCall();
    }
  }

  async leaveCall(): Promise<void> {
    this.state.participants.forEach((p) => {
      p.peerConnection?.close();
      p.stream?.getTracks().forEach((t) => t.stop());
    });
    this.state.participants.clear();

    this.state.localStream?.getTracks().forEach((t) => t.stop());
    this.state.screenStream?.getTracks().forEach((t) => t.stop());

    this.updateLocalAwareness({
      callStatus: undefined,
      mediaState: undefined,
    });

    this.state = {
      status: "idle",
      participants: new Map(),
      localStream: null,
      screenStream: null,
      audioEnabled: false,
      videoEnabled: false,
      screenEnabled: false,
      error: null,
    };

    this.emit();
  }

  toggleAudio(): void {
    const enabled = !this.state.audioEnabled;
    this.state.localStream?.getAudioTracks().forEach((t) => {
      t.enabled = enabled;
    });
    this.state = { ...this.state, audioEnabled: enabled };
    this.broadcastMediaState();
    this.emit();
  }

  toggleVideo(): void {
    const enabled = !this.state.videoEnabled;
    this.state.localStream?.getVideoTracks().forEach((t) => {
      t.enabled = enabled;
    });
    this.state = { ...this.state, videoEnabled: enabled };
    this.broadcastMediaState();
    this.emit();
  }

  async startScreenShare(): Promise<void> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      screenStream.getVideoTracks()[0]!.onended = () => {
        this.stopScreenShare();
      };

      this.state = {
        ...this.state,
        screenStream,
        screenEnabled: true,
      };

      const videoTrack = screenStream.getVideoTracks()[0]!;
      this.state.participants.forEach((p) => {
        const sender = p.peerConnection
          ?.getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack).catch(() => {});
        }
      });

      // Also add screen track to new offers by renegotiating
      this.state.participants.forEach((p, clientId) => {
        this.renegotiateWithScreen(clientId);
      });

      this.broadcastMediaState();
      this.emit();
    } catch (err) {
      this.state = { ...this.state, error: "Failed to start screen sharing" };
      this.emit();
    }
  }

  stopScreenShare(): void {
    this.state.screenStream?.getTracks().forEach((t) => t.stop());

    const cameraTrack = this.state.localStream?.getVideoTracks()[0] ?? null;
    this.state.participants.forEach((p) => {
      const sender = p.peerConnection
        ?.getSenders()
        .find((s) => s.track?.kind === "video");
      if (sender && cameraTrack) {
        sender.replaceTrack(cameraTrack).catch(() => {});
      }
    });

    this.state = {
      ...this.state,
      screenStream: null,
      screenEnabled: false,
    };

    this.broadcastMediaState();
    this.emit();
  }

  private broadcastMediaState() {
    const mediaState: MediaState = {
      audio: this.state.audioEnabled,
      video: this.state.videoEnabled,
      screen: this.state.screenEnabled,
    };
    this.updateLocalAwareness({ mediaState });
  }

  private connectToExistingParticipants(): void {
    this.awareness.getStates().forEach((state, clientId) => {
      if (clientId === this.myClientId) return;
      const user = state as AwarenessUser;
      if (user?.callStatus === "in-call") {
        this.createPeerConnection(clientId, true);
      }
    });
  }

  private createPeerConnection(
    remoteClientId: number,
    isInitiator: boolean
  ): RTCPeerConnection {
    const existing = this.state.participants.get(remoteClientId);
    if (existing?.peerConnection) return existing.peerConnection;

    const pc = new RTCPeerConnection(getRTCConfig());

    if (this.state.localStream) {
      this.state.localStream.getTracks().forEach((track) => {
        if (track.kind === "video" && this.state.screenStream) {
          pc.addTrack(this.state.screenStream.getVideoTracks()[0]!, this.state.screenStream);
        } else {
          pc.addTrack(track, this.state.localStream!);
        }
      });
    }

    if (this.state.screenStream) {
      this.state.screenStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.state.screenStream!);
      });
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.sendSignal(remoteClientId, {
          type: "ice-candidate",
          target: remoteClientId,
          candidate: JSON.stringify(e.candidate),
        });
      }
    };

    pc.ontrack = (e) => {
      const participant = this.state.participants.get(remoteClientId);
      if (participant) {
        const newParticipants = new Map(this.state.participants);
        const existingStream = participant.stream;
        if (!existingStream) {
          const newStream = new MediaStream();
          newStream.addTrack(e.track);
          newParticipants.set(remoteClientId, {
            ...participant,
            stream: newStream,
          });
        } else {
          existingStream.addTrack(e.track);
        }
        this.state = { ...this.state, participants: newParticipants };
        this.emit();
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (
        pc.iceConnectionState === "disconnected" ||
        pc.iceConnectionState === "failed" ||
        pc.iceConnectionState === "closed"
      ) {
        this.removeParticipant(remoteClientId);
      }
    };

    const remoteState = this.awareness.getStates().get(remoteClientId) as AwarenessUser | undefined;
    const participant: CallParticipant = {
      clientId: remoteClientId,
      name: remoteState?.name ?? "Connecting...",
      color: remoteState?.color ?? "#666",
      stream: null,
      audioEnabled: remoteState?.mediaState?.audio ?? true,
      videoEnabled: remoteState?.mediaState?.video ?? true,
      screenEnabled: remoteState?.mediaState?.screen ?? false,
      peerConnection: pc,
    };

    const newParticipants = new Map(this.state.participants);
    newParticipants.set(remoteClientId, participant);
    this.state = { ...this.state, participants: newParticipants };

    if (isInitiator) {
      this.createOffer(remoteClientId, pc);
    }

    return pc;
  }

  private async createOffer(
    remoteClientId: number,
    pc: RTCPeerConnection
  ): Promise<void> {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.sendSignal(remoteClientId, {
        type: "offer",
        target: remoteClientId,
        sdp: JSON.stringify(offer),
      });
    } catch (err) {
      console.error("Failed to create offer:", err);
    }
  }

  private sendSignal(target: number, signal: CallSignal): void {
    this.updateLocalAwareness({
      signal: {
        type: signal.type,
        target: signal.target,
        sdp: signal.sdp,
        candidate: signal.candidate,
      },
    });
  }

  private subscribeToSignals(): () => void {
    const handler = () => {
      this.awareness.getStates().forEach((state, clientId) => {
        if (clientId === this.myClientId) return;

        const user = state as AwarenessUser;
        if (!user) return;

        if (user.signal) {
          const sig = user.signal;
          if (sig.target === this.myClientId) {
            const signalKey = `${clientId}:${sig.type}`;
            if (!this.seenSignals.has(signalKey)) {
              this.seenSignals.add(signalKey);
              this.handleSignal(clientId, {
                type: sig.type as CallSignal["type"],
                target: sig.target,
                sdp: sig.sdp,
                candidate: sig.candidate,
              });
            }
          }
        }

        const p = this.state.participants.get(clientId);
        if (p) {
          const needsUpdate =
            p.name !== (user.name ?? p.name) ||
            p.audioEnabled !== (user.mediaState?.audio ?? true) ||
            p.videoEnabled !== (user.mediaState?.video ?? true) ||
            p.screenEnabled !== (user.mediaState?.screen ?? false);
          if (needsUpdate) {
            const newParticipants = new Map(this.state.participants);
            newParticipants.set(clientId, {
              ...p,
              name: user.name || p.name,
              color: user.color || p.color,
              audioEnabled: user.mediaState?.audio ?? p.audioEnabled,
              videoEnabled: user.mediaState?.video ?? p.videoEnabled,
              screenEnabled: user.mediaState?.screen ?? p.screenEnabled,
            });
            this.state = { ...this.state, participants: newParticipants };
          }
        }
      });
    };

    this.awareness.on("change", handler);
    return () => this.awareness.off("change", handler);
  }

  private async handleSignal(
    fromClientId: number,
    signal: CallSignal
  ): Promise<void> {
    if (signal.type === "hangup") {
      this.removeParticipant(fromClientId);
      return;
    }

    if (signal.type === "offer") {
      // Someone new joined — create peer connection and respond with answer
      if (!signal.sdp) return;
      const pc = this.createPeerConnection(fromClientId, false);

      try {
        const offerDesc = JSON.parse(signal.sdp) as RTCSessionDescriptionInit;
        await pc.setRemoteDescription(new RTCSessionDescription(offerDesc));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.sendSignal(fromClientId, {
          type: "answer",
          target: fromClientId,
          sdp: JSON.stringify(answer),
        });
      } catch (err) {
        console.error("Failed to handle offer:", err);
      }
    } else if (signal.type === "answer") {
      if (!signal.sdp) return;
      const pc =
        this.state.participants.get(fromClientId)?.peerConnection ??
        this.createPeerConnection(fromClientId, false);

      try {
        const answerDesc = JSON.parse(signal.sdp) as RTCSessionDescriptionInit;
        await pc.setRemoteDescription(new RTCSessionDescription(answerDesc));
      } catch (err) {
        console.error("Failed to handle answer:", err);
      }
    } else if (signal.type === "ice-candidate") {
      if (!signal.candidate) return;
      const pc = this.state.participants.get(fromClientId)?.peerConnection;
      if (!pc) return;

      try {
        const candidate = JSON.parse(signal.candidate) as RTCIceCandidateInit;
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Failed to add ICE candidate:", err);
      }
    }
  }

  private removeParticipant(clientId: number): void {
    const participant = this.state.participants.get(clientId);
    if (participant) {
      participant.peerConnection?.close();
      participant.stream?.getTracks().forEach((t) => t.stop());
      const newParticipants = new Map(this.state.participants);
      newParticipants.delete(clientId);
      this.state = { ...this.state, participants: newParticipants };
      this.emit();
    }
  }

  private async renegotiateWithScreen(clientId: number): Promise<void> {
    const pc = this.state.participants.get(clientId)?.peerConnection;
    if (!pc || !this.state.screenStream) return;

    const videoTrack = this.state.screenStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const sender = pc.getSenders().find((s) => s.track?.kind === "video");
    if (sender) {
      sender.replaceTrack(videoTrack).catch(() => {});
    } else {
      pc.addTrack(videoTrack, this.state.screenStream);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.sendSignal(clientId, {
          type: "offer",
          target: clientId,
          sdp: JSON.stringify(offer),
        });
      } catch (err) {
        console.error("Failed to renegotiate:", err);
      }
    }
  }

  destroy(): void {
    this.leaveCall();
    this.signalUnsubscribe?.();
    this.signalUnsubscribe = null;
  }
}
