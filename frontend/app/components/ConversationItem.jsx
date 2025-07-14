import React from 'react'
import { useConversations } from '../ConversationContext'
import DeleteConversationBtn from './DeleteConversationBtn'

export default function ConversationItem({ conv }) {
  const { activeId, selectConversation } = useConversations()
  const isActive = conv.id === activeId

  return (
    <li
      onClick={() => selectConversation(conv.id)}
      className={isActive ? 'active' : ''}
    >
      <div className="title">{conv.title || 'New chat'}</div>
      <div className="lang-tag">{conv.targetLanguage}</div>
      <DeleteConversationBtn convId={conv.id} />
    </li>
  )
}
