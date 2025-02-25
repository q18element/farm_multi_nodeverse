export { nameToServiceConfig, serviceToServiceConfig, ServiceConfig };

import LayerEdgeService from "./layeredge.js";
import { INSTALLED_EXTENSION, ExtensionInfo } from "../resources.js";
import BaseService, { BaseServiceOptions } from "./baseService.js";
import HahaWallet from "./hahaWallet.js";

interface ServiceConfig {
  service: new (opts: BaseServiceOptions) => BaseService;
  extensions: Array<ExtensionInfo>;
  maxVolume?: number;
}

const ServicesMapping: Record<string, ServiceConfig> = {
  layeredge: {
    service: LayerEdgeService,
    extensions: [INSTALLED_EXTENSION.metamask],
  },
  hahawallet: {
    service: HahaWallet,
    extensions: [INSTALLED_EXTENSION.hahawallet],
    maxVolume: 1,
  },
};

function nameToServiceConfig(name: string): ServiceConfig | undefined {
  return ServicesMapping[name];
}

function serviceToServiceConfig(service: typeof BaseService): ServiceConfig | undefined {
  for (const serviceName in ServicesMapping) {
    const config = ServicesMapping[serviceName];
    if (config.service === service) {
      return config;
    }
  }
}
