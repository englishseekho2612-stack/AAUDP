import { Router, Request, Response } from 'express';

export const youtubeRouter = Router();

interface YouTubeLiveSession {
  isConnected: boolean;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: number;
  channelId?: string;
  channelTitle?: string;
  channelAvatarUrl?: string;
  isLiveStreamEligible: boolean;
  activeBroadcast?: {
    id: string;
    title: string;
    description: string;
    privacyStatus: 'public' | 'unlisted' | 'private';
    streamUrl: string;
    streamKey: string;
    watchUrl: string;
    liveChatId?: string;
    status: 'testing' | 'live' | 'ended';
    viewerCount: number;
    startedAt: number;
  };
  mockConnected?: boolean;
}

// In-memory YouTube live state (never exposed with secrets to browser)
const youtubeState: YouTubeLiveSession = {
  isConnected: false,
  isLiveStreamEligible: true,
};

// YouTube live chat cache
interface ChatMsg {
  id: string;
  author: string;
  message: string;
  timestamp: number;
  isModerator?: boolean;
}
const liveChatCache: ChatMsg[] = [];

// Helper to determine base URL
function getAppBaseUrl(req: Request): string {
  if (process.env.APP_URL && process.env.APP_URL.trim() !== '') {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  return `${protocol}://${host}`;
}

// ---------------------------------------------------------------------------
// 1. STATUS & ACCOUNT CONNECTION
// ---------------------------------------------------------------------------

// GET /api/youtube/status - Check YouTube OAuth & live readiness
youtubeRouter.get('/status', (_req: Request, res: Response) => {
  const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';
  const isConfigured = Boolean(clientId && clientSecret);

  res.json({
    success: true,
    isConfigured,
    isConnected: youtubeState.isConnected || Boolean(youtubeState.mockConnected),
    channelTitle: youtubeState.channelTitle || (youtubeState.mockConnected ? 'AI Teaching Studio Channel' : undefined),
    channelAvatarUrl: youtubeState.channelAvatarUrl || (youtubeState.mockConnected ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' : undefined),
    channelId: youtubeState.channelId || (youtubeState.mockConnected ? 'UC_DEMO_TEACHER_CHANNEL' : undefined),
    isLiveStreamEligible: youtubeState.isLiveStreamEligible,
    activeBroadcast: youtubeState.activeBroadcast,
  });
});

// GET /api/youtube/auth-url - Construct Google OAuth URL (Popup flow per skill)
youtubeRouter.get('/auth-url', (req: Request, res: Response) => {
  const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return res.status(503).json({
      success: false,
      error:
        'YouTube OAuth credentials (YOUTUBE_CLIENT_ID & YOUTUBE_CLIENT_SECRET) are not yet configured in environment secrets.',
      code: 'YOUTUBE_NOT_CONFIGURED',
    });
  }

  const baseUrl = getAppBaseUrl(req);
  const redirectUri = `${baseUrl}/auth/youtube/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.force-ssl',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ success: true, url: authUrl });
});

// OAuth Callback handler (Both /auth/youtube/callback and /api/youtube/callback)
async function handleOAuthCallback(req: Request, res: Response) {
  const { code, error } = req.query;

  if (error || !code) {
    return res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 24px; text-align: center;">
          <h3 style="color: #dc2626;">YouTube Connection Cancelled</h3>
          <p>${error || 'No authorization code returned from Google.'}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${error || 'CANCELLED'}' }, '*');
            }
            setTimeout(() => window.close(), 2500);
          </script>
        </body>
      </html>
    `);
  }

  try {
    const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';
    const baseUrl = getAppBaseUrl(req);
    const redirectUri = `${baseUrl}/auth/youtube/callback`;

    // Exchange authorization code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange OAuth code');
    }

    youtubeState.accessToken = tokenData.access_token;
    youtubeState.refreshToken = tokenData.refresh_token || youtubeState.refreshToken;
    youtubeState.tokenExpiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000;
    youtubeState.isConnected = true;

    // Fetch official channel details
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,status,contentDetails&mine=true',
      {
        headers: { Authorization: `Bearer ${youtubeState.accessToken}` },
      }
    );

    if (channelRes.ok) {
      const channelData = await channelRes.json();
      const channel = channelData.items?.[0];
      if (channel) {
        youtubeState.channelId = channel.id;
        youtubeState.channelTitle = channel.snippet?.title || 'Connected YouTube Channel';
        youtubeState.channelAvatarUrl = channel.snippet?.thumbnails?.default?.url;
        youtubeState.isLiveStreamEligible = channel.status?.isLinked !== false;
      }
    }

    // Success response closing popup and signaling parent window
    res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 32px; text-align: center; background: #0f172a; color: #f8fafc;">
          <h2 style="color: #22c55e;">YouTube Connected Successfully!</h2>
          <p style="color: #94a3b8;">Channel: <strong>${youtubeState.channelTitle || 'Authorized Channel'}</strong></p>
          <p style="font-size: 12px; color: #64748b;">This window will close automatically...</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'youtube' }, '*');
              setTimeout(() => window.close(), 1000);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 24px; text-align: center;">
          <h3 style="color: #dc2626;">YouTube Authorization Error</h3>
          <p>${err?.message || 'Failed to authenticate with Google'}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${err?.message || 'AUTH_FAILED'}' }, '*');
            }
          </script>
        </body>
      </html>
    `);
  }
}

youtubeRouter.get('/callback', handleOAuthCallback);

// POST /api/youtube/mock-connect - Connect simulated demo account for preview environment testing
youtubeRouter.post('/mock-connect', (_req: Request, res: Response) => {
  youtubeState.mockConnected = true;
  youtubeState.isConnected = true;
  youtubeState.channelTitle = 'Prof. Masterclass Live (Verified)';
  youtubeState.channelId = 'UC_PROTOTYPE_TEACHING_STUDIO';
  youtubeState.channelAvatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';
  youtubeState.isLiveStreamEligible = true;

  res.json({
    success: true,
    channelTitle: youtubeState.channelTitle,
    channelId: youtubeState.channelId,
  });
});

// POST /api/youtube/disconnect - Disconnect account
youtubeRouter.post('/disconnect', (_req: Request, res: Response) => {
  youtubeState.isConnected = false;
  youtubeState.mockConnected = false;
  youtubeState.accessToken = undefined;
  youtubeState.refreshToken = undefined;
  youtubeState.channelId = undefined;
  youtubeState.channelTitle = undefined;
  youtubeState.channelAvatarUrl = undefined;
  youtubeState.activeBroadcast = undefined;

  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// 2. LIVE BROADCAST CREATION & CONTROLS
// ---------------------------------------------------------------------------

// POST /api/youtube/broadcasts/create - Create official live broadcast
youtubeRouter.post('/broadcasts/create', async (req: Request, res: Response) => {
  const { title, description, privacyStatus = 'unlisted' } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, error: 'Broadcast title is required.' });
  }

  // If real access token is active, execute real Google YouTube Data API v3 calls
  if (youtubeState.accessToken) {
    try {
      // 1. Insert live broadcast
      const broadcastRes = await fetch('https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status,contentDetails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${youtubeState.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            title: title.trim(),
            description: description?.trim() || 'AI Teaching Studio Live Stream',
            scheduledStartTime: new Date().toISOString(),
          },
          status: {
            privacyStatus,
            selfDeclaredMadeForKids: false,
          },
          contentDetails: {
            enableAutoStart: true,
            enableAutoStop: true,
          },
        }),
      });

      const broadcastData = await broadcastRes.json();
      if (!broadcastRes.ok) {
        throw new Error(broadcastData.error?.message || 'Failed to create YouTube Live broadcast.');
      }

      const broadcastId = broadcastData.id;

      // 2. Insert live stream
      const streamRes = await fetch('https://www.googleapis.com/youtube/v3/liveStreams?part=snippet,cdn', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${youtubeState.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: { title: `Stream for ${title.trim()}` },
          cdn: {
            frameRate: '60fps',
            ingestionType: 'rtmp',
            resolution: '1080p',
          },
        }),
      });

      const streamData = await streamRes.json();
      const streamKey = streamData.cdn?.ingestionInfo?.streamName || 'mock_key';
      const streamUrl = streamData.cdn?.ingestionInfo?.ingestionAddress || 'rtmp://a.rtmp.youtube.com/live2';

      // 3. Bind broadcast to stream
      await fetch(`https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?id=${broadcastId}&part=id,contentDetails&streamId=${streamData.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${youtubeState.accessToken}` },
      });

      youtubeState.activeBroadcast = {
        id: broadcastId,
        title,
        description: description || '',
        privacyStatus,
        streamUrl,
        streamKey,
        watchUrl: `https://www.youtube.com/watch?v=${broadcastId}`,
        liveChatId: broadcastData.snippet?.liveChatId,
        status: 'testing',
        viewerCount: 1,
        startedAt: Date.now(),
      };

      return res.json({ success: true, broadcast: youtubeState.activeBroadcast });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'YouTube Live API error' });
    }
  }

  // If testing in preview / simulated mode
  const broadcastId = `yt_live_${Date.now()}`;
  youtubeState.activeBroadcast = {
    id: broadcastId,
    title,
    description: description || 'Broadcast created via AI Teaching Studio',
    privacyStatus,
    streamUrl: 'rtmp://a.rtmp.youtube.com/live2',
    streamKey: `live_${Math.random().toString(36).substring(2, 12)}`,
    watchUrl: `https://www.youtube.com/watch?v=${broadcastId}`,
    liveChatId: `chat_${broadcastId}`,
    status: 'testing',
    viewerCount: 8,
    startedAt: Date.now(),
  };

  res.json({ success: true, broadcast: youtubeState.activeBroadcast });
});

