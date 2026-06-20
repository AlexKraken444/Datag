// Datag — WebRTC ICE config used by both HostController and PeerClient.
// STUN: Google's free public servers.
// TURN: Metered's free OpenRelay (rate-limited but reliable enough for
//       casual play). Replace with your own TURN credentials if you want
//       guaranteed throughput.

export const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
    {
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
      ],
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};
