import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Autocomplete, createTheme, MantineProvider, Select } from '@mantine/core';
import '@mantine/core/styles.css';
import { App } from './App';

export const PRIMARY_COLORS = [
  'dark',
  'gray',
  'red',
  'pink',
  'grape',
  'violet',
  'indigo',
  'blue',
  'cyan',
  'teal',
  'green',
  'lime',
  'yellow',
  'orange',
] as const;

export type PrimaryColor = (typeof PRIMARY_COLORS)[number];

function Root() {
  const [primaryColor, setPrimaryColor] = useState<PrimaryColor>('teal');
  const theme = createTheme({
    primaryColor,
    components: {
      Autocomplete: Autocomplete.extend({
        defaultProps: { comboboxProps: { shadow: 'md', withinPortal: true } },
      }),
      Select: Select.extend({
        defaultProps: { comboboxProps: { shadow: 'md', withinPortal: true } },
      }),
    },
  });

  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <App primaryColor={primaryColor} onPrimaryColorChange={setPrimaryColor} />
    </MantineProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
