import esriConfig from '@arcgis/core/config';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import WebTileLayer from '@arcgis/core/layers/WebTileLayer';
// import Basemap from '@arcgis/core/Basemap'
// import BasemapToggle from '@arcgis/core/widgets/BasemapToggle'
import TileInfo from '@arcgis/core/layers/support/TileInfo';
import Search from '@arcgis/core/widgets/Search';
import SpatialReference from '@arcgis/core/geometry/SpatialReference';
import LOD from '@arcgis/core/layers/support/LOD';
import Point from '@arcgis/core/geometry/Point';
import LayerList from '@arcgis/core/widgets/LayerList';
import Swipe from '@arcgis/core/widgets/Swipe';
import Expand from '@arcgis/core/widgets/Expand';
// import format from 'date-fns/format'
import React, { useEffect, useRef, useState } from 'react';
import MapDatepicker from './Components/MapDatepicker';
import CompareNearmapButton from './Components/CompareNearmapButton';

import './App.css';

const App = (): JSX.Element => {
  // User Input Parameters
  // const dateToday = format(new Date(), 'yyyy-MM-dd')
  const mapRef = useRef<any>();
  const view = useRef<__esri.MapView>();

  esriConfig.apiKey = import.meta.env.VITE_ARCGIS_KEY;
  const nApiKey: string = import.meta.env.VITE_NEARMAP_KEY; // "NEARMAP_API_KEY_GOES_HERE"
  const tileURL = 'https://api.nearmap.com/tiles/v3';
  const direction = 'Vert'; // Options: 'Vert', 'North', // Note: awaiting fix from esri to support E, W, S
  const origin = [-97.75, 30.269135]; // [Lat, Lon] for Location: ex: Austin, TX
  const originZoom = 17; // Starting Zoom level for the Web Map
  const nearmapMinZoom = 17; // Nearmap Imagery Lowest resolution zoom level the user can view
  const nearmapMaxZoom = 24; // Nearmap Imagery Highest resolution zoom level the user can view
  // const since = '2014-09-28'; // Imagery since date
  const initalDate = '2021-10-29'; // Imagery until date
  const opacity = 1.0; // Range of 0.1 to 1.0
  const blendMode = 'darken'; // See available blend modes here: https://doc.arcgis.com/en/arcgis-online/create-maps/use-blend-modes-mv.htm
  const [mapDate, setMapDate] = useState(initalDate);
  const [compareDate, setCompareDate] = useState(initalDate);
  const [compare, setCompare] = useState(false);

  // Taken from https://gist.github.com/stdavis/6e5c721d50401ddbf126
  // By default ArcGIS SDK only goes to zoom level 19,
  // In order to overcome this, we need to add more Level Of Detail (LOD) entries to both the view and the web tile layer
  const lods: LOD[] = [];
  const tilesize = 256;
  const earthCircumference = 40075016.685568;
  const inchesPerMeter = 39.37;
  const initialResolution = earthCircumference / tilesize;
  for (let zoom = nearmapMinZoom; zoom <= nearmapMaxZoom; zoom++) {
    const resolution = initialResolution / Math.pow(2, zoom);
    const scale = resolution * 96 * inchesPerMeter;
    lods.push(
      new LOD({
        level: zoom,
        scale,
        resolution
      })
    );
  }

  // Create a tileinfo instance with increased level of detail
  // using the lod array we created earlier
  // We need to use rows and cols (currently undocumented in https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-support-TileInfo.html)
  // in addition to width and height properties
  const tileInfo = new TileInfo({
    dpi: 72,
    format: 'jpg',
    lods,
    origin: new Point({
      x: -20037508.342787,
      y: 20037508.342787
    }),
    spatialReference: SpatialReference.WebMercator,
    size: [256, 256]
  });

  const map = new Map({
    // basemap: 'topo-vector',
    basemap: 'arcgis-navigation',
    ground: 'world-elevation'
  });

  const generateTileWebLayer = (
    date: string,
    compare = false
  ): __esri.WebTileLayer => {
    // Create a WebTileLayer for Nearmap imagery.
    // We are using tileinfo we created earlier.
    return new WebTileLayer({
      urlTemplate: `${tileURL}/${direction}/{level}/{col}/{row}.img?apikey=${nApiKey}&since=${date}`,
      copyright: 'Nearmap',
      tileInfo,
      title: `Nearmap for ${date}`,
      opacity,
      blendMode,
      id: compare ? `compare-${date}` : date
    });
  };

  // run on mount
  useEffect(() => {
    const nearmapSince = generateTileWebLayer(mapDate);

    view.current = new MapView({
      container: mapRef.current,
      map,
      zoom: originZoom - nearmapMinZoom,
      center: origin,
      constraints: {
        lods,
        // minZoom: nearmapMinZoom,
        maxZoom: nearmapMaxZoom
      }
    });
    view.current.ui.move('zoom', 'bottom-left');
    // console.log(view.current.center);

    // create search
    const search = new Search({
      view: view.current
    });
    view.current.ui.add(search, 'top-left');

    // create a layerlist and expand widget and add to the view
    const layerList = new LayerList({
      view: view.current
    });
    const llExpand = new Expand({
      view: view.current,
      content: layerList,
      expanded: true
    });
    view.current.ui.add(llExpand, 'top-right');

    // add the widget to the view
    map.add(nearmapSince);

    view.current
      .when(() => {
        console.log('MapView is ready.');
      })
      .catch((err) => console.log(err));
  }, []);

  // change date function
  useEffect(() => {
    console.log('*********************************');
    console.log('newDate', mapDate);
    const newMapLayer = generateTileWebLayer(mapDate);
    console.log('newLayer', newMapLayer);
    // map.add(newMapLayer);
    view.current?.map.add(newMapLayer);

    return () => {
      console.log('*********************************');
      console.log('oldDate', mapDate);
      // const oldLayer = map.findLayerById(mapDate);
      const oldLayers = view.current?.map.layers.filter(
        (y) => y.id === mapDate
      );
      console.log('oldLayer', oldLayers);
      view.current?.map.removeMany(oldLayers as any);
    };
  }, [mapDate]);

  // compare function
  useEffect(() => {
    if (compare) {
      const nearmapLead = map.findLayerById(mapDate);
      const nearmapTrail = generateTileWebLayer(compareDate, true);

      // create a new Swipe widget
      const swipe = new Swipe({
        leadingLayers: [nearmapLead],
        trailingLayers: [nearmapTrail],
        position: 35, // set position of widget to 35%
        view: view.current,
        id: `compare-swipe`
      });
      view.current?.ui.add(swipe);
      map.add(nearmapTrail);
    }
    return () => {
      const oldSwipe = view.current?.ui.find('compare-swipe');
      console.log('oldSwipe', oldSwipe);
      const oldCompareLayer = map.findLayerById(`compare-${compareDate}`);

      if (oldSwipe !== undefined) {
        view.current?.ui.remove(oldSwipe);
        map.remove(oldCompareLayer);
      }
    };
  }, [compare]);

  return (
    <>
      <div id="viewDiv" ref={mapRef}></div>
      <div id="mapDatePicker">
        <MapDatepicker mapDate={mapDate} setMapDate={setMapDate} />
        <CompareNearmapButton compare={compare} set={setCompare} />
        {compare && (
          <MapDatepicker mapDate={compareDate} setMapDate={setCompareDate} />
        )}
      </div>
    </>
  );
};

export default App;
