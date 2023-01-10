import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CompareIcon from '@mui/icons-material/Compare';
import './index.css';

interface compareProps {
  compare: boolean;
  set: any;
  disabled: boolean;
}

const CompareNearmapButton = ({
  compare,
  set,
  disabled
}: compareProps): JSX.Element => {
  return (
    <Box className="compare-grid">
      <Button
        aria-label="compare map"
        component="label"
        onClick={() => {
          set(!compare);
          // console.log(compare);
        }}
        size="small"
        variant="contained"
        color="inherit"
        disabled={disabled}
        className="compare-button"
      >
        <CompareIcon fontSize="medium" color="inherit" />
      </Button>
    </Box>
  );
};

export default CompareNearmapButton;