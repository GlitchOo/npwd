import { useNuiEvent } from 'fivem-nui-react-lib';
import {
  MakeGroupOwner,
  Message,
  MessageConversation,
  MessageEvents,
  RemoveGroupMemberResponse,
  AddGroupMemberResponse,
} from '@typings/messages';
import { useMessageActions } from './useMessageActions';
import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { messageState, useActiveMessageConversation } from './state';
import { usePhoneVisibility } from '@os/phone/hooks';
import { useNotification } from '@os/new-notifications/useNotification';
import { useContactActions } from '@apps/contacts/hooks/useContactActions';
import useMessages from './useMessages';
import { useRecoilValue } from 'recoil';

export const useMessagesService = () => {
  const {
    updateLocalMessages,
    updateLocalConversations,
    setMessageReadState,
    removeLocalConversation,
    removeLocalGroupMember,
    updateLocalGroupOwner,
    addLocalConversationParticipants,
  } = useMessageActions();
  const { setNotification } = useMessageNotifications();
  const { pathname } = useLocation();
  const activeConversation = useActiveMessageConversation();
  const { visibility } = usePhoneVisibility();
  const { enqueueNotification } = useNotification();
  const { getDisplayByNumber } = useContactActions();
  const { getMessageConversationById, goToConversation } = useMessages();
  const activeMessageConversation = useRecoilValue(messageState.activeMessageConversation);

  const addNotification = useCallback(
    (message: string, convoName: string, convoId: number) => {
      const group = getMessageConversationById(convoId);

      enqueueNotification({
        appId: 'MESSAGES',
        notisId: 'npwd:messages:messageBroadcast',
        content: message,
        onClick: () => goToConversation(group),
        secondaryTitle: getDisplayByNumber(convoName) ?? convoName,
        path: `/messages/conversations/${activeMessageConversation.id}`,
      });
    },
    [enqueueNotification],
  );

  const handleMessageBroadcast = ({ conversationName, conversation_id, message }) => {
    if (visibility && pathname.includes(`/messages/conversations/${conversation_id}`)) {
      return;
    }

    setMessageReadState(conversation_id, 1);
    // Set the current unread count to 1, when they click it will be removed
    //
    addNotification(message, conversationName, conversation_id);
  };

  // This is only called for the receiver of the message. We'll be using the standardized pattern for the transmitter.
  const handleUpdateMessages = useCallback(
    (messageDto: Message) => {
      if (messageDto.conversation_id !== activeConversation.id) return;

      updateLocalMessages(messageDto);
    },
    [updateLocalMessages, activeConversation],
  );

  const handleAddConversation = useCallback(
    (conversation: MessageConversation) => {
      updateLocalConversations({
        participant: conversation.participant,
        isGroupChat: conversation.isGroupChat,
        id: conversation.id,
        conversationList: conversation.conversationList,
        label: conversation.label,
        unread: 0,
        owner: conversation.owner,
      });
    },
    [updateLocalConversations],
  );

  const handleDeleteConversation = useCallback(
    (conversationsId: number[]) => {
      removeLocalConversation(conversationsId);
    },
    [removeLocalConversation],
  );

  const handleRemoveGroupMember = useCallback(
    (conversation: RemoveGroupMemberResponse) => {
      removeLocalGroupMember(conversation.conversationId, conversation.phoneNumber);
    },
    [removeLocalGroupMember],
  );

  const updateGroupOwner = useCallback(
    (conversation: MakeGroupOwner) => {
      updateLocalGroupOwner(conversation.conversationId, conversation.phoneNumber);
    },
    [updateLocalGroupOwner],
  );

  const updateParticipantList = useCallback(
    (conversation: AddGroupMemberResponse) => {
      addLocalConversationParticipants(conversation.conversationId, conversation.conversationList);
    },
    [addLocalConversationParticipants],
  );

  useNuiEvent('MESSAGES', MessageEvents.CREATE_MESSAGE_BROADCAST, handleMessageBroadcast);
  useNuiEvent('MESSAGES', MessageEvents.SEND_MESSAGE_SUCCESS, handleUpdateMessages);
  useNuiEvent('MESSAGES', MessageEvents.CREATE_MESSAGE_CONVERSATION_SUCCESS, handleAddConversation);
  useNuiEvent('MESSAGES', MessageEvents.DELETE_GROUP_MEMBER_CONVERSATION, handleDeleteConversation);
  useNuiEvent('MESSAGES', MessageEvents.DELETE_GROUP_MEMBER_LIST, handleRemoveGroupMember);
  useNuiEvent('MESSAGES', MessageEvents.UPDATE_GROUP_OWNER, updateGroupOwner);
  useNuiEvent('MESSAGES', MessageEvents.UPDATE_PARTICIPANT_LIST, updateParticipantList);
};
