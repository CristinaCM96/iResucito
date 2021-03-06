// @flow
import React, { useState, useEffect } from 'react';
import { Alert, Platform, Share } from 'react-native';
import { Toast } from 'native-base';
import RNFS from 'react-native-fs';
import I18n from './translations';
import badges from './badges';
import { localdata, clouddata } from './data';
import {
  getEsSalmo,
  getDefaultLocale,
  getFriendlyText,
  getFriendlyTextForListType,
  getContacts,
  NativeSongs
} from './util';

const SongsIndexPatchPath =
  RNFS.DocumentDirectoryPath + '/SongsIndexPatch.json';

const useSettings = () => {
  const [initialized, setInitialized] = useState(false);
  const [keys, initKeys] = useState();

  const setKey = (key, value) => {
    const updatedKeys = Object.assign({}, keys, { [key]: value });
    I18n.locale = getLocaleReal(updatedKeys.locale);
    initKeys(updatedKeys);
  };

  const getLocaleReal = (rawLoc: string) => {
    var locale = rawLoc === 'default' ? getDefaultLocale() : rawLoc;
    return locale;
  };

  useEffect(() => {
    if (keys && initialized) {
      localdata.save({
        key: 'settings',
        data: keys
      });
    }
  }, [keys, initialized]);

  useEffect(() => {
    localdata
      .load({
        key: 'settings'
      })
      .then(data => {
        if (!data) {
          data = {
            developerMode: false,
            keepAwake: true,
            locale: 'default'
          };
        }
        I18n.locale = getLocaleReal(data.locale);
        initKeys(data);
        setInitialized(true);
      });
  }, []);

  return { keys, initKeys, setKey, getLocaleReal };
};

const useSongsMeta = (locale: any) => {
  const [indexPatchExists, setIndexPatchExists] = useState(false);
  const [songs, setSongs] = useState([]);
  const [localeSongs, setLocaleSongs] = useState([]);

  const initializeSingleSong = song => {
    var idx = songs.findIndex(i => i.key == song.key);
    songs[idx] = Object.assign({}, song);
    setSongs(songs);
  };

  const readLocalePatch = () => {
    return RNFS.exists(SongsIndexPatchPath).then(exists => {
      setIndexPatchExists(exists);
      if (exists)
        return RNFS.readFile(SongsIndexPatchPath)
          .then(patchJSON => {
            return JSON.parse(patchJSON);
          })
          .catch(() => {
            return RNFS.unlink(SongsIndexPatchPath).then(() => {
              Alert.alert(
                I18n.t('alert_title.corrupt patch'),
                I18n.t('alert_message.corrupt patch')
              );
            });
          });
    });
  };

  const saveLocalePatch = (patchObj: any) => {
    var json = JSON.stringify(patchObj, null, ' ');
    return RNFS.writeFile(SongsIndexPatchPath, json, 'utf8').then(() => {
      setIndexPatchExists(true);
    });
  };

  const setSongLocalePatch = (song: Song, rawLoc: string, file?: SongFile) => {
    if (file && file.nombre.endsWith('.txt'))
      throw new Error('file con .txt! Pasar sin extension.');

    return readLocalePatch().then(patchObj => {
      var locale = rawLoc.split('-')[0];
      if (!patchObj) patchObj = {};
      if (!patchObj[song.key]) patchObj[song.key] = {};
      if (file) {
        patchObj[song.key][locale] = file.nombre;
        Toast.show({
          text: I18n.t('locale patch added', {
            song: song.titulo,
            file: file.nombre
          }),
          duration: 5000,
          type: 'success',
          buttonText: 'Ok'
        });
      } else {
        delete patchObj[song.key];
        Toast.show({
          text: I18n.t('locale patch removed', { song: song.titulo }),
          duration: 5000,
          type: 'success',
          buttonText: 'Ok'
        });
      }
      var updatedSong = NativeSongs.getSingleSongMeta(
        song.key,
        locale,
        patchObj
      );
      return NativeSongs.loadSingleSong(updatedSong)
        .then(() => {
          initializeSingleSong(updatedSong);
          return saveLocalePatch(patchObj);
        })
        .then(() => {
          return NativeSongs.readLocaleSongs(locale).then(items => {
            setLocaleSongs(items);
          });
        });
    });
  };

  const clearIndexPatch = () => {
    return RNFS.exists(SongsIndexPatchPath).then(exists => {
      if (exists) {
        return RNFS.unlink(SongsIndexPatchPath).then(() => {
          setIndexPatchExists(false);
        });
      }
    });
  };

  useEffect(() => {
    if (locale) {
      // Cargar parche del indice si existe
      readLocalePatch()
        .then(patchObj => {
          // Construir metadatos de cantos
          var metaData = NativeSongs.getSongsMeta(locale, patchObj);
          return Promise.all(NativeSongs.loadSongs(metaData)).then(() => {
            setSongs(metaData);
          });
        })
        .then(() => {
          return NativeSongs.readLocaleSongs(locale).then(items => {
            setLocaleSongs(items);
          });
        });
    }
  }, [locale, indexPatchExists]);

  return {
    songs,
    setSongs,
    localeSongs,
    setLocaleSongs,
    readLocalePatch,
    saveLocalePatch,
    indexPatchExists,
    setSongLocalePatch,
    clearIndexPatch
  };
};

