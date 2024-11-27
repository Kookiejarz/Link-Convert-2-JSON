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
      server_port: parseInt(vmessConfig.port, 10),
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

export const parseVlessLink = (link: string): object | null => {
  try {
    if (!link.startsWith('vless://')) return null;
    const url = new URL(link);
    const [id, encryption] = url.pathname.split('@')[0].split(':');
    const [address, port] = url.hostname.split(':');
    const params = Object.fromEntries(url.searchParams);
    
    return {
      type: "vless",
      tag: params.ps || "vless-link",
      server: address,
      server_port: parseInt(port, 10),
      uuid: id,
      encryption: encryption || "none",
      flow: params.flow || "",
      tls: buildTlsConfig(params.security, params.sni),
      transport: buildTransportConfig(params.type, params.path, params.host),
      ...(params.fp && { fingerprint: params.fp })
    };
  } catch (error) {
    console.error('Error parsing Vless link:', error);
    return null;
  }
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

    // Look for optional plugin information
    const pluginMatch = serverPart.includes('/?plugin=');
    let plugin, pluginOpts;
    if (pluginMatch) {
      const [serverPortPart, pluginPart] = serverPart.split('/?plugin=');
      plugin = decodeURIComponent(pluginPart.split('&')[0]);
      pluginOpts = pluginPart.includes('&') ? 
        decodeURIComponent(pluginPart.split('&')[1]) : 
        undefined;
    }

    return {
      type: "shadowsocks",
      tag: "shadowsocks-link",
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

// Example usage
// const link = 'vmess://...';
// const config = parseLink(link);
// console.log(config);