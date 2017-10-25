import React from 'react';
import { connect } from 'react-redux';
import BaseModal from './BaseModal';
import { Text, ListItem, Thumbnail, Left, Body } from 'native-base';
import { FlatList, Platform } from 'react-native';
import { addContactToList, closeChooserDialog } from '../actions';
import { getProcessedContacts } from '../selectors';

const unknown = require('../../img/avatar.png');

const ContactChooserDialog = props => {
  return (
    <BaseModal
      visible={props.visible}
      closeModal={() => props.close()}
      title="Comunidad"
      fade={true}>
      {props.items.length == 0 && (
        <Text note style={{ textAlign: 'center', paddingTop: 20 }}>
          Sin nombres importados. Para elegir mediante la lista, debes importar
          desde tus contactos en la opción Comunidad.
        </Text>
      )}
      <FlatList
        data={props.items}
        keyExtractor={item => item.recordID}
        renderItem={({ item }) => {
          var contactFullName =
            Platform.OS == 'ios'
              ? `${item.givenName} ${item.familyName}`
              : item.givenName;
          return (
            <ListItem
              avatar
              button
              onPress={() => {
                props.contactSelected(item, props.listName, props.listKey);
              }}>
              <Left>
                <Thumbnail
                  small
                  source={
                    item.hasThumbnail ? { uri: item.thumbnailPath } : unknown
                  }
                />
              </Left>
              <Body>
                <Text>{item.givenName}</Text>
                <Text note>{contactFullName}</Text>
              </Body>
            </ListItem>
          );
        }}
      />
    </BaseModal>
  );
};

const mapStateToProps = state => {
  var chooser = state.ui.get('chooser');
  var chooser_target_list = state.ui.get('chooser_target_list');
  var chooser_target_key = state.ui.get('chooser_target_key');
  return {
    listName: chooser_target_list,
    listKey: chooser_target_key,
    visible: chooser === 'Contact',
    items: getProcessedContacts(state)
  };
};

const mapDispatchToProps = dispatch => {
  return {
    close: () => {
      dispatch(closeChooserDialog());
    },
    contactSelected: (contact, list, key) => {
      dispatch(addContactToList(contact, list, key));
      dispatch(closeChooserDialog());
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(
  ContactChooserDialog
);
