import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CompareIcon from '@mui/icons-material/Compare';
import './index.css';

interface CompareProps {
  compare: boolean;
  set: Function;
  disabled: boolean;
}

const CompareNearmapButton = ({
  compare,
  set,
  disabled
}: CompareProps): JSX.Element => {
  function onCompare(): void {
    set(!compare);
  }

  return (
    <Box className="compare-grid">
      <Button
        aria-label="compare map"
        component="label"
        onClick={onCompare}
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