const useLists = (songs: any) => {
  const [initialized, setInitialized] = useState(false);
  const [lists, initLists] = useState({});

  const addList = (listName, type) => {
    let schema = { type: type };
    switch (type) {
      case 'libre':
        schema = Object.assign({}, schema, { items: [] });
        break;
      case 'palabra':
        schema = Object.assign({}, schema, {
          ambiental: null,
          entrada: null,
          '1-monicion': null,
          '1': null,
          '1-salmo': null,
          '2-monicion': null,
          '2': null,
          '2-salmo': null,
          '3-monicion': null,
          '3': null,
          '3-salmo': null,
          'evangelio-monicion': null,
          evangelio: null,
          salida: null,
          nota: null
        });
        break;
      case 'eucaristia':
        schema = Object.assign({}, schema, {
          ambiental: null,
          entrada: null,
          '1-monicion': null,
          '1': null,
          '2-monicion': null,
          '2': null,
          'evangelio-monicion': null,
          evangelio: null,
          paz: null,
          'comunion-pan': null,
          'comunion-caliz': null,
          salida: null,
          nota: null
        });
        break;
    }
    const changedLists = Object.assign({}, lists, { [listName]: schema });
    initLists(changedLists);
  };

  const removeList = listName => {
    const changedLists = Object.assign({}, lists);
    delete changedLists[listName];
    initLists(changedLists);
  };

  const renameList = (listName, newName) => {
    const list = lists[listName];
    delete lists[listName];
    const changedLists = Object.assign({}, lists, { [newName]: list });
    initLists(changedLists);
  };

  const getList = (listName, listKey) => {
    const targetList = lists[listName];
    return targetList[listKey];
  };

  const setList = (listName, listKey, listValue) => {
    const targetList = lists[listName];
    var schema;
    if (listValue !== undefined) {
      if (typeof listKey == 'string')
        schema = Object.assign({}, targetList, { [listKey]: listValue });
      else if (typeof listKey == 'number') {
        var isPresent = targetList.items.find(s => s == listValue);
        if (isPresent) {
          return;
        }
        var newItems = Object.assign([], targetList.items);
        newItems[listKey] = listValue;
        schema = Object.assign({}, targetList, { items: newItems });
      }
    } else {
      if (typeof listKey == 'string') {
        /* eslint-disable no-unused-vars */
        var { [listKey]: omit, ...schema } = targetList;
      } else if (typeof listKey == 'number') {
        var newItems = Object.assign([], targetList.items);
        newItems.splice(listKey, 1);
        schema = Object.assign({}, targetList, { items: newItems });
      }
    }
    const changedLists = Object.assign({}, lists, { [listName]: schema });
    initLists(changedLists);
  };

  const getListForUI = (listName: any) => {
    var uiList = Object.assign({}, lists[listName]);
    Object.entries(uiList).forEach(([clave, valor]) => {
      // Si es de tipo 'libre', los salmos están dentro de 'items'
      if (clave === 'items' && Array.isArray(valor)) {
        valor = valor.map(nombre => {
          return songs.find(s => s.nombre == nombre);
        });
      } else if (getEsSalmo(clave) && valor !== null) {
        valor = songs.find(s => s.nombre == valor);
      }
      uiList[clave] = valor;
    });
    return uiList;
  };

  const getListsForUI = () => {
    var listNames = Object.keys(lists);
    return listNames.map(name => {
      var listMap = lists[name];
      return {
        name: name,
        type: getFriendlyTextForListType(listMap.type)
      };
    });
  };

  const getItemForShare = (list: any, key: string) => {
    if (list.hasOwnProperty(key)) {
      var valor = list[key];
      if (valor && getEsSalmo(key)) {
        valor = valor.titulo;
      }
      if (valor) {
        return getFriendlyText(key) + ': ' + valor;
      }
    }
    return null;
  };

  const shareList = (listName: string) => {
    var list = getListForUI(listName);
    var items = [];
    if (list.type === 'libre') {
      var cantos = list.items;
      cantos.forEach((canto, i) => {
        items.push(`${i + 1} - ${canto.titulo}`);
      });
    } else {
      items.push(getItemForShare(list, 'ambiental'));
      items.push(getItemForShare(list, 'entrada'));
      items.push(getItemForShare(list, '1-monicion'));
      items.push(getItemForShare(list, '1'));
      items.push(getItemForShare(list, '1-salmo'));
      items.push(getItemForShare(list, '2-monicion'));
      items.push(getItemForShare(list, '2'));
      items.push(getItemForShare(list, '2-salmo'));
      items.push(getItemForShare(list, '3-monicion'));
      items.push(getItemForShare(list, '3'));
      items.push(getItemForShare(list, '3-salmo'));
      items.push(getItemForShare(list, 'evangelio-monicion'));
      items.push(getItemForShare(list, 'evangelio'));
      items.push(getItemForShare(list, 'paz'));
      items.push(getItemForShare(list, 'comunion-pan'));
      items.push(getItemForShare(list, 'comunion-caliz'));
      items.push(getItemForShare(list, 'salida'));
      items.push(getItemForShare(list, 'nota'));
    }
    var message = items.filter(n => n).join('\n');
    Share.share(
      {
        message: message,
        title: `Lista iResucitó ${listName}`,
        url: undefined
      },
      { dialogTitle: I18n.t('ui.share') }
    );
  };

  useEffect(() => {
    if (lists && initialized) {
      var item = { key: 'lists', data: lists };
      localdata.save(item);
      if (Platform.OS == 'ios') {
        clouddata.save(item);
      }
    }
  }, [lists, initialized]);

  useEffect(() => {
    localdata
      .load({
        key: 'lists'
      })
      .then(data => {
        if (data) {
          initLists(data);
        }
        setInitialized(true);
      });
    // TODO
    // IDEA: al abrir la pantalla de listas, cargar las
    // listas desde iCloud, y si hay cambios, consultar
    // al usuario si desea tomar los cambios y aplicarlos
    // clouddata.load({ key: 'lists' }).then(res => {
    //   console.log('loaded from iCloud', res);
    // });
  }, []);

  return {
    lists,
    initLists,
    addList,
    removeList,
    renameList,
    getList,
    setList,
    getListForUI,
    getListsForUI,
    shareList
  };
};

