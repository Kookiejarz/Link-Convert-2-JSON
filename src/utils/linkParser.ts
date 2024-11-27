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

interface SingBoxConfig {
  log: LogConfig;
  dns: DnsConfig;
  route: RouteConfig;
  inbounds: InboundConfig[];
  outbounds: OutboundConfig[];
  experimental: ExperimentalConfig;
}

// 基础配置接口
interface LogConfig {
  level: string;
  disabled: boolean;
  timestamp: boolean;
}

interface DnsConfig {
  servers: DnsServer[];
  rules: DnsRule[];
  disable_cache: boolean;
  disable_expire: boolean;
  final: string;
  strategy: string;
}

interface RouteConfig {
  final: string;
  auto_detect_interface: boolean;
  rule_set: RuleSet[];
  rules: RouteRule[];
}

interface DnsServer {
  address: string;
  detour?: string;
  tag?: string;
  strategy?: string;
}

interface DnsRule {
  type?: string;
  mode?: string;
  rules?: any[];
  server?: string;
  rule_set?: string[];
  domain_suffix?: string[];
  outbound?: string[];
  clash_mode?: string;
}

interface RuleSet {
  format: string;
  tag: string;
  type: string;
  url: string;
  download_detour: string;
}

interface RouteRule {
  protocol?: string;
  outbound?: string;
  type?: string;
  mode?: string;
  rules?: any[];
  domain?: string[];
  domain_suffix?: string[];
  domain_keyword?: string[];
  ip_is_private?: boolean;
  network?: string[];
  rule_set?: string[];
  clash_mode?: string;
}

interface InboundConfig {
  type: string;
  tag: string;
  listen?: string;
  listen_port?: number;
  tcp_fast_open?: boolean;
  udp_fragment?: boolean;
  sniff?: boolean;
  sniff_override_destination?: boolean;
  set_system_proxy?: boolean;
  strict_route?: boolean;
  stack?: string;
  domain_strategy?: string;
  udp_timeout?: number;
  interface_name?: string;
  mtu?: number;
  auto_route?: boolean;
  sniff_timeout?: string;
  address?: string[];
}

interface OutboundConfig {
  tag: string;
  type: string;
  server?: string;
  server_port?: number;
  uuid?: string;
  security?: string;
  alter_id?: number;
  flow?: string;
  method?: string;
  password?: string;
  plugin?: string;
  plugin_opts?: any;
  tls?: TlsConfig;
  transport?: TransportConfig;
  outbounds?: string[];
  default?: string;
  interval?: string;
  interrupt_exist_connections?: boolean;
  url?: string;
  tolerance?: number;
}

const createRuleSets = (): RuleSet[] => {
  return [
    {
      format: "binary",
      tag: "geoip-cn",
      type: "remote",
      url: "https://raw.githubusercontent.com/SagerNet/sing-geoip/rule-set/geoip-cn.srs",
      download_detour: "🌐代理"
    },
    {
      format: "binary",
      tag: "geosite-cn",
      type: "remote",
      url: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-cn.srs",
      download_detour: "🌐代理"
    },
    {
      format: "binary",
      tag: "geosite-private",
      type: "remote",
      url: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-private.srs",
      download_detour: "🌐代理"
    },
    {
      format: "binary",
      tag: "geosite-category-ads-all",
      type: "remote",
      url: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-category-ads-all.srs",
      download_detour: "🌐代理"
    }
  ];
};

const createRouteRules = (): RouteRule[] => {
  return [
    {
      protocol: "dns",
      outbound: "dns-out"
    },
    {
      type: "logical",
      mode: "or",
      rules: [
        { ip_is_private: true },
        { domain_keyword: ["baidu","bilibili"] },
        { domain_suffix: ["qq.com"] },
        { rule_set: ["geosite-private"] },
        { clash_mode: "Direct" }
      ],
      outbound: "➡️直连"
    },
    {
      type: "logical",
      mode: "or",
      rules: [
        { domain: ["google.com", "youtube.com"] },
        { rule_set: ["geosite-tiktok","geosite-openai"] },
        { clash_mode: "Global" }
      ],
      outbound: "🌐代理"
    },
    {
      domain_suffix: [".cn"],
      rule_set: ["geoip-cn", "geosite-cn"],
      outbound: "🇨🇳国内"
    },
    {
      network: ["udp"],
      outbound: "🏄🏼‍♀️UDP"
    },
    {
      outbound: "block",
      rule_set: ["geosite-category-ads-all"]
    }
  ];
};

