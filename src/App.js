import './css/App.css'
import { Provider } from 'react-redux'
import store from './data/store'
import Arena from './components/Arena';

function App() {
  return (
    <view className={'App'}>
      <Provider store={store}>
        <Arena/>
      </Provider>
    </view>
  );
}

export default App;
