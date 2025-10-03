import { FISHJAM_HTTP_CONNECT_URL } from '../consts';

export const getFishjamUrl = (fishjamId: string): string => {
  try {
    return new URL(fishjamId).href;
  } catch {
    return `${FISHJAM_HTTP_CONNECT_URL}/${fishjamId}`;
  }
};
