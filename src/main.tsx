import React from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
// import { ThemeProvider } from '@mui/material/styles'
import App from './App';
import './index.css';

const Root = (): JSX.Element => {
  return (
    <React.StrictMode>
      <CssBaseline />
      <App />
    </React.StrictMode>
  );
};

const main = createRoot(document.getElementById('root') as HTMLElement);
main.render(<Root />);
