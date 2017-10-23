import { Platform, Share } from 'react-native';
import {
  INITIALIZE_DONE,
  SET_SALMOS_FILTER,
  SET_SALMO_CONTENT,
  SET_ABOUT_VISIBLE,
  SET_SETTINGS_VALUE,
  SET_CHOOSER_TARGETLIST,
  SET_LIST_ADD_VISIBLE,
  SET_LIST_CREATE_NEW,
  LIST_CREATE,
  LIST_CREATE_NAME,
  LIST_ADD_SALMO,
  LIST_ADD_TEXT,
  LIST_REMOVE_SALMO,
  LIST_DELETE,
  LIST_SHARE
} from '../actions';
import { NavigationActions } from 'react-navigation';
import { Map, fromJS } from 'immutable';
import { esLineaDeNotas } from '../util';
import { localdata, clouddata } from '../data';
import { getFriendlyText, getEsSalmo } from '../util';

const initialState = Map({
  salmos: null,
  salmos_text_filter: null,
  salmo_lines: null,
  about_visible: false,
  list_create_name: '',
  list_create_enabled: false,
  list_chooser_salmo: null,
  list_add_visible: false,
  list_create_new: false,
  chooser_target_list: null,
  chooser_target_key: null,
  lists: Map(),
  settings: Map({
    keepAwake: true
  })
});

const saveLists = state => {
  var listsJS = state.get('lists').toJS();
  var item = { key: 'lists', data: listsJS };
  localdata.save(item);
  if (Platform.OS == 'ios') {
    clouddata.save(item);
  }
};

const getItemForShare = (listMap, key) => {
  if (listMap.has(key)) {
    var valor = listMap.get(key);
    if (valor !== null && getEsSalmo(key)) {
      valor = valor.titulo;
    }
    if (valor) {
      return getFriendlyText(key) + ': ' + valor;
    }
  }
  return null;
};

export default function ui(state = initialState, action) {
  switch (action.type) {
    case INITIALIZE_DONE:
      state = state.set('salmos', action.salmos);
      if (action.settings) {
        state = state.set('settings', Map(action.settings));
      }
      if (action.lists) {
        state = state.set('lists', fromJS(action.lists));
      }
      return state;
    case SET_SALMOS_FILTER:
      return state.set('salmos_text_filter', action.filter);
    case SET_ABOUT_VISIBLE:
      return state.set('about_visible', action.visible);
    case SET_SETTINGS_VALUE:
      state = state.setIn(['settings', action.key], action.value);
      localdata.save({ key: 'settings', data: state.get('settings').toJS() });
      return state;
    case SET_CHOOSER_TARGETLIST:
      state = state.set('chooser_target_list', action.list);
      state = state.set('chooser_target_key', action.key);
      return state;
    case SET_LIST_ADD_VISIBLE:
      state = state.set('list_add_visible', action.visible);
      if (!action.visible) {
        state = state.set('list_create_name', null);
        state = state.set('list_create_enabled', false);
      }
      return state;
    case SET_LIST_CREATE_NEW:
      return state.set('list_create_new', action.value);
    case LIST_CREATE_NAME:
      state = state.set('list_create_name', action.name);
      var candidateName = action.name.trim();
      var lists = state
        .get('lists')
        .keySeq()
        .toArray();
      var result = candidateName !== '' && !lists.includes(candidateName);
      return state.set('list_create_enabled', result);
    case LIST_CREATE:
      if (!state.getIn(['lists', action.name])) {
        let schema = Map({ type: action.list_type });
        switch (action.list_type) {
          case 'libre':
            break;
          case 'palabra':
            schema = schema.set('ambiental', null);
            schema = schema.set('entrada', null);
            schema = schema.set('1-monicion', null);
            schema = schema.set('1', null);
            schema = schema.set('1-salmo', null);
            schema = schema.set('2-monicion', null);
            schema = schema.set('2', null);
            schema = schema.set('2-salmo', null);
            schema = schema.set('3-monicion', null);
            schema = schema.set('3', null);
            schema = schema.set('3-salmo', null);
            schema = schema.set('evangelio-monicion', null);
            schema = schema.set('evangelio', null);
            schema = schema.set('salida', null);
            break;
          case 'eucaristia':
            schema = schema.set('ambiental', null);
            schema = schema.set('entrada', null);
            schema = schema.set('1-monicion', null);
            schema = schema.set('1', null);
            schema = schema.set('2-monicion', null);
            schema = schema.set('2', null);
            schema = schema.set('evangelio-monicion', null);
            schema = schema.set('evangelio', null);
            schema = schema.set('paz', null);
            schema = schema.set('comunion', null);
            schema = schema.set('salida', null);
            break;
        }
        state = state.setIn(['lists', action.name], schema);
      }
      saveLists(state);
      return state;
    case LIST_ADD_SALMO:
      state = state.setIn(
        ['lists', action.list, action.key],
        action.salmo.nombre
      );
      saveLists(state);
      return state;
    case LIST_ADD_TEXT:
      state = state.setIn(['lists', action.list, action.key], action.text);
      saveLists(state);
      return state;
    case LIST_REMOVE_SALMO:
      state = state.updateIn(['lists', action.list, action.key], null);
      saveLists(state);
      return state;
    case LIST_DELETE:
      state = state.deleteIn(['lists', action.list]);
      saveLists(state);
      return state;
    case LIST_SHARE:
      var items = [];
      items.push(getItemForShare(action.listMap, 'ambiental'));
      items.push(getItemForShare(action.listMap, 'entrada'));
      items.push(getItemForShare(action.listMap, '1-monicion'));
      items.push(getItemForShare(action.listMap, '1'));
      items.push(getItemForShare(action.listMap, '1-salmo'));
      items.push(getItemForShare(action.listMap, '2-monicion'));
      items.push(getItemForShare(action.listMap, '2'));
      items.push(getItemForShare(action.listMap, '2-salmo'));
      items.push(getItemForShare(action.listMap, '3-monicion'));
      items.push(getItemForShare(action.listMap, '3'));
      items.push(getItemForShare(action.listMap, '3-salmo'));
      items.push(getItemForShare(action.listMap, 'evangelio-monicion'));
      items.push(getItemForShare(action.listMap, 'evangelio'));
      items.push(getItemForShare(action.listMap, 'paz'));
      items.push(getItemForShare(action.listMap, 'comunion'));
      items.push(getItemForShare(action.listMap, 'salida'));
      var message = items.filter(n => n).join('\n');
      /* eslint-disable no-console */
      console.log('Texto para compartir', message);
      Share.share(
        {
          message: message,
          title: `Lista iResucitó ${action.list}`,
          url: undefined
        },
        { dialogTitle: 'Compartir lista iResucitó' }
      );
      return state;
    case SET_SALMO_CONTENT:
      // Quitar caracteres invisibles del comienzo
      var lineas = action.content.split('\n');
      while (!esLineaDeNotas(lineas[0])) {
        lineas.shift();
      }
      lineas = lineas.filter(l => !l.includes('Page (0) Break'));
      return state.set('salmo_lines', lineas);
    case NavigationActions.NAVIGATE:
      switch (action.routeName) {
        case 'SalmoList':
          return (state = state.set('salmos_text_filter', null));
      }
      return state;
    default:
      return state;
  }
}
