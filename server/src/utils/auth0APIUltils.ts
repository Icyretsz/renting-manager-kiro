export interface Auth0UserInfo {
  sub: string;
  email: string;
  name?: string;
  nickname?: string;
  pictur: string;
  updated_at: string;
  email_verified: boolean;
  roleType: string[];
}

export async function fetchUserInfo(accessToken: string): Promise<Auth0UserInfo> {
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

  return await response.json() as Auth0UserInfo;
}

