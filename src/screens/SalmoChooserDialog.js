// @flow
import React, { useContext, useEffect, useState, useRef } from 'react';
import { ScrollView } from 'react-native';
import { Button, Text, Segment } from 'native-base';
import BaseModal from './BaseModal';
import SalmoList from './SalmoList';
import { DataContext } from '../DataContext';
import I18n from '../translations';

const SalmoChooserDialog = (props: any) => {
  const data = useContext(DataContext);
  const scrollToActiveRef = useRef<?ScrollView>();
  const { navigation } = props;
  const { search } = data;
  const { setList } = data.lists;
  const { setSongLocalePatch } = data.songsMeta;
  const [segments, setSegments] = useState([]);
  const [activeSegment, setActiveSegment] = useState();
  const [scrollToActiveX, setScrollToActiveX] = useState();
  const [scrollToActive, setScrollToActive] = useState(false);

  const target = navigation.getParam('target');

  useEffect(() => {
    var choosers = search.searchItems.filter(x => x.chooser != undefined);
    if (target.listName && target.listKey) {
      var defChooser = choosers.find(
        t => t.chooser_listKey && t.chooser_listKey.includes(target.listKey)
      );
      if (defChooser) {
        setActiveSegment(defChooser);
        setScrollToActive(true);
      }
    }
  }, []);

  useEffect(() => {
    var choosers = search.searchItems.filter(x => x.chooser != undefined);
    setSegments(
      choosers.map((v, i) => {
        const isActive = activeSegment && activeSegment.chooser === v.chooser;
        return (
          <Button
            key={i}
            first={i === 0}
            last={i === choosers.length - 1}
            onPress={() => setActiveSegment(v)}
            active={isActive}
            ref={btn => {
              if (isActive && btn && btn._root)
                btn._root.measure(x => {
                  if (x > 0) {
                    setScrollToActiveX(x);
                  }
                });
            }}>
            <Text>{v.chooser.toUpperCase()}</Text>
          </Button>
        );
      })
    );
  }, [activeSegment]);

  useEffect(() => {
    if (
      scrollToActive === true &&
      scrollToActiveX &&
      scrollToActiveRef &&
      scrollToActiveRef.current
    ) {
      scrollToActiveRef.current.scrollTo({
        x: scrollToActiveX,
        animated: true
      });
    }
  }, [scrollToActive, scrollToActiveRef, scrollToActiveX]);

  const songAssign = salmo => {
    if (target.listName && target.listKey !== undefined) {
      setList(target.listName, target.listKey, salmo.nombre);
      navigation.goBack(null);
    } else if (target.locale && target.file) {
      setSongLocalePatch(salmo, target.locale, target.file).then(() => {
        navigation.goBack(null);
      });
    }
  };

  return (
    <BaseModal title={I18n.t('screen_title.find song')}>
      <ScrollView
        ref={scrollToActiveRef}
        style={{ flexGrow: 0, marginLeft: 8, marginRight: 8 }}
        horizontal={true}>
        <Segment>{segments}</Segment>
      </ScrollView>
      <SalmoList
        style={{ flexGrow: 1 }}
        filter={
          activeSegment && activeSegment.params
            ? activeSegment.params.filter
            : null
        }
        devModeDisabled={true}
        onPress={salmo => songAssign(salmo)}
      />
    </BaseModal>
  );
};

export default SalmoChooserDialog;
