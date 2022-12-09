import Button from '@mui/material/Button';
import CompareIcon from '@mui/icons-material/Compare';

interface compareProps {
  compare: boolean;
  set: any;
}

const CompareNearmapButton = ({ compare, set }: compareProps): JSX.Element => {
  return (
    <Button
      color="primary"
      aria-label="compare map"
      component="label"
      onClick={() => {
        set(!compare);
        console.log(compare);
      }}
      size="small"
      variant="contained"
      sx={{
        backgroundColor: 'white',
        paddingY: '8px',
        margin: '0.5rem'
      }}
    >
      <CompareIcon fontSize="medium" color="primary" />
    </Button>
  );
};

export default CompareNearmapButton;
