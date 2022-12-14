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
import { useState } from 'react';
// import { useEffect } from 'react';

interface DatePickerProps {
  mapDate: string;
  setMapDate: any;
  dateList: string[];
}

const buttonStyle = {
  backgroundColor: 'white',
  py: '8px',
  mx: '-2px',
  zIndex: 999,
  '&:hover': {
    backgroundColor: 'ghostwhite'
  }
};

const renderSelectedDate = (date: string): string => {
  const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
  return format(parsedDate, 'E MMM dd yyyy');
};

const renderMenuItem = (dateList: string[]): JSX.Element[] => {
  return dateList.map((d) => {
    // check for year
    if (d.length === 4) {
      return (
        <ListSubheader key={d} sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
          {d}
        </ListSubheader>
      );
    }
    const parsedDate = parse(d, 'yyyy-MM-dd', new Date());
    const formatDate = format(parsedDate, 'MMMM dd');

    return (
      <MenuItem
        key={d}
        value={d}
        sx={{
          backgroundImage:
            'linear-gradient(rgb(129, 129, 129), rgb(129, 129, 129))',
          backgroundSize: '2px 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '9%',
          pr: '8rem'
        }}
      >
        <ListItemIcon>
          <TripOriginOutlinedIcon
            fontSize="small"
            color="action"
            sx={{ padding: '2px', background: 'white', borderRadius: '50%' }}
          />
        </ListItemIcon>
        <ListItemText>{formatDate}</ListItemText>
      </MenuItem>
    );
  });
};

const MapDatepicker = ({
  mapDate,
  setMapDate,
  dateList
}: DatePickerProps): JSX.Element => {
  const [nextDisabled, setNextDisabled] = useState(false);
  const [prevDisabled, setPrevDisabled] = useState(true);

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
  const navButtonState = (currentIndex: number): void => {
    switch (true) {
      // disable next button if last record, last should never be a year
      case currentIndex === finalMenuItem.length - 1: {
        setNextDisabled(true);
        setPrevDisabled(false);
        break;
      }
      // disable prev button if 2nd record, 1st should always be a year
      case currentIndex === 1: {
        setPrevDisabled(true);
        setNextDisabled(false);
        break;
      }
      // enable both next and prev button
      default: {
        setNextDisabled(false);
        setPrevDisabled(false);
        break;
      }
    }
  };

  // get target date, next or previous function
  const getTargetDate = (next = true): void => {
    const currentIndex = finalMenuItem.findIndex((i) => i === mapDate);
    let targetIndex = next ? currentIndex + 1 : currentIndex - 1;

    // skip year item
    if (finalMenuItem[targetIndex].length === 4) {
      targetIndex = next ? targetIndex + 1 : targetIndex - 1;
    }
    setMapDate(finalMenuItem[targetIndex]);
    navButtonState(targetIndex);
  };

  const handleDateChange = (e: SelectChangeEvent<string>): void => {
    const currentIndex = finalMenuItem.findIndex((i) => i === e.target.value);
    setMapDate(e.target.value);
    navButtonState(currentIndex);
  };

  return (
    <Box sx={{ gridColumn: '1/3', justifySelf: 'stretch' }}>
      <Button
        title="Previous Date"
        variant="text"
        color="inherit"
        onClick={() => getTargetDate(false)}
        disabled={prevDisabled}
        sx={buttonStyle}
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
          sx={{
            backgroundColor: 'white',
            fontWeight: 'bold',
            borderRadius: '0px'
            // '&:hover': {
            //   '& fieldset': {
            //     borderColor: 'red'
            //   }
            // }
          }}
          MenuProps={{
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'center'
            },
            transformOrigin: {
              vertical: 515,
              horizontal: 'center'
            },
            sx: {
              maxHeight: '500px'
            }
          }}
          IconComponent={() => null}
          renderValue={(s) => renderSelectedDate(s)}
        >
          {renderMenuItem(finalMenuItem)}
        </Select>
      </FormControl>
      <Button
        title="Next Date"
        variant="text"
        color="inherit"
        onClick={() => getTargetDate(true)}
        disabled={nextDisabled}
        sx={buttonStyle}
      >
        <NavigateNextIcon />
      </Button>
    </Box>
  );
};

export default MapDatepicker;
