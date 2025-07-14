import React from 'react'
import { useConversations } from '../ConversationContext'

export default function DeleteConversationBtn({ convId }) {
  const { deleteConversation } = useConversations()
  return (
    <button
      className="delete-btn"
      onClick={(e) => { e.stopPropagation(); deleteConversation(convId) }}
    >
      🗑
    </button>
  )
}
