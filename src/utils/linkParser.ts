export type ParsedLink = VmessOutbound | VlessOutbound | ShadowsocksOutbound;

interface OutboundBase {
  tag: string;
  protocol: 'vmess' | 'vless' | 'shadowsocks';
  streamSettings?: StreamSettings;
}

export interface VmessOutbound extends OutboundBase {
  protocol: 'vmess';
  settings: {
    vnext: Array<{
      address: string;
      port: number;
      users: Array<{
        id: string;
        alterId: number;
        security: string;
        encryption?: string;
        level?: number;
        email?: string;
      }>;
    }>;
  };
}

export interface VlessOutbound extends OutboundBase {
  protocol: 'vless';
  settings: {
    vnext: Array<{
      address: string;
      port: number;
      users: Array<{
        id: string;
        encryption: string;
        flow?: string;
        level?: number;
        email?: string;
        security?: string;
      }>;
    }>;
  };
}

export interface ShadowsocksOutbound extends OutboundBase {
  protocol: 'shadowsocks';
  settings: {
    servers: Array<{
      address: string;
      port: number;
      method: string;
      password: string;
      plugin?: string;
      pluginOptions?: Record<string, string>;
    }>;
  };
}

export interface StreamSettings {
  network?: string;
  security?: 'tls' | 'reality';
  tlsSettings?: {
    serverName?: string;
    fingerprint?: string;
    alpn?: string[];
    allowInsecure?: boolean;
    ech?: string;
    enableEchPq?: boolean;
  };
  realitySettings?: {
    serverName?: string;
    fingerprint?: string;
    publicKey?: string;
    shortId?: string;
    spiderX?: string;
    show?: boolean;
    dest?: string;
    mport?: string;
    mldsa65Verify?: string;
  };
  wsSettings?: {
    path?: string;
    headers?: Record<string, string>;
  };
  grpcSettings?: {
    serviceName?: string;
    mode?: string;
  };
  packetEncoding?: string;
}

interface VmessConfig {
  v?: string;
  ps?: string;
  add: string;
  port: string | number;
  id: string;
  aid?: string | number;
  net?: string;
  type?: string;
  host?: string;
  path?: string;
  tls?: string;
  sni?: string;
  fp?: string;
  scy?: string;
  alpn?: string | string[];
  security?: string;
  level?: number;
  email?: string;
  allowInsecure?: string | boolean;
}

const parseBooleanParam = (value?: string | boolean | null): boolean | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return undefined;
};

const normalizeAlpn = (value?: string | string[] | null): string[] | undefined => {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const filtered = value.map((entry) => entry.trim()).filter(Boolean);
    return filtered.length > 0 ? filtered : undefined;
  }

  const segments = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  return segments.length > 0 ? segments : undefined;
};

const createStreamSettings = (options: {
  network?: string | null;
  security?: string | null;
  serverName?: string | null;
  fingerprint?: string | null;
  alpn?: string[] | undefined;
  echConfig?: string | null;
  echPqEnabled?: boolean | undefined;
  reality?: {
    publicKey?: string | null;
    shortId?: string | null;
    spiderX?: string | null;
    show?: boolean | undefined;
    dest?: string | null;
    mport?: string | null;
    mldsa65Verify?: string | null;
  };
  host?: string | null;
  path?: string | null;
  serviceName?: string | null;
  grpcMode?: string | null;
  packetEncoding?: string | null;
  allowInsecure?: boolean | undefined;
}): StreamSettings | undefined => {
  const streamSettings: StreamSettings = {};

  const networkValue = options.network?.toLowerCase();
  const network = networkValue === 'websocket' ? 'ws' : networkValue;
  if (network) {
    streamSettings.network = network;
  }

  if (options.packetEncoding) {
    streamSettings.packetEncoding = options.packetEncoding;
  }

  if (network === 'ws') {
    const wsSettings: StreamSettings['wsSettings'] = {};

    if (options.path) {
      wsSettings.path = options.path;
    }

    if (options.host) {
      wsSettings.headers = { Host: options.host };
    }

    if (Object.keys(wsSettings).length > 0) {
      streamSettings.wsSettings = wsSettings;
    }
  }

  if (network === 'grpc') {
    const grpcSettings: StreamSettings['grpcSettings'] = {};

    if (options.serviceName) {
      grpcSettings.serviceName = options.serviceName;
    }

    if (options.grpcMode) {
      grpcSettings.mode = options.grpcMode;
    }

    if (Object.keys(grpcSettings).length > 0) {
      streamSettings.grpcSettings = grpcSettings;
    }
  }

  const security = options.security?.toLowerCase();
  if (security === 'tls' || security === 'reality') {
    streamSettings.security = security;
  }

  if (security === 'tls') {
    const tlsSettings: NonNullable<StreamSettings['tlsSettings']> = {};

    if (options.serverName) {
      tlsSettings.serverName = options.serverName;
    }

    if (options.fingerprint) {
      tlsSettings.fingerprint = options.fingerprint;
    }

    if (options.alpn && options.alpn.length > 0) {
      tlsSettings.alpn = options.alpn;
    }

    if (options.allowInsecure !== undefined) {
      tlsSettings.allowInsecure = options.allowInsecure;
    }

    if (options.echConfig) {
      tlsSettings.ech = options.echConfig;

      if (options.echPqEnabled !== undefined) {
        tlsSettings.enableEchPq = options.echPqEnabled;
      }
    }

    if (Object.keys(tlsSettings).length > 0) {
      streamSettings.tlsSettings = tlsSettings;
    }
  }

  if (security === 'reality') {
    const realitySettings: NonNullable<StreamSettings['realitySettings']> = {};

    if (options.serverName) {
      realitySettings.serverName = options.serverName;
    }

    if (options.fingerprint) {
      realitySettings.fingerprint = options.fingerprint;
    }

    if (options.reality?.publicKey) {
      realitySettings.publicKey = options.reality.publicKey;
    }

    if (options.reality?.shortId) {
      realitySettings.shortId = options.reality.shortId;
    }

    if (options.reality?.spiderX) {
      realitySettings.spiderX = options.reality.spiderX;
    }

    if (options.reality?.show !== undefined) {
      realitySettings.show = options.reality.show;
    }

    if (options.reality?.dest) {
      realitySettings.dest = options.reality.dest;
    }

    if (options.reality?.mport) {
      realitySettings.mport = options.reality.mport;
    }

    if (options.reality?.mldsa65Verify) {
      realitySettings.mldsa65Verify = options.reality.mldsa65Verify;
    }

    if (Object.keys(realitySettings).length > 0) {
      streamSettings.realitySettings = realitySettings;
    }
  }

  if (Object.keys(streamSettings).length === 0) {
    return undefined;
  }

  return streamSettings;
};

