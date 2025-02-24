export { nameToServiceConfig, serviceToServiceConfig };

import LayerEdgeService from "./layeredge.js";
import { INSTALLED_EXTENSION, ExtensionInfo } from "../resources.js";
import BaseService, { BaseServiceOptions } from "./baseService.js";

const ServicesMapping: Record<
  string,
  { service: new (opts: BaseServiceOptions) => BaseService; extensions: Array<ExtensionInfo> }
> = {
  layeredge: {
    service: LayerEdgeService,
    extensions: [INSTALLED_EXTENSION.metamask],
  },
};

function nameToServiceConfig(name: string) {
  return ServicesMapping[name];
}

function serviceToServiceConfig(service: typeof BaseService) {
  for (const serviceName in ServicesMapping) {
    const config = ServicesMapping[serviceName];
    if (config.service === service) {
      return config;
    }
  }
}
