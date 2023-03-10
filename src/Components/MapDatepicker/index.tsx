import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import parse from 'date-fns/parse';
import format from 'date-fns/format';
import ListSubheader from '@mui/material/ListSubheader';
import TripOriginOutlinedIcon from '@mui/icons-material/TripOriginOutlined';
import FormControl from '@mui/material/FormControl';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useState, useEffect, useCallback } from 'react';
import './index.css';

interface DatePickerProps {
  mapDate: string;
  setMapDate: Function;
  dateList: string[];
}

function renderSelectedDate(date: string): string {
  const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
  return format(parsedDate, 'E MMM dd yyyy');
}

const renderMenuItem = (dateList: string[]): JSX.Element[] => {
  return dateList.map((d) => {
    // check for year
    if (d.length === 4) {
      return (
        <ListSubheader key={d} className="list-header">
          {d}
        </ListSubheader>
      );
    }
    const parsedDate = parse(d, 'yyyy-MM-dd', new Date());
    const formatDate = format(parsedDate, 'MMMM dd');

    return (
      <MenuItem key={d} value={d} className="middle-line">
        <ListItemIcon>
          <TripOriginOutlinedIcon
            fontSize="small"
            color="action"
            className="dropdown-icon"
          />
        </ListItemIcon>
        <ListItemText className="mobile-display-map">{formatDate}</ListItemText>
      </MenuItem>
    );
  });
};

const MapDatepicker = ({
  mapDate,
  setMapDate,
  dateList
}: DatePickerProps): JSX.Element => {
  const [nextDisabled, setNextDisabled] = useState(true);
  const [prevDisabled, setPrevDisabled] = useState(false);

  // render years
  const yearList1 = dateList.map((y) => {
    return y.substring(0, 4);
  });
  const uniqYearList = [...new Set(yearList1)];

  const menuItem = uniqYearList.map((y2) => {
    const sameYear = dateList.filter((d) => y2 === d.substring(0, 4));
    return [y2, ...sameYear];
  });
  const finalMenuItem = menuItem.flat();

  // change button disability, return target index
  const navButtonState = useCallback(
    (date: string): void => {
      const currentIndex = finalMenuItem.findIndex((i) => i === date);
      switch (true) {
        // disable prev button if last record, last should never be a year
        case currentIndex === finalMenuItem.length - 1: {
          setNextDisabled(false);
          setPrevDisabled(true);
          break;
        }
        // disable next button if 2nd record, 1st should always be a year
        case currentIndex === 1: {
          setNextDisabled(true);
          setPrevDisabled(false);
          break;
        }
        // enable both next and prev button
        default: {
          setNextDisabled(false);
          setPrevDisabled(false);
          break;
        }
      }
    },
    [finalMenuItem]
  );

  // get target date, next or previous function
  const getTargetDate = useCallback(
    (prevDate = true): void => {
      const currentIndex = finalMenuItem.findIndex((i) => i === mapDate);
      let targetIndex = prevDate ? currentIndex + 1 : currentIndex - 1;
      let finalDate = finalMenuItem[targetIndex];

      // skip year item
      if (finalDate.length === 4) {
        targetIndex = prevDate ? targetIndex + 1 : targetIndex - 1;
        finalDate = finalMenuItem[targetIndex];
      }
      setMapDate(finalDate);
      navButtonState(finalDate);
    },
    [finalMenuItem, mapDate, navButtonState, setMapDate]
  );

  const getPrevDate = useCallback((): void => {
    getTargetDate(true);
  }, [getTargetDate]);

  const getNextDate = useCallback((): void => {
    getTargetDate(false);
  }, [getTargetDate]);

  const handleDateChange = useCallback(
    (e: SelectChangeEvent<string>): void => {
      setMapDate(e.target.value);
      navButtonState(e.target.value);
    },
    [navButtonState, setMapDate]
  );

  useEffect(() => {
    navButtonState(mapDate);
  }, [finalMenuItem, navButtonState, mapDate]);

  return (
    <Box className="date-grid">
      <Button
        title="Previous Date"
        variant="text"
        color="inherit"
        onClick={getPrevDate}
        disabled={prevDisabled}
        className="nav-button prev-button"
      >
        <NavigateBeforeIcon />
      </Button>
      <FormControl size="small">
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={mapDate}
          label="Map Date"
          onChange={handleDateChange}
          className="dropdown-date-button"
          MenuProps={{
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'center'
            },
            transformOrigin: {
              vertical: 515,
              horizontal: 'center'
            },
            className: 'dropdown-menu'
          }}
          IconComponent={() => null}
          renderValue={renderSelectedDate}
          SelectDisplayProps={{
            className: 'mobile-display'
          }}
        >
          {renderMenuItem(finalMenuItem)}
        </Select>
      </FormControl>
      <Button
        title="Next Date"
        variant="text"
        color="inherit"
        onClick={getNextDate}
        disabled={nextDisabled}
        className="nav-button next-button"
      >
        <NavigateNextIcon />
      </Button>
    </Box>
  );
};

export default MapDatepicker;
