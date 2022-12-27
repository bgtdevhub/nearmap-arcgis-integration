import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import format from 'date-fns/format';
import esriConfig from '@arcgis/core/config';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import WebTileLayer from '@arcgis/core/layers/WebTileLayer';
import TileInfo from '@arcgis/core/layers/support/TileInfo';
import LOD from '@arcgis/core/layers/support/LOD';
import SpatialReference from '@arcgis/core/geometry/SpatialReference';
import Point from '@arcgis/core/geometry/Point';
import Search from '@arcgis/core/widgets/Search';
import Compass from '@arcgis/core/widgets/Compass';
import Locate from '@arcgis/core/widgets/Locate';
import Swipe from '@arcgis/core/widgets/Swipe';
// import Basemap from '@arcgis/core/Basemap';
// import BasemapToggle from '@arcgis/core/widgets/BasemapToggle'
// import LayerList from '@arcgis/core/widgets/LayerList';
// import Expand from '@arcgis/core/widgets/Expand';

import MapDatepicker from './Components/MapDatepicker';
import CompareNearmapButton from './Components/CompareNearmapButton';
import {
  addSwipeLayer,
  generateTileID,
  lat2tile,
  lon2tile,
  removeSwipeLayer
} from './Components/Utils';

import './App.css';
import {
  direction,
  nApiKey,
  nearmapMaxZoom,
  nearmapMinZoom,
  tileURL,
  opacity,
  originZoom,
  origin,
  initialResolution,
  inchesPerMeter,
  coverageURL
} from './parameter';

interface nearmapCoverage {
  captureDate: string;
}

const App = (): JSX.Element => {
  const dateToday = format(new Date(), 'yyyy-MM-dd');
  const mapRef = useRef<any>();
  const swipeWidgetRef = useRef<Swipe>();
  const view = useRef<MapView>();

  // esriConfig.apiKey = import.meta.env.VITE_ARCGIS_KEY;
  esriConfig.request.timeout = 90000;
  const [mapDate, setMapDate] = useState(dateToday);
  const [dateList, setDateList] = useState([dateToday]);
  const [lonLat, setLonLat] = useState(origin);
  const [compareDate, setCompareDate] = useState(dateToday);
  const [compare, setCompare] = useState(false);

  // Taken from https://gist.github.com/stdavis/6e5c721d50401ddbf126
  // By default ArcGIS SDK only goes to zoom level 19,
  // In order to overcome this, we need to add more Level Of Detail (LOD) entries to both the view and the web tile layer
  const lods: LOD[] = [];
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

  // generate web tile layer
  const generateWebTileLayer = (
    date: string,
    isCompare = false
  ): WebTileLayer => {
    const id = generateTileID(date, isCompare);
    // Create a WebTileLayer for Nearmap imagery.
    // We are using tileinfo we created earlier.
    const wtl = new WebTileLayer({
      urlTemplate: `${tileURL}/${direction}/{level}/{col}/{row}.img?apikey=${nApiKey}&until=${date}`,
      copyright: 'Nearmap',
      tileInfo,
      title: `Nearmap for ${id}`,
      opacity,
      // blendMode,
      id
    });

    wtl.on('layerview-create-error', () => {
      wtl.refresh();
    });

    return wtl;
  };

  // sync date function for new date list
  const syncDates = (nmDateList: string[]): void => {
    if (dateList.join() !== nmDateList.join()) {
      setDateList(nmDateList);

      if (!nmDateList.includes(mapDate)) {
        setMapDate(nmDateList[0]);
        setCompareDate(nmDateList[nmDateList.length - 1]);
      }
    }
  };

  // fetch list of capture date based on origin
  useEffect(() => {
    const originLon = lon2tile(lonLat[0], originZoom);
    const originLat = lat2tile(lonLat[1], originZoom);

    fetch(
      `${coverageURL}/${originZoom}/${originLon}/${originLat}?apikey=${nApiKey}&limit=50`
    )
      .then(async (response) => await response.json())
      .then((data) => {
        const nmDateList: string[] = data.surveys.map(
          (d: nearmapCoverage) => d.captureDate
        );
        syncDates(nmDateList);
      })
      .catch((err) => console.log(err));
  }, [originZoom, lonLat]);

  // run on mount
  useEffect(() => {
    const nearmapSince = generateWebTileLayer(mapDate);

    const map = new Map();

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
    map.add(nearmapSince);

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

  // date change hook
  const useMapDate = (date: string, isCompare = false): void => {
    useEffect(() => {
      const newMapLayer = generateWebTileLayer(date, isCompare);
      // put compare map at back
      const index = isCompare ? 0 : 1;
      // set compare map visibility to false when compare is false
      if (!compare && isCompare) {
        newMapLayer.visible = false;
      }
      view.current?.map.add(newMapLayer, index);

      if (swipeWidgetRef.current !== undefined) {
        addSwipeLayer(isCompare, newMapLayer, swipeWidgetRef.current);
      }

      return () => {
        const oldLayers: any = view.current?.map.layers.filter(
          (y) => y.id === generateTileID(date, isCompare)
        );
        view.current?.map.removeMany(oldLayers);

        if (swipeWidgetRef.current !== undefined) {
          removeSwipeLayer(isCompare, swipeWidgetRef.current);
        }
      };
    }, [date, compare]);
  };

  // compare date
  useMapDate(compareDate, true);
  // map date
  useMapDate(mapDate);

  // compare function
  useEffect(() => {
    const nearmapLead: any = view.current?.map.findLayerById(mapDate);
    const [nearmapTrail]: any = view.current?.map.layers.filter((cp) =>
      cp.id.includes('compare')
    );
    if (compare) {
      // create a new Swipe widget
      const swipe = new Swipe({
        leadingLayers: [nearmapLead],
        trailingLayers: [nearmapTrail],
        position: 35, // set position of widget to 35%
        view: view.current,
        id: `compare-swipe`
      });
      swipeWidgetRef.current = swipe;
      view.current?.ui.add(swipe);
    }
    return () => {
      if (swipeWidgetRef.current !== undefined) {
        swipeWidgetRef.current.destroy();
      }
    };
  }, [compare]);

  return (
    <>
      <div id="viewDiv" ref={mapRef}></div>
      <div id="mapDatePicker">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '300px 50px 300px',
            mb: '0.5rem',
            columnGap: 1
          }}
        >
          <MapDatepicker
            mapDate={mapDate}
            setMapDate={setMapDate}
            dateList={dateList}
          />
          <CompareNearmapButton compare={compare} set={setCompare} />
          {compare && (
            <MapDatepicker
              mapDate={compareDate}
              setMapDate={setCompareDate}
              dateList={dateList}
            />
          )}
        </Box>
      </div>
    </>
  );
};

export default App;