const useSearch = (locale: string, developerMode: boolean) => {
  const [initialized, setInitialized] = useState(false);
  const [searchItems, setSearchItems] = useState();

  useEffect(() => {
    // Construir menu de búsqueda
    setInitialized(false);
    var items: Array<SearchItem> = [
      {
        title_key: 'search_title.alpha',
        note: I18n.t('search_note.alpha'),
        route: 'SalmoList',
        chooser: I18n.t('search_tabs.all'),
        params: { filter: null },
        badge: badges.Alfabético
      },
      {
        title_key: 'search_title.stage',
        divider: true
      },
      {
        title_key: 'search_title.precatechumenate',
        note: I18n.t('search_note.precatechumenate'),
        route: 'SalmoList',
        params: { filter: { etapa: 'Precatecumenado' } },
        badge: badges.Precatecumenado
      },
      {
        title_key: 'search_title.catechumenate',
        note: I18n.t('search_note.catechumenate'),
        route: 'SalmoList',
        params: { filter: { etapa: 'Catecumenado' } },
        badge: badges.Catecumenado
      },
      {
        title_key: 'search_title.election',
        note: I18n.t('search_note.election'),
        route: 'SalmoList',
        params: { filter: { etapa: 'Eleccion' } },
        badge: badges.Eleccion
      },
      {
        title_key: 'search_title.liturgy',
        note: I18n.t('search_note.liturgy'),
        route: 'SalmoList',
        params: { filter: { etapa: 'Liturgia' } },
        badge: badges.Liturgia
      },
      {
        title_key: 'search_title.liturgical time',
        divider: true
      },
      {
        title_key: 'search_title.advent',
        note: I18n.t('search_note.advent'),
        route: 'SalmoList',
        params: { filter: { adviento: true } },
        badge: null
      },
      {
        title_key: 'search_title.christmas',
        note: I18n.t('search_note.christmas'),
        route: 'SalmoList',
        params: { filter: { navidad: true } },
        badge: null
      },
      {
        title_key: 'search_title.lent',
        note: I18n.t('search_note.lent'),
        route: 'SalmoList',
        params: { filter: { cuaresma: true } },
        badge: null
      },
      {
        title_key: 'search_title.easter',
        note: I18n.t('search_note.easter'),
        route: 'SalmoList',
        params: { filter: { pascua: true } },
        badge: null
      },
      {
        title_key: 'search_title.pentecost',
        note: I18n.t('search_note.pentecost'),
        route: 'SalmoList',
        params: { filter: { pentecostes: true } },
        badge: null
      },
      {
        title_key: 'search_title.liturgical order',
        divider: true
      },
      {
        title_key: 'search_title.entrance',
        note: I18n.t('search_note.entrance'),
        route: 'SalmoList',
        params: { filter: { entrada: true } },
        badge: null,
        chooser: I18n.t('search_tabs.entrance'),
        chooser_listKey: ['entrada']
      },
      {
        title_key: 'search_title.peace and offerings',
        note: I18n.t('search_note.peace and offerings'),
        route: 'SalmoList',
        params: { filter: { paz: true } },
        badge: null,
        chooser: I18n.t('search_tabs.peace and offerings'),
        chooser_listKey: ['paz']
      },
      {
        title_key: 'search_title.fraction of bread',
        note: I18n.t('search_note.fraction of bread'),
        route: 'SalmoList',
        params: { filter: { fraccion: true } },
        badge: null,
        chooser: I18n.t('search_tabs.fraction of bread'),
        chooser_listKey: ['comunion-pan']
      },
      {
        title_key: 'search_title.communion',
        note: I18n.t('search_note.communion'),
        route: 'SalmoList',
        params: { filter: { comunion: true } },
        badge: null,
        chooser: I18n.t('search_tabs.communion'),
        chooser_listKey: ['comunion-pan', 'comunion-caliz']
      },
      {
        title_key: 'search_title.exit',
        note: I18n.t('search_note.exit'),
        route: 'SalmoList',
        params: { filter: { final: true } },
        badge: null,
        chooser: I18n.t('search_tabs.exit'),
        chooser_listKey: ['salida']
      },
      {
        title_key: 'search_title.signing to the virgin',
        note: I18n.t('search_note.signing to the virgin'),
        route: 'SalmoList',
        params: { filter: { virgen: true } },
        badge: null,
        chooser: I18n.t('search_tabs.signing to the virgin')
      },
      {
        /* eslint-disable quotes */
        title_key: `search_title.children's songs`,
        note: I18n.t(`search_note.children's songs`),
        route: 'SalmoList',
        params: { filter: { niños: true } },
        badge: null
      },
      {
        title_key: 'search_title.lutes and vespers',
        note: I18n.t('search_note.lutes and vespers'),
        route: 'SalmoList',
        params: { filter: { laudes: true } },
        badge: null
      }
    ];
    items = items.map(item => {
      if (item.params) {
        item.params.title_key = item.title_key;
      }
      return item;
    });
    if (developerMode) {
      items.unshift({
        title_key: 'search_title.unassigned',
        note: I18n.t('search_note.unassigned'),
        route: 'UnassignedList',
        params: { filter: null },
        badge: null
      });
    }
    setSearchItems(items);
    setInitialized(true);
  }, [locale, developerMode]);

  return { initialized, searchItems };
};

