export interface Auth0UserInfo {
  sub: string;
  email: string;
  name?: string;
  nickname?: string;
  'https://rental-app.com/roles'?: string[];
  [key: string]: any;
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