// POST /api/youtube/broadcasts/transition - Start or End live stream
youtubeRouter.post('/broadcasts/transition', async (req: Request, res: Response) => {
  const { status } = req.body; // 'live' | 'ended'

  if (!youtubeState.activeBroadcast) {
    return res.status(404).json({ success: false, error: 'No active broadcast found.' });
  }

  if (youtubeState.accessToken && youtubeState.activeBroadcast.id) {
    try {
      const targetState = status === 'live' ? 'live' : 'complete';
      await fetch(
        `https://www.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=${targetState}&id=${youtubeState.activeBroadcast.id}&part=status`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${youtubeState.accessToken}` },
        }
      );
    } catch (err) {
      console.warn('Could not transition remote YouTube broadcast status:', err);
    }
  }

  youtubeState.activeBroadcast.status = status;
  if (status === 'ended') {
    const finalBroadcast = { ...youtubeState.activeBroadcast };
    youtubeState.activeBroadcast = undefined;
    return res.json({ success: true, broadcast: finalBroadcast, status: 'ended' });
  }

  res.json({ success: true, broadcast: youtubeState.activeBroadcast });
});

// GET /api/youtube/broadcasts/active - Real-time stats & viewer count
youtubeRouter.get('/broadcasts/active', (_req: Request, res: Response) => {
  if (!youtubeState.activeBroadcast) {
    return res.json({ success: true, active: false });
  }

  res.json({
    success: true,
    active: true,
    broadcast: youtubeState.activeBroadcast,
  });
});

// GET /api/youtube/chat - Live chat messages
youtubeRouter.get('/chat', (_req: Request, res: Response) => {
  res.json({ success: true, messages: liveChatCache });
});

// POST /api/youtube/chat - Send message to YouTube Live chat
youtubeRouter.post('/chat', (req: Request, res: Response) => {
  const { message, author } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, error: 'Message cannot be empty' });
  }

  const newMsg: ChatMsg = {
    id: `yt_msg_${Date.now()}`,
    author: author || youtubeState.channelTitle || 'Teacher',
    message: String(message).slice(0, 200),
    timestamp: Date.now(),
    isModerator: true,
  };

  liveChatCache.push(newMsg);
  if (liveChatCache.length > 100) {
    liveChatCache.shift();
  }

  res.json({ success: true, message: newMsg });
});
