const FISHJAM_URL_BASE = 'fishjam.io/api/v1';
const FISHJAM_CONNECT_PATH = `${FISHJAM_URL_BASE}/connect`;

export const FISHJAM_HTTP_CONNECT_URL = `https://${FISHJAM_CONNECT_PATH}`;
export const FISHJAM_WS_CONNECT_URL = `wss://${FISHJAM_CONNECT_PATH}`;

const FISHJAM_LIVE_URL = `https://${FISHJAM_URL_BASE}/live`;

export const FISHJAM_WHIP_URL = `${FISHJAM_LIVE_URL}/api/whip`;
export const FISHJAM_WHEP_URL = `${FISHJAM_LIVE_URL}/api/whep`;
