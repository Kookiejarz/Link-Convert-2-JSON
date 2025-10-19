export type ParsedLink = ParsedVmessLink | ParsedVlessLink | ParsedShadowsocksLink;

interface ParsedLinkBase {
  type: 'vmess' | 'vless' | 'shadowsocks';
  tag: string;
  server: string;
  port: number;
}

export interface ParsedTlsConfig {
  security: 'tls' | 'reality';
  serverName?: string;
  fingerprint?: string;
  alpn?: string[];
  ech?: {
    config: string;
    pqSignatureSchemesEnabled?: boolean;
  };
  reality?: RealitySettings;
}

export interface RealitySettings {
  publicKey?: string;
  shortId?: string;
  spiderX?: string;
}

export interface ParsedTransportConfig {
  type: string;
  host?: string;
  path?: string;
  serviceName?: string;
}

export interface ParsedVmessLink extends ParsedLinkBase {
  type: 'vmess';
  uuid: string;
  security: string;
  alterId: number;
  network?: string;
  encryption?: string;
  tls?: ParsedTlsConfig;
  transport?: ParsedTransportConfig;
}

export interface ParsedVlessLink extends ParsedLinkBase {
  type: 'vless';
  uuid: string;
  encryption: string;
  security?: string;
  flow?: string;
  packetEncoding?: string;
  sni?: string;
  fingerprint?: string;
  alpn?: string[];
  ech?: string;
  echPqEnabled?: boolean;
  reality?: RealitySettings;
  tls?: ParsedTlsConfig;
  transport?: ParsedTransportConfig;
}

export interface ParsedShadowsocksLink extends ParsedLinkBase {
  type: 'shadowsocks';
  method: string;
  password: string;
  plugin?: string;
  pluginOptions?: Record<string, string>;
  tls?: ParsedTlsConfig;
  transport?: ParsedTransportConfig;
}

interface BuildTlsOptions {
  security?: string;
  serverName?: string;
  fingerprint?: string;
  alpn?: string[];
  echConfig?: string;
  echPqEnabled?: boolean;
  reality?: RealitySettings;
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
}

