// @flow
import { createStackNavigator } from 'react-navigation';
import SalmoList from './screens/SalmoList';
import SalmoDetail from './screens/SalmoDetail';
import ListDetail from './screens/ListDetail';
import PDFViewer from './screens/PDFViewer';
import AppNavigatorOptions from './AppNavigatorOptions';
import MenuNavigator from './MenuNavigator';
import I18n from './translations';

const AppNavigator = createStackNavigator(
  {
    Menu: MenuNavigator,
    SalmoList: SalmoList,
    SalmoDetail: SalmoDetail,
    PDFViewer: PDFViewer,
    ListDetail: ListDetail
  },
  {
    navigationOptions: (props: any) => {
      var options = AppNavigatorOptions;
      options.headerTruncatedBackTitle = I18n.t('ui.back');
      var navigation = props.navigation;
      if (typeof navigation.state.index == 'number') {
        var current = navigation.state.routes[navigation.state.index];
        var screen = MenuNavigator.router.getComponentForRouteName(current.key);
        options = Object.assign(options, screen.navigationOptions(props));
      }
      console.log('opts', options);
      return options;
    },
    cardStyle: {
      backgroundColor: 'white'
    }
  }
);

export default AppNavigator;
