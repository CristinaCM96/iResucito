// @flow
import React, { useContext, useState, useMemo } from 'react';
import BaseModal from './BaseModal';
import { Text, Icon } from 'native-base';
import { FlatList, View } from 'react-native';
import { DataContext } from '../DataContext';
import commonTheme from '../native-base-theme/variables/platform';
import I18n from '../translations';
import ContactListItem from './ContactListItem';
import { contactFilterByText, ordenAlfabetico } from '../util';
import SearchBarView from './SearchBarView';

const ContactChooserDialog = (props: any) => {
  const data = useContext(DataContext);
  const { navigation } = props;
  const { setList } = data.lists;
  const { brothers } = data.community;
  const [textFilter, setTextFilter] = useState('');

  const target = navigation.getParam('target');

  const filtered = useMemo(() => {
    var result = brothers.filter(c => contactFilterByText(c, textFilter));
    result.sort(ordenAlfabetico);
    return result;
  }, [brothers, textFilter]);

  const contactSelected = contact => {
    setList(target.listName, target.listKey, contact.givenName);
    navigation.goBack(null);
  };

  return (
    <BaseModal title={I18n.t('screen_title.community')} fade={true}>
      {brothers.length == 0 && (
        <View
          style={{
            flex: 3,
            justifyContent: 'space-around',
            padding: 10
          }}>
          <Icon
            name="contacts"
            style={{
              fontSize: 120,
              color: commonTheme.brandPrimary,
              alignSelf: 'center'
            }}
          />
          <Text note style={{ textAlign: 'center' }}>
            {I18n.t('ui.community empty')}
          </Text>
        </View>
      )}
      <SearchBarView value={textFilter} setValue={setTextFilter}>
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={item => item.recordID}
          renderItem={({ item }) => {
            return (
              <ContactListItem
                item={item}
                onPress={() => {
                  contactSelected(item);
                }}
              />
            );
          }}
        />
      </SearchBarView>
    </BaseModal>
  );
};

export default ContactChooserDialog;
