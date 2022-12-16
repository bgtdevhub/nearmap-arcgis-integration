import esriConfig from '@arcgis/core/config';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import WebTileLayer from '@arcgis/core/layers/WebTileLayer';
import Basemap from '@arcgis/core/Basemap';
// import BasemapToggle from '@arcgis/core/widgets/BasemapToggle'
import TileInfo from '@arcgis/core/layers/support/TileInfo';
import Search from '@arcgis/core/widgets/Search';
import SpatialReference from '@arcgis/core/geometry/SpatialReference';
import LOD from '@arcgis/core/layers/support/LOD';
import Point from '@arcgis/core/geometry/Point';
import Compass from '@arcgis/core/widgets/Compass';
import Locate from '@arcgis/core/widgets/Locate';
// import LayerList from '@arcgis/core/widgets/LayerList';
// import Swipe from '@arcgis/core/widgets/Swipe';
// import Expand from '@arcgis/core/widgets/Expand';
import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import format from 'date-fns/format';

import MapDatepicker from './Components/MapDatepicker';
// import CompareNearmapButton from './Components/CompareNearmapButton';
import { lat2tile, lon2tile } from './Components/Utils';

import './App.css';

const App = (): JSX.Element => {
  // User Input Parameters
  const dateToday = format(new Date(), 'yyyy-MM-dd');
  const mapRef = useRef<any>();
  const view = useRef<__esri.MapView>();

  // esriConfig.apiKey = import.meta.env.VITE_ARCGIS_KEY;
  esriConfig.request.timeout = 90000;
  const nApiKey: string = import.meta.env.VITE_NEARMAP_KEY; // "NEARMAP_API_KEY_GOES_HERE"
  const tileURL = 'https://api.nearmap.com/tiles/v3';
  const direction = 'Vert'; // Options: 'Vert', 'North', // Note: awaiting fix from esri to support E, W, S
  const origin = [-97.75, 30.269135]; // [Lat, Lon] for Location: ex: Austin, TX
  const originZoom = 17; // Starting Zoom level for the Web Map
  const nearmapMinZoom = 17; // Nearmap Imagery Lowest resolution zoom level the user can view
  const nearmapMaxZoom = 24; // Nearmap Imagery Highest resolution zoom level the user can view
  const opacity = 1; // Range of 0.1 to 1.0
  const blendMode = 'darken'; // See available blend modes here: https://doc.arcgis.com/en/arcgis-online/create-maps/use-blend-modes-mv.htm

  const [mapDate, setMapDate] = useState(dateToday);
  const [dateList, setDateList] = useState([dateToday]);
  const [lonLat, setLonLat] = useState(origin);
  // const [compareDate, setCompareDate] = useState(dateToday);
  // const [compare, setCompare] = useState(false);

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

  // fetch list of capture date based on origin
  useEffect(() => {
    const originLon = lon2tile(lonLat[0], originZoom);
    const originLat = lat2tile(lonLat[1], originZoom);

    fetch(
      `https://api.nearmap.com/coverage/v2/coord/${originZoom}/${originLon}/${originLat}?apikey=${nApiKey}&limit=50`
    )
      .then(async (response) => await response.json())
      .then((data) => {
        const nmDateList: string[] = data.surveys.map(
          (d: any) => d.captureDate
        );
        if (dateList.join() !== nmDateList.join()) {
          setDateList(nmDateList);

          if (!nmDateList.includes(mapDate)) {
            setMapDate(nmDateList[0]);
            // setCompareDate(nmDateList[0]);
          }
        }
      })
      .catch((err) => console.log(err));
  }, [originZoom, lonLat]);

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

  // generate tile ID
  const generateTileID = (date: string, compare = false): string => {
    return compare ? `compare-${date}` : date;
  };

  // generate tile web layer
  const generateBaseMap = (date: string, compare = false): __esri.Basemap => {
    const id = generateTileID(date, compare);
    // Create a WebTileLayer for Nearmap imagery.
    // We are using tileinfo we created earlier.
    const wtl = new WebTileLayer({
      urlTemplate: `${tileURL}/${direction}/{level}/{col}/{row}.img?apikey=${nApiKey}&until=${date}`,
      copyright: 'Nearmap',
      tileInfo,
      title: `Nearmap for ${date}`,
      opacity,
      blendMode,
      id
    });

    wtl.on('layerview-create-error', () => {
      wtl.refresh();
    });

    return new Basemap({
      baseLayers: [wtl],
      title: `Nearmap for ${date}`,
      id
    });
  };

  // date change hook
  const useMapDate = (date: string, compare = false): void => {
    useEffect(() => {
      const newMapLayer = generateBaseMap(date, compare);
      if (view.current !== undefined) {
        view.current.map.basemap = newMapLayer;
      }

      return () => {
        view.current?.map.basemap.destroy();
      };
    }, [date]);
  };

  // run on mount
  useEffect(() => {
    const nearmapSince = generateBaseMap(mapDate);

    const map = new Map({
      basemap: nearmapSince
    });

    view.current = new MapView({
      container: mapRef.current,
      map,
      zoom: originZoom - nearmapMinZoom,
      center: origin,
      constraints: {
        lods,
        // minZoom: nearmapMinZoom,
        maxZoom: nearmapMaxZoom
      },
      popup: {
        dockEnabled: true,
        dockOptions: {
          buttonEnabled: false,
          breakpoint: false
        }
      }
    });

    // widgets stuff
    // move zoom
    view.current.ui.move('zoom', 'manual');

    // create search
    const searchWidget = new Search({
      view: view.current
    });
    view.current.ui.add(searchWidget, 'top-left');
    searchWidget.on('select-result', (e) => {
      setLonLat([
        e.result.extent.center.longitude,
        e.result.extent.center.latitude
      ]);
    });

    // create compass
    const compassWidget = new Compass({
      view: view.current
    });
    view.current.ui.add(compassWidget, 'bottom-right');

    // add locate
    const locateWidget = new Locate({
      view: view.current // Attaches the Locate button to the view
    });

    view.current.ui.add(locateWidget, 'manual');

    // // create a layerlist and expand widget and add to the view
    // const layerList = new LayerList({
    //   view: view.current
    // });
    // const llExpand = new Expand({
    //   view: view.current,
    //   content: layerList,
    //   expanded: true
    // });
    // view.current.ui.add(llExpand, 'top-right');

    // add the layer to the view
    // map.add(nearmapSince);

    // drag? set center back
    view.current.on('drag', (e) => {
      if (e.action === 'end') {
        setLonLat([
          view.current?.center.longitude as number,
          view.current?.center.latitude as number
        ]);
      }
    });

    view.current
      .when(() => {
        console.log('MapView is ready.');
      })
      .catch((err) => console.log(err));
  }, []);

  // map date
  useMapDate(mapDate);

  // compare date
  // useMapDate(compareDate, true);

  // // compare function
  // useEffect(() => {
  //   if (compare) {
  //     const nearmapLead: any = view.current?.map.findLayerById(mapDate);
  //     const nearmapTrail = generateTileWebLayer(compareDate, true);

  //     // create a new Swipe widget
  //     const swipe = new Swipe({
  //       leadingLayers: [nearmapLead],
  //       trailingLayers: [nearmapTrail],
  //       position: 35, // set position of widget to 35%
  //       view: view.current,
  //       id: `compare-swipe`
  //     });
  //     view.current?.ui.add(swipe);
  //     view.current?.map.add(nearmapTrail);
  //   }
  //   return () => {
  //     // find swipe and layers
  //     const oldSwipe = view.current?.ui.find('compare-swipe');
  //     const oldCompareLayers: any = view.current?.map.layers.filter(
  //       (y) => y.id === generateTileID(compareDate, true)
  //     );

  //     if (oldSwipe !== undefined) {
  //       view.current?.ui.remove(oldSwipe);
  //       view.current?.map.removeMany(oldCompareLayers);
  //     }
  //   };
  // }, [compare]);

  return (
    <>
      <div id="viewDiv" ref={mapRef}></div>
      <div id="mapDatePicker">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            mb: '0.5rem',
            gap: 1
          }}
        >
          <MapDatepicker
            mapDate={mapDate}
            setMapDate={setMapDate}
            dateList={dateList}
          />
          {/* <CompareNearmapButton compare={compare} set={setCompare} />
          {compare && (
            <MapDatepicker
              mapDate={compareDate}
              setMapDate={setCompareDate}
              dateList={dateList}
            />
          )} */}
        </Box>
      </div>
    </>
  );
};

export default App;
