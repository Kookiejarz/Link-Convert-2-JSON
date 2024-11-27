interface VmessConfig {
  v: string;
  ps: string;
  add: string;
  port: string;
  id: string;
  aid: string;
  net: string;
  type: string;
  host?: string;  // Make optional
  path?: string;  // Make optional
  tls?: string;   // Make optional
  scy?: string;   // Add security parameter
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

    // Keep original fingerprint value
    const fingerprint = vmessConfig.type || 'chrome';

    const result = {
      type: "vmess",
      tag: vmessConfig.ps || "vmess-link",
      server: vmessConfig.add,
      server_port: parseInt(String(vmessConfig.port), 10),
      uuid: vmessConfig.id,
      security: vmessConfig.security || 'auto',
      alterId: parseInt(vmessConfig.aid || '0', 10),
      network: vmessConfig.net,
      tls: buildTlsConfig(vmessConfig.tls, vmessConfig.host, fingerprint),
      transport: buildTransportConfig(
        vmessConfig.net,
        vmessConfig.path,
        vmessConfig.host
      )
    };

    return result;
  } catch (error) {
    console.error('Error parsing Vmess link:', error);
    return null;
  }
};

export const parseVlessLink = (link: string): object | null => {
  try {
    if (!link.startsWith('vless://')) return null;
    
    const url = new URL(link);
    const [uuid] = url.username.split(':');
    const params = Object.fromEntries(url.searchParams);
    
    let tag = 'vless-link';
    if (url.hash) {
      tag = decodeURIComponent(url.hash.substring(1));
    }

    // Keep original fingerprint value
    const fingerprint = params.fp || 'chrome';

    return {
      type: "vless",
      tag: tag,
      server: url.hostname,
      server_port: parseInt(url.port, 10),
      uuid: uuid,
      flow: params.flow || "",
      tls: buildTlsConfig(params.security, params.sni || url.hostname, fingerprint),
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
    
    const params = Object.fromEntries(url.searchParams);
    
    // Keep original fingerprint value
    const fingerprint = params.fp || 'chrome';

    const result: any = {
      type: "shadowsocks",
      tag: tag,
      server: server,
      server_port: port,
      method: method,
      password: password
    };

    if (params.plugin) {
      const [pluginName, ...pluginOpts] = params.plugin.split(';');
      result.plugin = pluginName;
      
      switch (pluginName) {
        case 'v2ray-plugin':
        case 'xray-plugin':
          const pluginParams = new URLSearchParams(pluginOpts.join(';'));
          
          if (pluginParams.get('tls') === 'true') {
            result.tls = buildTlsConfig(
              'tls', 
              pluginParams.get('host') || server,
              fingerprint
            );
          }

          result.transport = buildTransportConfig(
            pluginParams.get('mode') || 'ws',
            pluginParams.get('path'),
            pluginParams.get('host')
          );
          break;

        case 'obfs-local':
          const obfsParams = new URLSearchParams(pluginOpts.join(';'));
          result.plugin_opts = {
            mode: obfsParams.get('obfs') || 'http',
            host: obfsParams.get('obfs-host') || ''
          };
          break;
      }
    }

    if (params.security === 'tls') {
      result.tls = buildTlsConfig(
        'tls',
        params.sni || server,
        fingerprint
      );
    }

    if (params.type) {
      result.transport = buildTransportConfig(
        params.type,
        params.path,
        params.host
      );
    }

    return result;
  } catch (error) {
    console.error('Error parsing Shadowsocks link:', error);
    return null;
  }
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
      "TLS_AES_128_GCM_SHA256",
      "TLS_AES_256_GCM_SHA384",
      "TLS_CHACHA20_POLY1305_SHA256",
      "ECDHE-ECDSA-AES128-GCM-SHA256",
      "ECDHE-RSA-AES128-GCM-SHA256",
      "ECDHE-ECDSA-AES256-GCM-SHA384",
      "ECDHE-RSA-AES256-GCM-SHA384",
      "ECDHE-ECDSA-CHACHA20-POLY1305",
      "ECDHE-RSA-CHACHA20-POLY1305",
      "ECDHE-ECDSA-AES128-SHA256",
      "ECDHE-RSA-AES128-SHA256"
    ],
    utls: security === "tls" ? {
      enabled: true,
      fingerprint: fingerprint || randomUTlsFingerprint()
    } : undefined
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
