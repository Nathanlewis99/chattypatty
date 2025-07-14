import React from 'react'
import ConversationItem from './ConversationItem'
import { useConversations } from '../ConversationContext'

export default function ConversationList() {
  const { conversations } = useConversations()
  if (conversations.length === 0) {
    return <div className="text-gray-500">No conversations yet</div>
  }
  return (
    <ul className="space-y-2">
      {conversations.map((conv) => (
        <ConversationItem key={conv.id} conv={conv} />
      ))}
    </ul>
  )
}
