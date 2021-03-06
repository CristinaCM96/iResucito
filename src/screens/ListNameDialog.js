// @flow
import React, { useContext, useState, useEffect } from 'react';
import { Text, Input, Item, Button, View } from 'native-base';
import { DataContext } from '../DataContext';
import BaseModal from './BaseModal';
import { getFriendlyTextForListType } from '../util';
import I18n from '../translations';

const ListNameDialog = (props: any) => {
  const data = useContext(DataContext);
  const { navigation } = props;
  const { lists, addList, renameList } = data.lists;
  const [disabledReasonText, setDisabledReasonText] = useState(null);
  const [actionEnabled, setActionEnabled] = useState(false);
  const [name, setName] = useState('');

  const list = navigation.getParam('list');
  const action = navigation.getParam('action');
  const type = navigation.getParam('type');

  const runActionOnList = () => {
    if (action === 'create') {
      addList(name, type);
      navigation.navigate('ListDetail', { list: { name } });
    } else if (action === 'rename') {
      renameList(list.name, name);
      navigation.goBack(null);
    }
  };

  useEffect(() => {
    if (name) {
      var candidateName = name.trim();
      var listNames = Object.keys(lists);
      var result = candidateName !== '' && !listNames.includes(candidateName);
      setActionEnabled(result);
    } else {
      setActionEnabled(false);
    }
  }, [name]);

  useEffect(() => {
    if (!actionEnabled) {
      var text =
        name && name.trim() !== ''
          ? I18n.t('ui.lists.already exists')
          : I18n.t('ui.lists.non-empty name');
      setDisabledReasonText(text);
    } else {
      setDisabledReasonText(null);
    }
  }, [actionEnabled, name]);

  const acceptButtons = (
    <Button
      style={{ marginRight: 10, marginBottom: 10 }}
      primary
      onPress={() => runActionOnList()}
      disabled={!actionEnabled}>
      <Text>
        {action === 'create' ? I18n.t('ui.create') : I18n.t('ui.rename')}
      </Text>
    </Button>
  );

  const title =
    action == 'create'
      ? `${I18n.t('ui.lists.create')} (${getFriendlyTextForListType(type)})`
      : `${I18n.t('ui.lists.rename')} (${list.name})`;

  return (
    <BaseModal acceptButtons={acceptButtons} title={title}>
      <View style={{ padding: 10 }}>
        <Item
          style={{ marginBottom: 20 }}
          error={!actionEnabled}
          success={actionEnabled}>
          <Input
            autoFocus
            onChangeText={setName}
            value={name}
            clearButtonMode="always"
            autoCorrect={false}
          />
        </Item>
        <Text danger note>
          {disabledReasonText}
        </Text>
      </View>
    </BaseModal>
  );
};

export default ListNameDialog;
