import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

interface DatePickerProps {
  mapDate: string;
  setMapDate: any;
}

const MapDatepicker = ({
  mapDate,
  setMapDate
}: DatePickerProps): JSX.Element => {
  return (
    <Select
      labelId="demo-simple-select-label"
      id="demo-simple-select"
      value={mapDate}
      label="Map Date"
      onChange={(e) => setMapDate(e.target.value)}
      sx={{ backgroundColor: 'white' }}
    >
      <MenuItem value="2021-10-29">29 October 2021</MenuItem>
      <MenuItem value="2014-09-28">28 September 2014</MenuItem>
    </Select>
  );
};

export default MapDatepicker;
