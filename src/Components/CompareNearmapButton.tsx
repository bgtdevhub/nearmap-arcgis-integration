import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CompareIcon from '@mui/icons-material/Compare';

interface compareProps {
  compare: boolean;
  set: any;
}

const CompareNearmapButton = ({ compare, set }: compareProps): JSX.Element => {
  return (
    <Box sx={{ justifySelf: 'center' }}>
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
        sx={{
          backgroundColor: 'white',
          py: '8px'
        }}
      >
        <CompareIcon fontSize="medium" color="inherit" />
      </Button>
    </Box>
  );
};

export default CompareNearmapButton;
