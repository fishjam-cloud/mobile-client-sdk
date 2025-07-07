import { FISHJAM_HTTP_CONNECT_URL } from '../consts';
import { RoomType } from '../types';

type BasicInfo = { id: string; name: string };

type RoomManagerResponse = {
  peerToken: string;
  url: string;
  room: BasicInfo;
  peer: BasicInfo;
};

type UseSandboxProps =
  | { fishjamId: string; fishjamUrl?: never }
  | { fishjamId?: never; fishjamUrl: string };

export const useSandbox = ({ fishjamId, fishjamUrl }: UseSandboxProps) => {
  const managerUrl = fishjamUrl
    ? `${fishjamUrl}/room-manager`
    : `${FISHJAM_HTTP_CONNECT_URL}/${fishjamId}/room-manager`;

  const getSandboxPeerToken = async (
    roomName: string,
    peerName: string,
    roomType: RoomType = 'conference',
  ) => {
    const url = new URL(managerUrl);
    url.searchParams.set('roomName', roomName);
    url.searchParams.set('peerName', peerName);
    url.searchParams.set('roomType', roomType);

    const res = await fetch(url.toString());
    const data: RoomManagerResponse = await res.json();
    return data.peerToken;
  };

  const getSandboxViewerToken = async (roomName: string) => {
    const url = new URL(`${managerUrl}/${roomName}/livestream-viewer-token`);

    const res = await fetch(url);
    const data: { token: string } = await res.json();

    return data.token;
  };

  return {
    getSandboxPeerToken,
    getSandboxViewerToken,
  };
};
