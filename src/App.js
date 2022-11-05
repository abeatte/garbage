import './css/App.css'
import { Provider } from 'react-redux'
import store from './data/store'
import Arena from './components/Arena';
import Hud from './components/Hud';

function App() {
  return (
    <view className={'App'}>
      <Provider store={store}>
        <Arena/>
        <Hud/>
      </Provider>
    </view>
  );
}

export default App;
