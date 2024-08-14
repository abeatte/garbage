import React from 'react';
import './css/App.css'
import { Provider } from 'react-redux'
import store from './data/store'
import Analytics from './analytics';
import TitleScreen from './components/TitleScreen';

Analytics.init();

function App() { 
  return (
    <div className={'App'}> 
      <Provider store={store}>
        <TitleScreen/>
      </Provider>
    </div>
  );
}

export default App;
