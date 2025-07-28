// import { FISHJAM_HTTP_CONNECT_URL } from '../consts';
import { RoomType } from '../types';

type BasicInfo = { id: string; name: string };
type RoomManagerResponse = {
  peerToken: string;
  url: string;
  room: BasicInfo;
  peer: BasicInfo;
};

export type UseSandboxProps =
  | { fishjamId: string; fishjamUrl?: never }
  | { fishjamId?: never; fishjamUrl: string };

export const useSandbox = ({ fishjamId, fishjamUrl }: UseSandboxProps) => {
  const managerUrl = 'http://192.168.82.72:8080/api/rooms';

  const getSandboxPeerToken = async (
    roomName: string,
    peerName: string,
    roomType: RoomType = 'conference',
  ) => {
    try {
      const url = new URL(managerUrl);
      url.searchParams.set('roomName', roomName);
      url.searchParams.set('peerName', peerName);
      url.searchParams.set('roomType', roomType);

      const res = await fetch(url.toString());

      if (!res.ok) {
        throw new Error(
          `Room '${roomName}' or peer '${peerName}' does not exist or cannot retrieve peer token.`,
        );
      }
      const data: RoomManagerResponse = await res.json();
      return data.peerToken;
    } catch (error) {
      throw new Error(
        `Failed to get peer token for room '${roomName}', peer '${peerName}': ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };

  const getSandboxViewerToken = async (roomName: string) => {
    try {
      const url = new URL(`${managerUrl}/${roomName}/livestream-viewer-token`);
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(
          `Room '${roomName}' does not exist or cannot retrieve viewer token.`,
        );
      }

      const data: { token: string } = await res.json();

      return data.token;
    } catch (error) {
      throw new Error(
        `Failed to get viewer token for room '${roomName}': ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };

  const getSandboxLivestream = async (
    roomName: string,
    isPublic: boolean = false,
  ) => {
    const url = new URL(`${managerUrl}/livestream`);
    url.searchParams.set('roomName', roomName);
    url.searchParams.set('public', isPublic.toString());

    console.log({ sanurl: url.toString() });
    const res = await fetch(url);
    if (!res.ok) {
      console.log(await res.json());
      throw new Error(
        `Failed to retrieve streamer token for '${roomName}' livestream room.`,
      );
    }

    const data = await res.json();
    return data as {
      streamerToken: string;
      room: { id: string; name: string };
    };
  };

  return {
    getSandboxPeerToken,
    getSandboxViewerToken,
    getSandboxLivestream,
  };
};