// 添加在其他函数定义后面
const createInbounds = (): InboundConfig[] => {
  return [
    {
      type: "mixed",
      tag: "mixed-in",
      listen: "::",
      listen_port: 5353,
      tcp_fast_open: true,
      udp_fragment: true,
      sniff: true,
      sniff_override_destination: true,
      set_system_proxy: true
    },
    {
      strict_route: true,
      stack: "system",
      domain_strategy: "",
      sniff: true,
      udp_timeout: 300,
      interface_name: "utun",
      type: "tun",
      mtu: 1420,
      auto_route: true,
      sniff_timeout: "300ms",
      address: ["172.19.0.1/30"],
      sniff_override_destination: true,
      tag: "tun-in"
    }
  ];
};

// 添加在其他接口定义区域
interface ExperimentalConfig {
  cache_file: {
    path: string;
    cache_id: string;
    store_fakeip: boolean;
    enabled: boolean;
  };
  clash_api: {
    external_controller: string;
    external_ui_download_url: string;
    secret: string;
    default_mode: string;
    external_ui_download_detour: string;
    external_ui: string;
  };
}

// 创建 DNS 配置
const createDnsConfig = (): DnsConfig => {
  return {
    servers: [
      {
        address: "https://223.5.5.5/dns-query",
        detour: "➡️直连",
        tag: "alidns",
        strategy: "prefer_ipv4"
      },
      {
        address: "https://1.1.1.1/dns-query",
        detour: "🌐代理",
        tag: "cloudflare",
        strategy: "prefer_ipv4"
      },
      {
        address: "rcode://success",
        tag: "block"
      }
    ],
    rules: [
      {
        type: "logical",
        mode: "or",
        rules: [
          { outbound: ["any"] },
          { clash_mode: "Direct" },
          { rule_set: ["geosite-cn", "geosite-private"] },
          { domain_suffix: [".cn"] }
        ],
        server: "alidns"
      },
      {
        server: "cloudflare",
        clash_mode: "Global"
      },
      {
        server: "block",
        rule_set: ["geosite-category-ads-all"]
      }
    ],
    disable_cache: false,
    disable_expire: false,
    final: "cloudflare",
    strategy: "prefer_ipv4"
  };
};


// 创建路由配置
const createRouteConfig = (): RouteConfig => {
  return {
    final: "🌐代理",
    auto_detect_interface: true,
    rule_set: createRuleSets(),
    rules: createRouteRules()
  };
};

const createProxyOutbound = (proxyConfig: any): any => {
  // 基础配置
  const baseConfig = {
    tag: proxyConfig.tag,
    type: proxyConfig.type,
    server: proxyConfig.server,
    server_port: proxyConfig.server_port
  };

  // 根据协议类型添加特定配置
  switch (proxyConfig.type) {
    case 'vmess':
      return {
        ...baseConfig,
        uuid: proxyConfig.uuid,
        security: proxyConfig.security,
        alter_id: proxyConfig.alterId,
        ...(proxyConfig.tls && {
          tls: {
            enabled: proxyConfig.tls.enabled,
            server_name: proxyConfig.tls.server_name,
            insecure: proxyConfig.tls.insecure,
            alpn: proxyConfig.tls.alpn,
            ...(proxyConfig.tls.utls && {
              utls: {
                enabled: proxyConfig.tls.utls.enabled,
                fingerprint: proxyConfig.tls.utls.fingerprint
              }
            })
          }
        }),
        ...(proxyConfig.transport && {
          transport: {
            type: proxyConfig.transport.type,
            ...(proxyConfig.transport.path && { path: proxyConfig.transport.path }),
            ...(proxyConfig.transport.headers && { headers: proxyConfig.transport.headers }),
            ...(proxyConfig.transport.service_name && { service_name: proxyConfig.transport.service_name })
          }
        })
      };

    case 'vless':
      return {
        ...baseConfig,
        uuid: proxyConfig.uuid,
        flow: proxyConfig.flow || '',
        ...(proxyConfig.tls && {
          tls: {
            enabled: proxyConfig.tls.enabled,
            server_name: proxyConfig.tls.server_name,
            insecure: proxyConfig.tls.insecure,
            alpn: proxyConfig.tls.alpn,
            ...(proxyConfig.tls.utls && {
              utls: {
                enabled: proxyConfig.tls.utls.enabled,
                fingerprint: proxyConfig.tls.utls.fingerprint
              }
            })
          }
        }),
        ...(proxyConfig.transport && {
          transport: {
            type: proxyConfig.transport.type,
            ...(proxyConfig.transport.path && { path: proxyConfig.transport.path }),
            ...(proxyConfig.transport.headers && { headers: proxyConfig.transport.headers }),
            ...(proxyConfig.transport.service_name && { service_name: proxyConfig.transport.service_name })
          }
        })
      };

    case 'shadowsocks':
      return {
        ...baseConfig,
        method: proxyConfig.method,
        password: proxyConfig.password,
        ...(proxyConfig.plugin && { plugin: proxyConfig.plugin }),
        ...(proxyConfig.plugin_opts && { plugin_opts: proxyConfig.plugin_opts }),
        ...(proxyConfig.tls && {
          tls: {
            enabled: proxyConfig.tls.enabled,
            server_name: proxyConfig.tls.server_name,
            insecure: proxyConfig.tls.insecure,
            alpn: proxyConfig.tls.alpn,
            ...(proxyConfig.tls.utls && {
              utls: {
                enabled: proxyConfig.tls.utls.enabled,
                fingerprint: proxyConfig.tls.utls.fingerprint
              }
            })
          }
        }),
        ...(proxyConfig.transport && {
          transport: {
            type: proxyConfig.transport.type,
            ...(proxyConfig.transport.path && { path: proxyConfig.transport.path }),
            ...(proxyConfig.transport.headers && { headers: proxyConfig.transport.headers }),
            ...(proxyConfig.transport.service_name && { service_name: proxyConfig.transport.service_name })
          }
        })
      };

    default:
      return baseConfig;
  }
};

