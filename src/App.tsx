import React from 'react';
import './css/App.css'
import { Provider } from 'react-redux'
import store from './data/store'
import Game from './components/Game';
import Analytics from './analytics';

Analytics.init();

function App() { 
  return (
    <div className={'App'}> 
      <Provider store={store}>
        <Game/>
      </Provider>
    </div>
  );
}

export default App;
