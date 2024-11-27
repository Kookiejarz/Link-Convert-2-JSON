interface VmessConfig {
  v: string;
  ps: string;
  add: string;
  port: string;
  id: string;
  aid: string;
  net: string;
  type: string;
  host: string;
  path: string;
  tls: string;
}

interface VlessConfig {
  id: string;
  address: string;
  port: string;
  encryption?: string;
  flow?: string;
  security?: string;
  sni?: string;
  fp?: string;
  type?: string;
  path?: string;
  host?: string;
}

interface ShadowsocksConfig {
  server: string;
  server_port: number;
  method: string;
  password: string;
  plugin?: string;
  plugin_opts?: string;
}

export const parseLink = (link: string): object | null => {
  if (link.startsWith('vmess://')) {
    return parseVmessLink(link);
  } else if (link.startsWith('vless://')) {
    return parseVlessLink(link);
  } else if (link.startsWith('ss://')) {
    return parseShadowsocksLink(link);
  }
  return null;
};

export const parseVmessLink = (link: string): object | null => {
  try {
    if (!link.startsWith('vmess://')) return null;
    
    const decoded = atob(link.replace('vmess://', ''));
    const vmessConfig: VmessConfig = JSON.parse(decoded);

    const result = {
      type: "vmess",
      tag: vmessConfig.ps || "vmess-link",
      server: vmessConfig.add,
      server_port: parseInt(String(vmessConfig.port), 10),
      uuid: vmessConfig.id,
      security: vmessConfig.scy || 'auto',
      alterId: parseInt(vmessConfig.aid || '0', 10),
      network: vmessConfig.net,
    };

    // Add TLS configuration if present
    if (vmessConfig.tls) {
      result['tls'] = buildTlsConfig(vmessConfig.tls, vmessConfig.host);
    }

    // Add transport configuration
    result['transport'] = buildTransportConfig(
      vmessConfig.net,
      vmessConfig.path,
      vmessConfig.host
    );

    return result;
  } catch (error) {
    console.error('Error parsing Vmess link:', error);
    return null;
  }
};

export const parseShadowsocksLink = (link: string): object | null => {
  try {
    if (!link.startsWith('ss://')) return null;

    const url = new URL(link);
    const [base64Part, serverPart] = url.username.split('@');
    
    if (!base64Part) return null;

    let decodedString: string;
    try {
      decodedString = atob(base64Part);
    } catch (e) {
      return null;
    }

    const [method, password] = decodedString.split(':');
    if (!method || !password) return null;

    const server = url.hostname;
    const port = parseInt(url.port, 10);
    const tag = decodeURIComponent(url.hash.replace('#', '') || 'shadowsocks-link');
    
    // Parse query parameters
    const params = Object.fromEntries(url.searchParams);

    const result: any = {
      type: "shadowsocks",
      tag: tag,
      server: server,
      server_port: port,
      method: method,
      password: password
    };

    // Add plugin configuration if present
    if (params.plugin) {
      const [pluginName, ...pluginOpts] = params.plugin.split(';');
      result.plugin = pluginName;
      
      // Handle specific plugins
      switch (pluginName) {
        case 'v2ray-plugin':
        case 'xray-plugin':
          // Parse plugin options
          const pluginParams = new URLSearchParams(pluginOpts.join(';'));
          
          // Add TLS configuration if the plugin uses TLS
          if (pluginParams.get('tls') === 'true') {
            result.tls = buildTlsConfig('tls', pluginParams.get('host'));
          }

          // Add transport configuration
          result.transport = buildTransportConfig(
            pluginParams.get('mode') || 'ws',
            pluginParams.get('path'),
            pluginParams.get('host')
          );
          break;
      }
    }

    return result;
  } catch (error) {
    console.error('Error parsing Shadowsocks link:', error);
    return null;
  }
};

// Modify parseVlessLink to use the common builders
export const parseVlessLink = (link: string) => {
  try {
    if (!link.startsWith('vless://')) return null;

    const url = new URL(link);
    const [uuid] = url.username.split(':');
    const params = Object.fromEntries(url.searchParams);
    const tag = decodeURIComponent(url.hash.replace('#', '') || 'vless-link');

    return {
      type: "vless",
      tag: tag,
      server: url.hostname,
      server_port: parseInt(url.port, 10),
      uuid: uuid,
      flow: params.flow || "",
      tls: buildTlsConfig(params.security, params.sni || url.hostname),
      transport: buildTransportConfig(
        params.type || "tcp",
        params.path,
        params.host
      )
    };
  } catch (error) {
    console.error('Error parsing Vless link:', error);
    return null;
  }
};

interface TlsConfig {
  enabled: boolean;
  server_name: string;
  insecure: boolean;
  alpn: string[];
  min_version: string;
  max_version: string;
  cipher_suites: string[];
  utls?: {
    enabled: boolean;
    fingerprint: string;
  };
}

interface TransportConfig {
  type: string;
  path?: string;
  headers?: {
    Host: string;
  };
  service_name?: string;
  idle_timeout?: string;
  ping_timeout?: string;
  permit_without_stream?: boolean;
}

const randomUTlsFingerprint = (): string => {
  const fingerprints = [
    "chrome",
    "firefox",
    "safari",
    "ios",
    "android",
    "edge",
    "360",
    "qq",
    "random",
    "randomized"
  ];
  return fingerprints[Math.floor(Math.random() * fingerprints.length)];
};

const buildTlsConfig = (
  security: string | undefined, 
  serverName: string | undefined,
  fingerprint?: string
): TlsConfig => {
  return {
    enabled: security === "tls",
    server_name: serverName || "",
    insecure: false,
    alpn: ["h2", "http/1.1"],
    min_version: "1.2",
    max_version: "1.3",
    cipher_suites: [
      // TLS 1.3 Cipher Suites
      "TLS_AES_128_GCM_SHA256",
      "TLS_AES_256_GCM_SHA384",
      "TLS_CHACHA20_POLY1305_SHA256",
      
      // TLS 1.2 Cipher Suites
      "ECDHE-ECDSA-AES128-GCM-SHA256",
      "ECDHE-RSA-AES128-GCM-SHA256",
      "ECDHE-ECDSA-AES256-GCM-SHA384",
      "ECDHE-RSA-AES256-GCM-SHA384",
      "ECDHE-ECDSA-CHACHA20-POLY1305",
      "ECDHE-RSA-CHACHA20-POLY1305",
      
      // Additional suites
      "ECDHE-ECDSA-AES128-SHA256",
      "ECDHE-RSA-AES128-SHA256"
    ],
    utls: {
      enabled: true,
      fingerprint: fingerprint || randomUTlsFingerprint()
    }
  };
};

const buildTransportConfig = (
  type: string, 
  path?: string, 
  host?: string,
  serviceName?: string
): TransportConfig => {
  switch (type.toLowerCase()) {
    case "ws":
    case "websocket":
      return {
        type: "ws",
        path: path || "/",
        headers: {
          Host: host || ""
        }
      };

    case "http":
    case "h2":
      return {
        type: "http",
        path: path || "/",
        headers: {
          Host: host || ""
        }
      };

    case "grpc":
      return {
        type: "grpc",
        service_name: serviceName || path || "defaultService",
        idle_timeout: "15s",
        ping_timeout: "15s",
        permit_without_stream: false
      };

    case "tcp":
      return {
        type: "tcp"
      };

    default:
      return {
        type: type || "tcp"
      };
  }
};
