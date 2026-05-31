import React from 'react';
import ReactDOM from 'react-dom/client';
import { Autocomplete, createTheme, MantineProvider, Select } from '@mantine/core';
import '@mantine/core/styles.css';
import { App } from './App';

const theme = createTheme({
  primaryColor: 'teal',
  components: {
    Autocomplete: Autocomplete.extend({
      defaultProps: { comboboxProps: { shadow: 'md', withinPortal: true } },
    }),
    Select: Select.extend({
      defaultProps: { comboboxProps: { shadow: 'md', withinPortal: true } },
    }),
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <App />
    </MantineProvider>
  </React.StrictMode>,
);
