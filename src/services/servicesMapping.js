import LayerEdgeService from "./layeredge.js";
import { EXTENSIONS } from "../config.js";
/** @type {Record<string, typeof BaseService>} */
const ServicesMapping = {
  layeredge: {
    service: LayerEdgeService,
    extensions: [EXTENSIONS.metamask.path],
  },
};

export default ServicesMapping;
