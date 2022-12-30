// User Input Parameters
export const nApiKey: string = import.meta.env.VITE_NEARMAP_KEY; // "NEARMAP_API_KEY_GOES_HERE"
export const tileURL = 'https://api.nearmap.com/tiles/v3'; // Nearmap Tile API URL
export const coverageURL = 'https://api.nearmap.com/coverage/v2/coord'; // Nearmap Coverage API URL
export const direction = 'Vert'; // Options: 'Vert', 'North', // Note: awaiting fix from esri to support E, W, S
export const origin = [-97.75, 30.269135]; // [Lat, Lon] for Location: ex: Austin, TX
export const originZoom = 12; // Starting Zoom level for the Web Map
export const nearmapMinZoom = 12; // Nearmap Imagery Lowest resolution zoom level the user can view
export const nearmapMaxZoom = 24; // Nearmap Imagery Highest resolution zoom level the user can view
export const opacity = 1; // Range of 0.1 to 1.0
//   export const blendMode = 'darken'; // See available blend modes here: https://doc.arcgis.com/en/arcgis-online/create-maps/use-blend-modes-mv.htm

// LOD Tile parameter
const tilesize = 256;
const earthCircumference = 40075016.685568;
export const inchesPerMeter = 39.37;
export const initialResolution = earthCircumference / tilesize;