// 在 createOutbounds 函数中使用
const createOutbounds = (proxyConfigs: any[]): OutboundConfig[] => {
  const baseOutbounds = [
    {
      tag: "➡️直连",
      type: "direct"
    },
    {
      tag: "block",
      type: "block"
    },
    {
      tag: "dns-out",
      type: "dns"
    }
  ];
    // 转换代理节点配置
    const proxyOutbounds = proxyConfigs.map(config => createProxyOutbound(config));

    // 添加选择器和自动测试
    const selectorOutbounds = createSelectorOutbounds(proxyConfigs);
  
    return [...baseOutbounds, ...proxyOutbounds, ...selectorOutbounds];
};

export const createFullConfig = (proxyConfigs: any[]): SingBoxConfig => {
  return {
    log: {
      level: "info",
      disabled: false,
      timestamp: true
    },
    dns: createDnsConfig(),
    route: createRouteConfig(),
    inbounds: createInbounds(),
    outbounds: createOutbounds(proxyConfigs),
    experimental: {
      cache_file: {
        path: "cache.db",
        cache_id: "cache_id",
        store_fakeip: true,
        enabled: true
      },
      clash_api: {
        external_controller: "localhost:9090",
        external_ui_download_url: "",
        secret: "",
        default_mode: "",
        external_ui_download_detour: "",
        external_ui: "ui"
      }
    }
  };
};

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

// 在所有接口定义和现有函数的后面添加以下代码

// 创建选择器出站配置
const createSelectorOutbounds = (proxyConfigs: any[]): any[] => {
  const proxyTags = proxyConfigs.map(config => config.tag);
  
  return [
    {
      default: proxyTags[0],
      outbounds: [...proxyTags, "🏎️Auto"],
      tag: "🌐代理",
      type: "selector"
    },
    {
      default: "➡️直连",
      outbounds: ["➡️直连", "🌐代理"],
      tag: "🇨🇳国内",
      type: "selector"
    },
    {
      outbounds: proxyTags,
      interval: "3m",
      tag: "🏎️Auto",
      type: "urltest",
      interrupt_exist_connections: false,
      url: "https://www.gstatic.com/generate_204",
      tolerance: 50
    },
    {
      default: "block",
      outbounds: [...proxyTags, "block"],
      tag: "🏄🏼‍♀️UDP",
      type: "selector"
    }
  ];
};


export const handleLinks = (links: string[]): string => {
  try {
    // Parse all links into proxy configurations
    const proxyConfigs = links
      .map(link => parseLink(link))
      .filter(config => config !== null);

    if (proxyConfigs.length === 0) {
      throw new Error('No valid proxy configurations found');
    }

    // Create the full configuration
    const fullConfig = createFullConfig(proxyConfigs);

    // Return the full configuration as a formatted JSON string
    return JSON.stringify(fullConfig, null, 2);
  } catch (error) {
    console.error('Error handling links:', error);
    return '';
  }
};
