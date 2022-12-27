// https://oms.wff.ch/calc.htm
// https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_.28JavaScript.2FActionScript.2C_etc..29
// longitude to X google map tile
export const lon2tile = (lon: number, zoom: number): number => {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
};

// latitude to Y google map tile
export const lat2tile = (lat: number, zoom: number): number => {
  return Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
};

// generate tile ID
export const generateTileID = (date: string, isCompare = false): string => {
  return isCompare ? `compare-${date}` : date;
};

// add web layer for swipe widget
export const addSwipeLayer = (
  isCompare: boolean,
  layer: __esri.WebTileLayer,
  swipe: __esri.Swipe
): void => {
  if (isCompare) {
    swipe.trailingLayers.add(layer);
  } else {
    swipe.leadingLayers.add(layer);
  }
};

// remove web layer for swipe widget
export const removeSwipeLayer = (
  isCompare: boolean,
  swipe: __esri.Swipe
): void => {
  if (isCompare) {
    swipe.trailingLayers.removeAll();
  } else {
    swipe.leadingLayers.removeAll();
  }
};
