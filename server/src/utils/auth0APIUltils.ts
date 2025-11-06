export interface Auth0UserInfo {
  sub: string;
  email: string;
  name?: string;
  nickname?: string;
  picture?: string;
  updated_at: string;
  email_verified: boolean;
  roleType: string[];
}

// Simple in-memory cache for user info
interface CacheEntry {
  data: Auth0UserInfo;
  timestamp: number;
}

const userInfoCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Decode JWT to get the sub without verification (we verify elsewhere)
function getSubFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.sub || null;
  } catch {
    return null;
  }
}

export async function fetchUserInfo(accessToken: string): Promise<Auth0UserInfo> {
  const now = Date.now();
  
  // Try to get user sub from token to check cache first
  const userSub = getSubFromToken(accessToken);
  
  if (userSub) {
    const cached = userInfoCache.get(userSub);
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    const response = await fetch(`https://${process.env['AUTH0_DOMAIN']}/userinfo`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    const userInfo = await response.json() as Auth0UserInfo;
    
    // Cache the result using the user's sub as key
    userInfoCache.set(userInfo.sub, {
      data: userInfo,
      timestamp: now
    });

    return userInfo;
  } catch (error) {
    // If we have stale cache data and the request fails, use it
    if (userSub) {
      const cached = userInfoCache.get(userSub);
      if (cached) {
        console.warn('Using stale cache data due to API error:', error);
        return cached.data;
      }
    }
    throw error;
  }
}

// Optional: Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of userInfoCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      userInfoCache.delete(key);
    }
  }
}, CACHE_TTL); // Clean up every 5 minutes

