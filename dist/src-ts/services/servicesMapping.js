export { nameToServiceConfig, serviceToServiceConfig };
import LayerEdgeService from "./layeredge.js";
import { INSTALLED_EXTENSION } from "../resources.js";
import HahaWallet from "./hahaWallet.js";
const ServicesMapping = {
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
function nameToServiceConfig(name) {
    return ServicesMapping[name];
}
function serviceToServiceConfig(service) {
    for (const serviceName in ServicesMapping) {
        const config = ServicesMapping[serviceName];
        if (config.service === service) {
            return config;
        }
    }
}
