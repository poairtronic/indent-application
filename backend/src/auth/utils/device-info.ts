import { Request } from 'express';

export interface DeviceInfo {
  ipAddress: string;
  browser: string;
  operatingSystem: string;
  device: string;
}

export function extractDeviceInfo(req: Request): DeviceInfo {
  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    'unknown';

  const userAgent = (req.headers['user-agent'] as string) || 'unknown';
  const { browser, os, device } = parseUserAgent(userAgent);

  return {
    ipAddress,
    browser,
    operatingSystem: os,
    device,
  };
}

function parseUserAgent(ua: string): { browser: string; os: string; device: string } {
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';

  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('MSIE') || ua.includes('Trident')) browser = 'Internet Explorer';

  if (ua.includes('Windows NT 10')) os = 'Windows 10';
  else if (ua.includes('Windows NT 11')) os = 'Windows 11';
  else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
  else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('CrOS')) os = 'Chrome OS';

  if (ua.includes('Mobile')) device = 'Mobile';
  else if (ua.includes('iPad') || ua.includes('Tablet')) device = 'Tablet';
  else if (ua.includes('Android') && !ua.includes('Mobile')) device = 'Tablet';
  else device = 'Desktop';

  return { browser, os, device };
}
