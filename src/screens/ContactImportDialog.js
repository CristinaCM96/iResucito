// @flow
import React, { useContext, useState, useEffect, useMemo } from 'react';
import BaseModal from './BaseModal';
import SearchBarView from './SearchBarView';
import { Text, ListItem, Body, Right, CheckBox } from 'native-base';
import {
  FlatList,
  View,
  TouchableOpacity,
  Keyboard,
  StyleSheet
} from 'react-native';
import { DataContext } from '../DataContext';
import commonTheme from '../native-base-theme/variables/platform';
import I18n from '../translations';
import ContactPhoto from './ContactPhoto';
import {
  getContactsForImport,
  contactFilterByText,
  ordenAlfabetico
} from '../util';

const ContactImportDialog = (props: any) => {
  const data = useContext(DataContext);
  const { navigation } = props;
  const { brothers, deviceContacts, addOrRemove } = data.community;
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    var withName = deviceContacts.filter(
      c => c.givenName.length > 0 || c.familyName.length > 0
    );
    var result = getContactsForImport(withName, brothers);
    setContacts(result);
    setLoading(false);
  }, [brothers]);

  const filtered = useMemo(() => {
    var result = contacts.filter(c => contactFilterByText(c, filter));
    result.sort(ordenAlfabetico);
    return result;
  }, [contacts, filter]);

  const close = () => {
    setFilter('');
    navigation.goBack(null);
  };

  const handleContact = contact => {
    addOrRemove(contact);
    setFilter('');
  };

  var readyButton = (
    <Text
      style={{
        alignSelf: 'center',
        color: commonTheme.brandPrimary,
        marginRight: 10
      }}
      onPress={close}>
      {I18n.t('ui.done')}
    </Text>
  );

  return (
    <BaseModal
      closeButton={readyButton}
      title={I18n.t('screen_title.import contacts')}
      fade={true}>
      <SearchBarView value={filter} setValue={setFilter}>
        {brothers && brothers.length > 0 && (
          <View
            style={{
              padding: 10,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: commonTheme.listBorderColor
            }}>
            <FlatList
              horizontal={true}
              keyboardShouldPersistTaps="always"
              refreshing={loading}
              data={brothers}
              keyExtractor={item => item.recordID}
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity
                    style={{ marginRight: 10, width: 56 }}
                    onPress={() => handleContact(item)}>
                    <ContactPhoto item={item} />
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 12,
                        textAlign: 'center',
                        marginTop: 5
                      }}>
                      {item.givenName}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}
        <FlatList
          onScrollBeginDrag={() => Keyboard.dismiss()}
          keyboardShouldPersistTaps="always"
          data={filtered}
          keyExtractor={item => item.recordID}
          renderItem={({ item }) => {
            var contactFullName = item.givenName;
            if (item.familyName) {
              contactFullName += ` ${item.familyName}`;
            }
            return (
              <ListItem button onPress={() => handleContact(item)}>
                <ContactPhoto item={item} />
                <Body>
                  <Text
                    style={{ fontSize: 17, fontWeight: 'bold' }}
                    numberOfLines={1}>
                    {contactFullName}
                  </Text>
                  <Text note numberOfLines={1}>
                    {item.emailAddresses.length > 0
                      ? item.emailAddresses[0].email
                      : null}
                  </Text>
                </Body>
                <Right>
                  <CheckBox
                    style={{ marginRight: 15 }}
                    checked={item.imported}
                    onPress={() => handleContact(item)}
                  />
                </Right>
              </ListItem>
            );
          }}
        />
      </SearchBarView>
    </BaseModal>
  );
};

export default ContactImportDialog;
