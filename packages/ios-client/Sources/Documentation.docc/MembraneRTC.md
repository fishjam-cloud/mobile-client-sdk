# ``MembraneRTC``

MembraneRTC client.

The client is responsible for relaying MembraneRTC Engine specific messages through given reliable transport layer.
Once initialized, the client is responsbile for exchaning necessary messages via provided `EventTransport` and managing underlying
`RTCPeerConnection`. The goal of the client is to be as lean as possible, meaning that all activies regarding the session such as moderating
should be implemented by the user himself on top of the `MembraneRTC`.

The user's ability of interacting with the client is greatly liimited to the essential actions such as joining/leaving the session,
adding/removing local tracks and receiving information about remote peers and their tracks that can be played by the user.

User can request 3 different types of local tracks that will get forwareded to the server by the client:
- `LocalAudioTrack` - an audio track utilizing device's microphone
- `LocalVideoTrack` - a video track that can utilize device's camera or if necessay use video playback from a file (useful for testing with a simulator)
- `LocalBroadcastScreenTrack` - a screen share track taking advantage of `Broadcast Upload Extension` to record device's screen even if the app is minimized

It is recommended to request necessary audio and video tracks before joining the room but it does not mean it can't be done afterwards (in case of screen share)

Once the user received `onConnected` notification they can call the `join` method to initialize joining the session.
After receiving `onJoinSuccess` a user will receive notification about various peers joining/leaving the session, new tracks being published and ready for playback
or going inactive.

