export const SITE_NAME = "老年陪伴助手管理台";
export const SITE_DOMAIN = "digital-human.xn--876a.net";
export const SITE_URL = `https://${SITE_DOMAIN}`;
export const TRACK_API_PATH = "/api/track";
export const ADMIN_PATH = "/admin";

export function toAbsoluteUrl(pathname: string) {
  return new URL(pathname, SITE_URL).toString();
}