'use client';

import { useState, useEffect } from 'react';
import { FiMail, FiPhone, FiUser, FiCalendar, FiEye, FiTrash2, FiSend } from 'react-icons/fi';

interface Message {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  propertyId: string;
  status: 'NEW' | 'READ' | 'REPLIED';
  createdAt: string;
  updatedAt: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'READ' | 'REPLIED'>('ALL');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'READ' }),
      });

      if (response.ok) {
        setMessages(messages.map(msg => 
          msg.id === messageId ? { ...msg, status: 'READ' as const } : msg
        ));
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessages(messages.filter(msg => msg.id !== messageId));
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const sendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    try {
      const response = await fetch('/api/messages/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          reply: replyText,
          recipientEmail: selectedMessage.email,
        }),
      });

      if (response.ok) {
        setMessages(messages.map(msg => 
          msg.id === selectedMessage.id ? { ...msg, status: 'REPLIED' as const } : msg
        ));
        setReplyText('');
        alert('Reply sent successfully!');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Error sending reply');
    }
  };

  const filteredMessages = messages.filter(msg => 
    filter === 'ALL' || msg.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-red-100 text-red-800';
      case 'READ': return 'bg-blue-100 text-blue-800';
      case 'REPLIED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#468AD1]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <div className="flex space-x-2">
          {['ALL', 'NEW', 'READ', 'REPLIED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as 'ALL' | 'NEW' | 'READ' | 'REPLIED')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filter === status
                  ? 'bg-[#468AD1] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No messages found
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow ${
                  selectedMessage?.id === message.id ? 'ring-2 ring-[#468AD1]' : ''
                }`}
                onClick={() => {
                  setSelectedMessage(message);
                  if (message.status === 'NEW') {
                    markAsRead(message.id);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <FiUser className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">{message.fullName}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                        {message.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center space-x-1">
                        <FiMail className="w-4 h-4" />
                        <span>{message.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiPhone className="w-4 h-4" />
                        <span>{message.phone}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 line-clamp-2">{message.message}</p>
                    <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
                      <FiCalendar className="w-3 h-3" />
                      <span>{new Date(message.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Detail */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {selectedMessage ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Message Details</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => markAsRead(selectedMessage.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Mark as Read"
                  >
                    <FiEye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">From:</label>
                  <p className="text-gray-900">{selectedMessage.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email:</label>
                  <p className="text-gray-900">{selectedMessage.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone:</label>
                  <p className="text-gray-900">{selectedMessage.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Property ID:</label>
                  <p className="text-gray-900">{selectedMessage.propertyId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Message:</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedMessage.message}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date:</label>
                  <p className="text-gray-900">{new Date(selectedMessage.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Reply Section */}
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Reply:</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#468AD1] focus:border-transparent"
                  rows={4}
                />
                <button
                  onClick={sendReply}
                  disabled={!replyText.trim()}
                  className="mt-2 flex items-center space-x-2 px-4 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSend className="w-4 h-4" />
                  <span>Send Reply</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Select a message to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}