export const parseLink = (link: string): ParsedLink | null => {
  if (link.startsWith('vmess://')) {
    return parseVmessLink(link);
  }

  if (link.startsWith('vless://')) {
    return parseVlessLink(link);
  }

  if (link.startsWith('ss://')) {
    return parseShadowsocksLink(link);
  }

  return null;
};

export const parseVmessLink = (link: string): VmessOutbound | null => {
  try {
    if (!link.startsWith('vmess://')) return null;

    const encoded = link.replace('vmess://', '');
    const decoded = atob(encoded);
    const vmessConfig: VmessConfig = JSON.parse(decoded);

    const port = parseInt(String(vmessConfig.port ?? ''), 10);
    if (!vmessConfig.add || Number.isNaN(port) || !vmessConfig.id) {
      return null;
    }

    const security = (vmessConfig.security ?? 'auto').toLowerCase();
    const fingerprint = vmessConfig.fp || vmessConfig.type || undefined;
    const alpn = normalizeAlpn(vmessConfig.alpn ?? null);
    const allowInsecure = parseBooleanParam(vmessConfig.allowInsecure ?? null);

    const streamSettings = createStreamSettings({
      network: vmessConfig.net || 'tcp',
      security: vmessConfig.tls || undefined,
      serverName: vmessConfig.sni || vmessConfig.host || vmessConfig.add,
      fingerprint,
      alpn,
      allowInsecure,
      host: vmessConfig.host || null,
      path: vmessConfig.path || null,
    });

    const user = {
      id: vmessConfig.id,
      alterId: parseInt(String(vmessConfig.aid ?? '0'), 10),
      security,
      encryption: vmessConfig.scy || undefined,
      level: vmessConfig.level,
      email: vmessConfig.email,
    };

    const outbound: VmessOutbound = {
      tag: vmessConfig.ps || 'vmess-link',
      protocol: 'vmess',
      settings: {
        vnext: [
          {
            address: vmessConfig.add,
            port,
            users: [user],
          },
        ],
      },
    };

    if (streamSettings) {
      outbound.streamSettings = streamSettings;
    }

    return outbound;
  } catch (error) {
    console.error('Error parsing Vmess link:', error);
    return null;
  }
};

