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
      server_port: parseInt(vmessConfig.port, 10) || 443,
      uuid: vmessConfig.id,
      alterId: parseInt(vmessConfig.aid, 10),
      network: vmessConfig.net,
      security: vmessConfig.tls,
      tls: buildTlsConfig(vmessConfig.tls, vmessConfig.host),
      transport: buildTransportConfig(vmessConfig.net, vmessConfig.path, vmessConfig.host)
    };
    // Add 'reality' if it's present in the link
    if (vmessConfig.type === 'reality') {
      result['reality'] = {
        publicKey: vmessConfig.pbkey,
        shortId: vmessConfig.shortid,
        fingerprint: vmessConfig.fp || 'chrome',
        serverName: vmessConfig.sni
      };
    }
    return result;
  } catch (error) {
    console.error('Error parsing Vmess link:', error);
    return null;
  }
};

export const parseVlessLink = (link: string) => {
  try {
    const url = new URL(link);
    const [uuid, encryption] = url.username.split(':');
    const address = url.hostname;
    const port = url.port;
    const params = Object.fromEntries(url.searchParams);

    // Determine if TLS is enabled
    const isTlsEnabled = params.security === "tls" || params.sni !== undefined;

    // Construct TLS configuration
    const tlsConfig: any = {
      enabled: isTlsEnabled
    };

    // Add server name if TLS is enabled
    if (isTlsEnabled) {
      tlsConfig.server_name = params.sni || address;
      tlsConfig.insecure = false;
    }

    // Add UTLS configuration
    if (isTlsEnabled) {
      tlsConfig.utls = {
        enabled: true,
        fingerprint: params.fp || "randomized"
      };
    }

    // Add ALPN if specified
    if (params.alpn) {
      tlsConfig.alpn = params.alpn.split(',');
    }

    // Add TLS version constraints
    tlsConfig.min_version = "1.1";
    tlsConfig.max_version = "1.3";

    return {
      type: "vless",
      tag: tag,
      server: address,
      server_port: parseInt(port,10) || 443,
      uuid: uuid,
      flow: "",
      tls: tlsConfig,
      transport: {
        type: params.type || "tcp",
        ...(params.host && { host: [params.host] }),
        ...(params.path && { path: params.path })
      }
    };
  } catch (error) {
    console.error('Error parsing Vless link:', error);
    return null;
  }
};

export const createSingBoxConfig = (link: string) => {
  const vlessConfig = parseVlessLink(link);
  
  return {
    outbounds: [
      {
        type: "selector",
        tag: "Auto_select",
        outbounds: [vlessConfig.tag, "auto"],
        default: vlessConfig.tag
      },
      vlessConfig,
      {
        type: "urltest",
        tag: "auto",
        outbounds: [vlessConfig.tag],
        url: "https://www.gstatic.com/generate_204",
        interval: "2m",
        interrupt_exist_connections: true
      }
    ]
  };
};

export const parseShadowsocksLink = (link: string): object | null => {
  try {
    if (!link.startsWith('ss://')) return null;

    // Remove ss:// prefix
    const cleanLink = link.replace('ss://', '');
    
    // Decode base64 encoded part
    let decodedLink: string;
    try {
      decodedLink = atob(cleanLink.split('@')[0]);
    } catch {
      // If simple base64 decoding fails, try standard base64 decode
      decodedLink = atob(cleanLink.split('@')[0]);
    }

    // Split method:password
    const [method, password] = decodedLink.split(':');
    
    // Extract server and port
    const serverPart = cleanLink.split('@')[1];
    const [server, port] = serverPart.split(':');

    const fragmentStart = link.lastIndexOf('#');
    const tag = fragmentStart !== -1 
      ? decodeURIComponent(link.slice(fragmentStart + 1)) 
      : 'shadowsocks-link';

    // Look for optional plugin information
    let plugin, pluginOpts;
    if (queryAndFragment) {
      const params = new URLSearchParams('?' + queryAndFragment);
      const pluginParam = params.get('plugin');
      if (pluginParam) {
        plugin = decodeURIComponent(pluginParam);
        pluginOpts = params.get('pluginOpts');
      }
    }

    return {
      type: "shadowsocks",
      tag: tag,
      server: server,
      server_port: parseInt(port, 10),
      method: method,
      password: password,
      ...(plugin && { plugin }),
      ...(pluginOpts && { plugin_opts: pluginOpts })
    };
  } catch (error) {
    console.error('Error parsing Shadowsocks link:', error);
    return null;
  }
};

const buildTlsConfig = (security: string | undefined, serverName: string | undefined): object => {
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
      
      // TLS 1.2 Cipher Suites for broader compatibility
      "ECDHE-ECDSA-AES128-GCM-SHA256",
      "ECDHE-RSA-AES128-GCM-SHA256",
      "ECDHE-ECDSA-AES256-GCM-SHA384",
      "ECDHE-RSA-AES256-GCM-SHA384",
      "ECDHE-ECDSA-CHACHA20-POLY1305",
      "ECDHE-RSA-CHACHA20-POLY1305",
      
      // Additional suites for enhanced security
      "ECDHE-ECDSA-AES128-SHA256",
      "ECDHE-RSA-AES128-SHA256"
    ],
    utls: {
      enabled: true,
      fingerprint: randomUTlsFingerprint()
    }
  };
};

const buildTransportConfig = (type: string, path: string | undefined, host: string | undefined): object => {
  switch (type) {
    case "ws":
      return {
        type: "ws",
        path: path || "/",
        headers: {
          Host: host || ""
        }
      };
    case "http":
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
        service_name: path || "defaultService",
        idle_timeout: "15s",
        ping_timeout: "15s",
        permit_without_stream: false
      };
    default:
      return {};
  }
};

