import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import parse from 'date-fns/parse';
import format from 'date-fns/format';
import ListSubheader from '@mui/material/ListSubheader';
import TripOriginOutlinedIcon from '@mui/icons-material/TripOriginOutlined';
import FormControl from '@mui/material/FormControl';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
// import { useEffect } from 'react';

interface DatePickerProps {
  mapDate: string;
  setMapDate: any;
  dateList: string[];
}

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
          fontSize: 'small',
          backgroundImage:
            'linear-gradient(rgb(129, 129, 129), rgb(129, 129, 129))',
          backgroundSize: '2px 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '15%'
        }}
      >
        <ListItemIcon>
          <TripOriginOutlinedIcon
            fontSize="small"
            color="action"
            sx={{ padding: '3px', background: 'white', borderRadius: '50%' }}
          />
        </ListItemIcon>
        <ListItemText>{formatDate}</ListItemText>
      </MenuItem>
    );
  });
};

// const nApiKey: string = import.meta.env.VITE_NEARMAP_KEY;

const MapDatepicker = ({
  mapDate,
  setMapDate,
  dateList
}: DatePickerProps): JSX.Element => {
  // const dateListMock = ['2021-10-29', '2021-09-29', '2014-09-28'];
  const yearList1 = dateList.map((y) => {
    return y.substring(0, 4);
  });
  const uniqYearList = [...new Set(yearList1)];

  const menuItem = uniqYearList.map((y2) => {
    const sameYear = dateList.filter((d) => y2 === d.substring(0, 4));
    const sameYear2 = [y2, ...sameYear];
    return renderMenuItem(sameYear2);
  });

  const finalMenuItem = menuItem.flat();

  return (
    <FormControl sx={{ m: 1 }} size="small">
      <Select
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        value={mapDate}
        label="Map Date"
        onChange={(e) => setMapDate(e.target.value)}
        sx={{ backgroundColor: 'white', fontWeight: 'bold' }}
        MenuProps={{ sx: { maxHeight: '500px' } }}
        IconComponent={() => null}
        renderValue={(s) => renderSelectedDate(s)}
      >
        {finalMenuItem}
      </Select>
    </FormControl>
  );
};

export default MapDatepicker;