export const parseVlessLink = (link: string): VlessOutbound | null => {
  try {
    if (!link.startsWith('vless://')) return null;

    const url = new URL(link);
    const uuid = url.username;
    if (!uuid) {
      return null;
    }

    const params = new URLSearchParams(url.search);
    const port = url.port ? parseInt(url.port, 10) : 443;

    let tag = 'vless-link';
    if (url.hash) {
      tag = decodeURIComponent(url.hash.substring(1));
    }

    const security = params.get('security')?.toLowerCase();
    const fingerprint = params.get('fp') || undefined;
    const alpn = normalizeAlpn(params.get('alpn'));
    const echConfig = params.get('ech') || undefined;
    const echPqEnabled = parseBooleanParam(
      params.get('echpq') || params.get('ech-pq') || params.get('ech_pq'),
    );
    const allowInsecure = parseBooleanParam(
      params.get('allowInsecure') || params.get('allow_insecure') || params.get('insecure'),
    );

    const realityOptions = security === 'reality'
      ? {
          publicKey: params.get('pbk'),
          shortId: params.get('sid'),
          spiderX: params.get('spx'),
          show: parseBooleanParam(params.get('show')),
          dest: params.get('dest'),
          mport: params.get('mport'),
          mldsa65Verify: params.get('mldsa65Verify'),
        }
      : undefined;

    const packetEncoding = params.get('packetEncoding') || params.get('packet_encoding') || null;

    const streamSettings = createStreamSettings({
      network: params.get('type') || params.get('transport') || 'tcp',
      security,
      serverName: params.get('sni') || url.hostname,
      fingerprint,
      alpn,
      echConfig,
      echPqEnabled,
      reality: realityOptions,
      host: params.get('host'),
      path: params.get('path'),
      serviceName: params.get('serviceName') || params.get('service_name'),
      grpcMode: params.get('mode'),
      packetEncoding,
      allowInsecure,
    });

    const user = {
      id: uuid,
      encryption: params.get('encryption') || 'none',
      flow: params.get('flow') || undefined,
      level: params.get('level') ? parseInt(params.get('level')!, 10) : undefined,
      email: params.get('email') || undefined,
      security: 'auto',
    };

    const outbound: VlessOutbound = {
      tag,
      protocol: 'vless',
      settings: {
        vnext: [
          {
            address: url.hostname,
            port,
            users: [user],
          },
        ],
      },
    };

    if (streamSettings) {
      outbound.streamSettings = streamSettings;
    }

    return outbound;
  } catch (error) {
    console.error('Error parsing Vless link:', error);
    return null;
  }
};

export const parseShadowsocksLink = (link: string): ShadowsocksOutbound | null => {
  try {
    if (!link.startsWith('ss://')) return null;

    const url = new URL(link);
    const tag = decodeURIComponent(url.hash.replace('#', '') || 'shadowsocks-link');

    const server = url.hostname;
    const port = parseInt(url.port, 10);

    if (!server || Number.isNaN(port)) {
      return null;
    }

    let method: string | undefined;
    let password: string | undefined;

    if (url.username && url.password) {
      method = decodeURIComponent(url.username);
      password = decodeURIComponent(url.password);
    } else if (url.username) {
      try {
        const decoded = atob(url.username);
        const [decodedMethod, decodedPassword] = decoded.split(':');
        if (decodedMethod && decodedPassword) {
          method = decodedMethod;
          password = decodedPassword;
        }
      } catch (error) {
        console.error('Unable to decode Shadowsocks credentials:', error);
      }
    }

    if (!method || !password) {
      const withoutScheme = link.replace(/^ss:\/\//, '');
      const mainSection = withoutScheme.split('#')[0].split('?')[0];
      const credentialPart = mainSection.includes('@')
        ? mainSection.split('@')[0]
        : mainSection;

      try {
        const decoded = atob(credentialPart);
        const [decodedMethod, rest] = decoded.split(':');
        const [decodedPassword] = rest ? rest.split('@') : [];
        if (decodedMethod && decodedPassword) {
          method = decodedMethod;
          password = decodedPassword;
        }
      } catch (error) {
        console.error('Unable to decode Shadowsocks credentials from fallback:', error);
      }
    }

    if (!method || !password) {
      return null;
    }

    const params = new URLSearchParams(url.search);
    const pluginParam = params.get('plugin');
    let plugin: string | undefined;
    let pluginOptions: Record<string, string> | undefined;

    if (pluginParam) {
      const segments = pluginParam.split(';');
      plugin = segments.shift() || undefined;

      const options: Record<string, string> = {};
      segments.forEach((segment) => {
        if (!segment) return;
        const [key, value] = segment.split('=');
        if (key) {
          options[key] = value ?? '';
        }
      });

      if (Object.keys(options).length > 0) {
        pluginOptions = options;
      }
    }

    const fp = params.get('fp') || undefined;
    const allowInsecure = parseBooleanParam(
      params.get('allowInsecure') || params.get('allow_insecure') || params.get('insecure'),
    );

    const streamSettings = createStreamSettings({
      network: params.get('type') || pluginOptions?.mode || undefined,
      security: params.get('security') || undefined,
      serverName: params.get('sni') || server,
      fingerprint: fp,
      host: params.get('host') || pluginOptions?.host || null,
      path: params.get('path') || pluginOptions?.path || null,
      serviceName: params.get('serviceName') || params.get('service_name') || pluginOptions?.serviceName || null,
      packetEncoding: params.get('packetEncoding') || params.get('packet_encoding') || null,
      allowInsecure,
    });

    const outbound: ShadowsocksOutbound = {
      tag,
      protocol: 'shadowsocks',
      settings: {
        servers: [
          {
            address: server,
            port,
            method,
            password,
            plugin,
            pluginOptions,
          },
        ],
      },
    };

    if (!plugin) {
      delete outbound.settings.servers[0].plugin;
    }

    if (!pluginOptions) {
      delete outbound.settings.servers[0].pluginOptions;
    }

    if (streamSettings) {
      outbound.streamSettings = streamSettings;
    }

    return outbound;
  } catch (error) {
    console.error('Error parsing Shadowsocks link:', error);
    return null;
  }
};
