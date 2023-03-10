import { LegacyRef, useCallback, useEffect, useRef, useState } from 'react';
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
import { when } from '@arcgis/core/core/reactiveUtils';
import Alert from '@mui/material/Alert';
import Switch from '@mui/material/Switch';
import LayerList from '@arcgis/core/widgets/LayerList';
import Expand from '@arcgis/core/widgets/Expand';
import * as locator from '@arcgis/core/rest/locator';
import Graphic from '@arcgis/core/Graphic';

import MapDatepicker from './Components/MapDatepicker';
import CompareNearmapButton from './Components/CompareNearmap';
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
  coverageURL,
  locatorUrl,
  TIMEOUT,
  NO_DATE,
  NO_AUTHORIZE,
  NO_KEY
} from './parameter';

interface NearmapCoverage {
  captureDate: string;
}

const App = (): JSX.Element => {
  const dateToday = format(new Date(), 'yyyy-MM-dd'); // today's date as initial

  esriConfig.request.timeout = 90000;
  const [mapDate, setMapDate] = useState(dateToday); // leading map date
  const [dateList, setDateList] = useState([dateToday]); // date of available Nearmap imagery
  const [lonLat, setLonLat] = useState(origin); // longitude-latitude pair
  const [compareDate, setCompareDate] = useState(dateToday); // trailing map date
  const [compare, setCompare] = useState(false); // compare state
  const [nmapActive, setNmapActive] = useState(false); // Nearmap Active state
  const [nmapDisable, setNmapDisable] = useState(false); // Nearmap Disabled state
  const [errorMode, setErrorMode] = useState<string | null>(null); // Error mode

  const mapRef = useRef<HTMLDivElement>(); // Map Reference
  const swipeWidgetRef = useRef<Swipe>(); // Swipe Widget Reference
  const view = useRef<MapView>(); // MapView Reference
  const compareRef = useRef(false); // Compare Reference. For checking
  const nmapActiveRef = useRef(false); // Nearmap Active Reference. For checking

  /**
   * Set Compare state and ref
   * @param value value to be set
   */
  const handleCompare = useCallback((value: boolean): void => {
    setCompare(value);
    compareRef.current = value;
  }, []);

  /**
   * Set Nearmap Active state and ref + execute handleCompare = false
   * @param value value to be set
   */
  const handleNmapActive = useCallback(
    (value: boolean): void => {
      nmapActiveRef.current = value;
      setNmapActive(value);
      handleCompare(false);
    },
    [handleCompare]
  );

  /**
   * Taken from https://gist.github.com/stdavis/6e5c721d50401ddbf126.
   * By default ArcGIS SDK only goes to zoom level 19,
   * In order to overcome this, we need to add more Level Of Detail (LOD) entries
   * to both the view and the web tile layer
   */
  const getLods = useCallback(() => {
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

    return lods;
  }, []);

  /**
   * Create a tileinfo instance with increased level of detail
   * using the lod array we created earlier We need to use rows and cols (currently undocumented in
   * https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-support-TileInfo.html)
   * in addition to width and height properties
   */
  const getTileInfo = useCallback(() => {
    const tileInfo = new TileInfo({
      dpi: 72,
      format: 'jpg',
      lods: getLods(),
      origin: new Point({
        x: -20037508.342787,
        y: 20037508.342787
      }),
      spatialReference: SpatialReference.WebMercator,
      size: [256, 256]
    });
    return tileInfo;
  }, [getLods]);

  /**
   * Generate web tile layer based on date
   * @param date date to process
   * @param isCompare date is trailing or not. Default to false
   */
  const generateWebTileLayer = useCallback(
    (date: string, isCompare = false): WebTileLayer => {
      const id = generateTileID(date, isCompare);
      // Create a WebTileLayer for Nearmap imagery.
      // We are using tileinfo we created earlier.
      const wtl = new WebTileLayer({
        urlTemplate: `${tileURL}/${direction}/{level}/{col}/{row}.img?apikey=${nApiKey}&until=${date}`,
        copyright: 'Nearmap',
        tileInfo: getTileInfo(),
        title: `Nearmap for ${id}`,
        opacity,
        // blendMode,
        id
      });

      wtl.on('layerview-create-error', () => {
        wtl.refresh();
      });

      return wtl;
    },
    [getTileInfo]
  );

  /**
   * Create a point graphic on map
   * @param lat latitude
   * @param long longitude
   */
  const createGraphic = (lat: number, long: number): void => {
    if (view.current != null) {
      // First create a point geometry
      const point = {
        type: 'point', // autocasts as new Point()
        longitude: long,
        latitude: lat
      };

      // Create a symbol for drawing the point
      const markerSymbol = {
        type: 'simple-marker', // autocasts as new SimpleMarkerSymbol()
        color: [226, 119, 40]
      };

      // Create a graphic and add the geometry and symbol to it
      const pointGraphic = new Graphic({
        geometry: new Point(point),
        symbol: markerSymbol
      });

      // Add the graphics to the view's graphics layer
      view.current.graphics.add(pointGraphic);
    }
  };

  /**
   * Add web tile and swipe (if available) layer to view
   * @param date date to process
   * @param isCompare date is trailing or not
   */
  const loadMapTask = useCallback(
    (date: string, isCompare: boolean): void => {
      if (errorMode === null) {
        const newMapLayer = generateWebTileLayer(date, isCompare);
        // put compare map at back
        const index = isCompare ? 0 : 1;
        // set compare map visibility to false when compare is false
        if ((!compareRef.current && isCompare) || !nmapActiveRef.current) {
          newMapLayer.visible = false;
        }
        view.current?.map.add(newMapLayer, index);
        if (swipeWidgetRef.current !== undefined) {
          addSwipeLayer(isCompare, newMapLayer, swipeWidgetRef.current);
        }
      }
    },
    [errorMode, generateWebTileLayer]
  );

  /**
   * Cleanup - remove current web tile and swipe (if available) layer from view
   * @param isCompare date is trailing or not
   */
  const mapCleanupTask = (isCompare: boolean): void => {
    const oldId = isCompare ? 'compare-' : 'base-';
    const oldLayers: __esri.Layer[] | undefined = view.current?.map.layers
      .filter((y) => y.id.includes(oldId))
      .toArray();

    view.current?.map.removeMany(oldLayers as __esri.Layer[]);

    if (swipeWidgetRef.current !== undefined) {
      removeSwipeLayer(isCompare, swipeWidgetRef.current);
    }
  };

  // sync date function for new date list
  /**
   * Check if resetting of datelist, mapDate, compareDate is required or not.
   * Perform the changes if required
   * @param nmDateList list of dates
   */
  const syncDates = useCallback(
    (nmDateList: string[]): void => {
      if (dateList.join() !== nmDateList.join()) {
        setDateList(nmDateList);
      }
      if (!nmDateList.includes(mapDate)) {
        setMapDate(nmDateList[0]);
      }
      if (!nmDateList.includes(compareDate)) {
        setCompareDate(nmDateList[nmDateList.length - 1]);
      }
    },
    [compareDate, dateList, mapDate]
  );

  /**
   * Fetch list of available Nearmap imagery date based on lat long
   */
  useEffect(() => {
    const originLon = lon2tile(lonLat[0], originZoom);
    const originLat = lat2tile(lonLat[1], originZoom);

    const setDisable = (value: string | null): void => {
      const disabled = value !== null;
      setErrorMode(value);
      setNmapDisable(disabled);

      if (disabled && value !== TIMEOUT) {
        handleNmapActive(false);
      }
      if (disabled) {
        handleCompare(false);
      }
    };

    fetch(
      `${coverageURL}/${originZoom}/${originLon}/${originLat}?apikey=${nApiKey}&limit=500`
    )
      .then(async (response) => {
        if (response.status === 200) return await response.json();
      })
      .then((data) => {
        switch (true) {
          case data.error === NO_KEY:
          case data.error === NO_AUTHORIZE: {
            setDisable(data.error);
            break;
          }
          case data.surveys.length === 0: {
            setDisable(NO_DATE);
            break;
          }
          default: {
            setDisable(null);
            const nmDateList: string[] = data.surveys.map(
              (d: NearmapCoverage) => d.captureDate
            );
            const finalDateList = [...new Set(nmDateList)];
            syncDates(finalDateList);
            break;
          }
        }
      })
      .catch((err) => console.log(err));
  }, [handleCompare, handleNmapActive, lonLat, syncDates]);

  /**
   * Run on mount @ windows is defined
   */
  useEffect(() => {
    const map = new Map({ basemap: 'streets-vector' });

    view.current = new MapView({
      container: mapRef.current,
      map,
      zoom: originZoom - nearmapMinZoom,
      center: origin,
      constraints: {
        lods: getLods(),
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

    // create a layerlist and expand widget and add to the view
    const layerList = new LayerList({
      view: view.current
    });
    const llExpand = new Expand({
      view: view.current,
      content: layerList,
      expanded: false
    });
    view.current.ui.add(llExpand, 'top-right');

    when(
      () =>
        view.current?.stationary === true || view.current?.updating === false,
      () => {
        setLonLat([
          view.current?.center.longitude as number,
          view.current?.center.latitude as number
        ]);
      }
    );

    /*******************************************************************
     * This click event sets generic content on the popup not tied to
     * a layer, graphic, or popupTemplate. The location of the point is
     * used as input to a reverse geocode method and the resulting
     * address is printed to the popup content.
     *******************************************************************/
    view.current.popup.autoOpenEnabled = false;
    view.current.on('click', (event) => {
      // Get the coordinates of the click on the view
      const lat = Math.round(event.mapPoint.latitude * 1000) / 1000;
      const lon = Math.round(event.mapPoint.longitude * 1000) / 1000;

      view.current?.popup.open({
        // Set the popup's title to the coordinates of the location
        title: `Details`,
        location: event.mapPoint // Set the location of the popup to the clicked location
      });

      const params = {
        location: event.mapPoint
      };

      // Display the popup
      // Execute a reverse geocode using the clicked location
      locator
        .locationToAddress(locatorUrl, params)
        .then((response) => {
          // If an address is successfully found, show it in the popup's content
          if (view.current !== undefined)
            view.current.popup.content = `
            <table class="popup-tables">
              <tbody>
                <tr>
                  <th>Address</th>
                  <td>${response.address}</td>
                </tr>
                <tr>
                  <th>Latitude</th>
                  <td>${lat}</td>
                </tr>
                <tr>
                  <th>Longitude</th>
                  <td>${lon}</td>
                </tr>
              </tbody>
            </table>
            `;

          view.current?.graphics.removeAll();
          createGraphic(lat, lon);
        })
        .catch(() => {
          // If the promise fails and no result is found, show a generic message
          if (view.current !== undefined)
            view.current.popup.content =
              'No address was found for this location';
        });
    });

    view.current
      .when(() => {
        console.log('MapView is ready.');
      })
      .catch((err) => console.log(err));
  }, [getLods]);

  // map date hook
  useEffect(() => {
    loadMapTask(mapDate, false);
    return () => {
      mapCleanupTask(false);
    };
  }, [loadMapTask, mapDate]);

  // compare date hook
  useEffect(() => {
    loadMapTask(compareDate, true);
    return () => {
      mapCleanupTask(true);
    };
  }, [compareDate, loadMapTask]);

  // compare function
  useEffect(() => {
    if (errorMode === null && compare) {
      const nearmapLead: __esri.Layer | undefined = view.current?.map.layers
        .filter((bs) => bs.id.includes('base-'))
        .at(0);
      const nearmapTrail: __esri.Layer | undefined = view.current?.map.layers
        .filter((cp) => cp.id.includes('compare'))
        .at(0);

      if (nearmapTrail !== undefined) nearmapTrail.visible = true;

      // create a new Swipe widget
      const swipe = new Swipe({
        leadingLayers: [nearmapLead as __esri.Layer],
        trailingLayers: [nearmapTrail as __esri.Layer],
        position: 35, // set position of widget to 35%
        view: view.current,
        id: `compare-swipe`
      });

      swipeWidgetRef.current = swipe;
      view.current?.ui.add(swipe);
    }
    return () => {
      const nearmapTrail: __esri.Layer | undefined = view.current?.map.layers
        .filter((cp) => cp.id.includes('compare-'))
        .at(0);

      if (nearmapTrail !== undefined) nearmapTrail.visible = false;
      if (swipeWidgetRef.current !== undefined) {
        swipeWidgetRef.current.destroy();
      }
    };
  }, [compare, errorMode]);

  // set map visibility
  useEffect(() => {
    const nearmapLead: __esri.Layer | undefined = view.current?.map.layers
      .filter((bs) => bs.id.includes('base-'))
      .at(0);

    if (nearmapLead !== undefined) nearmapLead.visible = nmapActive;
  }, [nmapActive, mapDate]);

  return (
    <>
      <div id="viewDiv" ref={mapRef as LegacyRef<HTMLDivElement>}></div>
      <div id="mapDatePicker">
        {errorMode !== null && (
          <Alert sx={{ mb: 1 }} severity="info">
            {errorMode}
          </Alert>
        )}
        <Box className="grid-nav">
          <Box className="nmapactive-button">
            <Switch
              checked={nmapActive}
              disabled={nmapDisable}
              onChange={() => handleNmapActive(!nmapActive)}
              sx={{ backgroundColor: 'white', borderRadius: 2 }}
            />
          </Box>
          {!nmapDisable &&
            nmapActive && [
              <MapDatepicker
                key="mapDate"
                mapDate={mapDate}
                setMapDate={setMapDate}
                dateList={dateList}
              />,
              <CompareNearmapButton
                key="compareButton"
                compare={compare}
                set={handleCompare}
                disabled={!nmapActive}
              />
            ]}
          {!nmapDisable && compare && (
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