const useCommunity = () => {
  const [initialized, setInitialized] = useState(false);
  const [brothers, initBrothers] = useState([]);
  const [deviceContacts, initDeviceContacts] = useState();
  const [updateThumbs, setUpdateThumbs] = useState();

  const add = item => {
    var changedContacts = [...brothers, item];
    initBrothers(changedContacts);
  };

  const update = (id, item) => {
    var contact = brothers.find(c => c.recordID === id);
    var idx = brothers.indexOf(contact);
    var updatedContacts = [...brothers];
    updatedContacts[idx] = Object.assign(contact, item);
    initBrothers(updatedContacts);
  };

  const remove = item => {
    var idx = brothers.indexOf(item);
    var changedContacts = brothers.filter((l, i) => i !== idx);
    initBrothers(changedContacts);
  };

  const addOrRemove = contact => {
    var i = brothers.findIndex(c => c.recordID == contact.recordID);
    // Ya esta importado
    if (i !== -1) {
      var item = brothers[i];
      remove(item);
    } else {
      add(contact);
    }
  };

  useEffect(() => {
    if (brothers && deviceContacts && updateThumbs === true) {
      // guardar directorio nuevo
      localdata
        .save({
          key: 'lastCachesDirectoryPath',
          data: RNFS.CachesDirectoryPath
        })
        .then(() => {
          // Evitar nuevas actualizaciones recursivas!
          setUpdateThumbs(false);
          brothers.forEach(c => {
            // tomar el contacto actualizado
            var devContact = deviceContacts.find(
              x => x.recordID === c.recordID
            );
            update(c.recordID, devContact);
          });
        });
    }
  }, [brothers, deviceContacts, updateThumbs]);

  useEffect(() => {
    if (brothers && initialized) {
      var item = { key: 'contacts', data: brothers };
      localdata.save(item);
      if (Platform.OS == 'ios') {
        clouddata.save(item);
      }
    }
  }, [brothers, initialized]);

  useEffect(() => {
    getContacts()
      .then(contacts => {
        initDeviceContacts(contacts);
        localdata
          .getBatchData([
            { key: 'contacts' },
            { key: 'lastCachesDirectoryPath' }
          ])
          .then(result => {
            const [contacts, lastCachesDirectoryPath] = result;
            if (contacts) {
              initBrothers(contacts);
            }
            // sólo actualizar si cambió el directorio de caches
            var updThumbs =
              RNFS.CachesDirectoryPath !== lastCachesDirectoryPath;
            setUpdateThumbs(updThumbs);
            setInitialized(true);
          });
      })
      .catch(err => {
        let message = I18n.t('alert_message.contacts permission');
        if (Platform.OS == 'ios') {
          message += '\n\n' + I18n.t('alert_message.contacts permission ios');
        }
        Alert.alert(I18n.t('alert_title.contacts permission'), message);
      });
  }, []);

  return {
    brothers,
    deviceContacts,
    add,
    update,
    remove,
    addOrRemove
  };
};

export const DataContext: any = React.createContext();

const DataContextWrapper = (props: any) => {
  const community = useCommunity();
  const settings = useSettings();

  const locale = settings.keys ? settings.keys.locale : 'default';
  const developerMode = settings.keys ? settings.keys.developerMode : false;

  const songsMeta = useSongsMeta(locale);
  const search = useSearch(locale, developerMode);
  const lists = useLists(songsMeta.songs);

  const sharePDF = (canto: Song, pdfPath: string) => {
    Share.share(
      {
        title: `iResucitó - ${canto.titulo}`,
        url: pdfPath
      },
      { dialogTitle: I18n.t('ui.share') }
    );
  };

  const shareIndexPatch = () => {
    Share.share(
      {
        title: 'iResucitó - Index patch',
        url: SongsIndexPatchPath
      },
      { dialogTitle: I18n.t('ui.share') }
    );
  };

  return (
    <DataContext.Provider
      value={{
        settings,
        songsMeta,
        search,
        lists,
        community,
        sharePDF,
        shareIndexPatch
      }}>
      {props.children}
    </DataContext.Provider>
  );
};

export default DataContextWrapper;
