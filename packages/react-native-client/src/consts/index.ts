const FISHJAM_URL_BASE =
  'https://cloud.fishjam.work/api/v1/connect/f9f9d5322e98411ca6238efeb551cdb8';
const FISHJAM_CONNECT_PATH = `${FISHJAM_URL_BASE}/connect`;

export const FISHJAM_HTTP_CONNECT_URL = `https://${FISHJAM_CONNECT_PATH}`;
export const FISHJAM_WS_CONNECT_URL = `wss://${FISHJAM_CONNECT_PATH}`;

const FISHJAM_LIVE_URL = `${FISHJAM_URL_BASE}/live`;

export const FISHJAM_WHIP_URL = `${FISHJAM_LIVE_URL}/api/whip`;
export const FISHJAM_WHEP_URL = `${FISHJAM_LIVE_URL}/api/whep`;