const parseBooleanParam = (value?: string | null): boolean | undefined => {
  if (value === null || value === undefined) {
    return undefined;
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

const buildTlsConfig = ({
  security,
  serverName,
  fingerprint,
  alpn,
  echConfig,
  echPqEnabled,
  reality,
}: BuildTlsOptions): ParsedTlsConfig | undefined => {
  if (!security) {
    return undefined;
  }

  const normalizedSecurity = security.toLowerCase();

  if (normalizedSecurity !== 'tls' && normalizedSecurity !== 'reality') {
    return undefined;
  }

  const tlsConfig: ParsedTlsConfig = {
    security: normalizedSecurity,
  };

  if (serverName) {
    tlsConfig.serverName = serverName;
  }

  if (fingerprint) {
    tlsConfig.fingerprint = fingerprint;
  }

  if (alpn && alpn.length > 0) {
    tlsConfig.alpn = alpn;
  }

  if (echConfig) {
    tlsConfig.ech = {
      config: echConfig,
    };

    if (echPqEnabled !== undefined) {
      tlsConfig.ech.pqSignatureSchemesEnabled = echPqEnabled;
    }
  }

  if (normalizedSecurity === 'reality' && reality) {
    const realityConfig: RealitySettings = {};

    if (reality.publicKey) {
      realityConfig.publicKey = reality.publicKey;
    }

    if (reality.shortId) {
      realityConfig.shortId = reality.shortId;
    }

    if (reality.spiderX) {
      realityConfig.spiderX = reality.spiderX;
    }

    if (Object.keys(realityConfig).length > 0) {
      tlsConfig.reality = realityConfig;
    }
  }

  return tlsConfig;
};

const buildTransportConfig = (
  type?: string | null,
  path?: string | null,
  host?: string | null,
  serviceName?: string | null,
): ParsedTransportConfig | undefined => {
  if (!type) {
    return undefined;
  }

  const normalized = type.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  let transportType = normalized;
  if (normalized === 'websocket') {
    transportType = 'ws';
  }

  const transport: ParsedTransportConfig = {
    type: transportType,
  };

  if (host) {
    transport.host = host;
  }

  if (path) {
    transport.path = path;
  }

  if (serviceName) {
    transport.serviceName = serviceName;
  }

  return transport;
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

export const parseVmessLink = (link: string): ParsedVmessLink | null => {
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
    const fingerprint = vmessConfig.fp || vmessConfig.type;

    const tls = buildTlsConfig({
      security: vmessConfig.tls,
      serverName: vmessConfig.sni || vmessConfig.host || vmessConfig.add,
      fingerprint,
      alpn: normalizeAlpn(vmessConfig.alpn ?? null),
    });

    const transport = buildTransportConfig(
      vmessConfig.net,
      vmessConfig.path,
      vmessConfig.host,
      undefined,
    );

    const result: ParsedVmessLink = {
      type: 'vmess',
      tag: vmessConfig.ps || 'vmess-link',
      server: vmessConfig.add,
      port,
      uuid: vmessConfig.id,
      security,
      alterId: parseInt(String(vmessConfig.aid ?? '0'), 10),
    };

    if (vmessConfig.net) {
      result.network = vmessConfig.net;
    }

    if (vmessConfig.scy) {
      result.encryption = vmessConfig.scy;
    }

    if (tls) {
      result.tls = tls;
    }

    if (transport) {
      result.transport = transport;
    }

    return result;
  } catch (error) {
    console.error('Error parsing Vmess link:', error);
    return null;
  }
};

export const parseVlessLink = (link: string): ParsedVlessLink | null => {
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

    const realitySettings = security === 'reality'
      ? {
          publicKey: params.get('pbk') || undefined,
          shortId: params.get('sid') || undefined,
          spiderX: params.get('spx') || undefined,
        }
      : undefined;

    const tls = buildTlsConfig({
      security,
      serverName: params.get('sni') || url.hostname,
      fingerprint,
      alpn,
      echConfig,
      echPqEnabled,
      reality: realitySettings,
    });

    const transport = buildTransportConfig(
      params.get('type') || params.get('transport'),
      params.get('path'),
      params.get('host'),
      params.get('serviceName') || params.get('service_name'),
    );

    const packetEncoding = params.get('packetEncoding') || params.get('packet_encoding') || undefined;

    const result: ParsedVlessLink = {
      type: 'vless',
      tag,
      server: url.hostname,
      port,
      uuid,
      encryption: params.get('encryption') || 'none',
    };

    if (security) {
      result.security = security;
    }

    if (params.get('flow')) {
      result.flow = params.get('flow') || undefined;
    }

    if (packetEncoding) {
      result.packetEncoding = packetEncoding;
    }

    if (params.get('sni')) {
      result.sni = params.get('sni') || undefined;
    }

    if (fingerprint) {
      result.fingerprint = fingerprint;
    }

    if (alpn) {
      result.alpn = alpn;
    }

    if (echConfig) {
      result.ech = echConfig;
    }

    if (echPqEnabled !== undefined) {
      result.echPqEnabled = echPqEnabled;
    }

    if (realitySettings && Object.values(realitySettings).some(Boolean)) {
      result.reality = realitySettings;
    }

    if (tls) {
      result.tls = tls;
    }

    if (transport) {
      result.transport = transport;
    }

    return result;
  } catch (error) {
    console.error('Error parsing Vless link:', error);
    return null;
  }
};

export const parseShadowsocksLink = (link: string): ParsedShadowsocksLink | null => {
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

    let tls = buildTlsConfig({
      security: params.get('security') || undefined,
      serverName: params.get('sni') || server,
      fingerprint: fp,
    });

    if (!tls && pluginOptions && pluginOptions.tls === 'true') {
      tls = buildTlsConfig({
        security: 'tls',
        serverName: pluginOptions.host || server,
        fingerprint: fp,
      });
    }

    const transport = buildTransportConfig(
      params.get('type') || pluginOptions?.mode || null,
      params.get('path') || pluginOptions?.path || null,
      params.get('host') || pluginOptions?.host || null,
      params.get('serviceName') || params.get('service_name') || pluginOptions?.serviceName || null,
    );

    const result: ParsedShadowsocksLink = {
      type: 'shadowsocks',
      tag,
      server,
      port,
      method,
      password,
    };

    if (plugin) {
      result.plugin = plugin;
    }

    if (pluginOptions) {
      result.pluginOptions = pluginOptions;
    }

    if (tls) {
      result.tls = tls;
    }

    if (transport) {
      result.transport = transport;
    }

    return result;
  } catch (error) {
    console.error('Error parsing Shadowsocks link:', error);
    return null;
  }
};
