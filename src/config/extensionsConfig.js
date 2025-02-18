const path = require('path');

const EXTENSIONS = {
  openloop: { path: path.resolve('./crxs/openloop.crx') },
  gradient: { path: path.resolve('./crxs/gradient.crx') },
  toggle: { path: path.resolve('./crxs/toggle.crx') },
  bless: { path: path.resolve('./crxs/bless.crx') },
  blockmesh: { path: path.resolve('./crxs/blockmesh.crx') },
  despeed: { path: path.resolve('./crxs/despeed.crx') },
  hcapchaSolver: { path: path.resolve('./crxs/hcapchasolver.crx') },
  depined: { path: path.resolve('./crxs/depined.crx') },
};

module.exports = { EXTENSIONS };
