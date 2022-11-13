import React from 'react';
import './css/App.css'
import { Provider } from 'react-redux'
import store from './data/store'
import Game from './components/Game';

function App() { 
  return (
    <view className={'App'}> 
      <Provider store={store}>
        <Game/>
      </Provider>
    </view>
  );
}

export default App;
