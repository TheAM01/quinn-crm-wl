"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, Edit2, Trash2, Save, X, AlertCircle, MessageSquare } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Toast from '@/components/ui/Toast';

interface QuickMessage {
    message_id: number;
    email: string;
    message: string;
    display_order: number;
}

interface QuickMessagesPreferencesProps {
    isSuperAdmin: boolean;
}

export default function QuickMessagesPreferences({ isSuperAdmin }: QuickMessagesPreferencesProps) {
    const [scope, setScope] = useState<'global' | 'self'>('self');
    const [messages, setMessages] = useState<QuickMessage[]>([]);
    const [allMessages, setAllMessages] = useState<QuickMessage[]>([]); // Store all messages for accurate counting
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
    };

    const hideToast = () => {
        setToast(null);
    };

    const fetchMessages = async () => {
        setLoading(true);
        try {
            // Fetch both self and global messages to maintain accurate counts
            const [selfResponse, globalResponse] = await Promise.all([
                fetch('/api/quick-messages?scope=self'),
                isSuperAdmin ? fetch('/api/quick-messages?scope=global') : Promise.resolve(null)
            ]);

            if (!selfResponse.ok) throw new Error('Failed to fetch messages');

            const selfData = await selfResponse.json();
            const globalData = globalResponse?.ok ? await globalResponse.json() : { messages: [] };

            // Combine all messages for counting
            const combined = [...(selfData.messages || []), ...(globalData.messages || [])];
            setAllMessages(combined);

            // Set the current scope's messages
            const currentScopeData = scope === 'self' ? selfData : globalData;
            setMessages(currentScopeData.messages || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
            showToast('Failed to load quick messages', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, [scope, isSuperAdmin]);

    const getSelfCount = () => allMessages.filter(m => m.email !== 'global').length;
    const getGlobalCount = () => allMessages.filter(m => m.email === 'global').length;

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(messages);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedItems = items.map((item, index) => ({
            ...item,
            display_order: index + 1,
        }));

        setMessages(updatedItems);

        try {
            const response = await fetch('/api/quick-messages/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedItems.map(item => ({
                        message_id: item.message_id,
                        display_order: item.display_order,
                    })),
                }),
            });

            if (!response.ok) throw new Error('Failed to reorder messages');
            showToast('Order updated successfully');
        } catch (error) {
            console.error('Error reordering messages:', error);
            showToast('Failed to update order', 'error');
            fetchMessages();
        }
    };

    const handleAdd = async () => {
        if (!newMessage.trim()) return;

        const limit = scope === 'global' ? 50 : 20;
        if (messages.length >= limit) {
            showToast(`Maximum ${limit} messages allowed for ${scope} messages`, 'error');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch('/api/quick-messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: newMessage, scope }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add message');
            }

            showToast('Message added successfully');
            setNewMessage('');
            setIsAddingNew(false);
            fetchMessages();
        } catch (error) {
            console.error('Error adding message:', error);
            showToast(error instanceof Error ? error.message : 'Failed to add message', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async (id: number) => {
        if (!editValue.trim()) return;

        setSaving(true);
        try {
            const response = await fetch(`/api/quick-messages/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: editValue }),
            });

            if (!response.ok) throw new Error('Failed to update message');

            showToast('Message updated successfully');
            setEditingId(null);
            setEditValue('');
            fetchMessages();
        } catch (error) {
            console.error('Error updating message:', error);
            showToast('Failed to update message', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this quick message?')) return;

        setSaving(true);
        try {
            const response = await fetch(`/api/quick-messages/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete message');

            showToast('Message deleted successfully');
            void fetchMessages();
        } catch (error) {
            console.error('Error deleting message:', error);
            showToast('Failed to delete message', 'error');
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (message: QuickMessage) => {
        setEditingId(message.message_id);
        setEditValue(message.message);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValue('');
    };

    const currentLimit = scope === 'global' ? 50 : 20;

    return (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">Quick Messages</h3>
                    <p className="text-sm text-gray-600">Create reusable message templates with variable support</p>
                </div>

                {isSuperAdmin && (
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setScope('self')}
                            className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                scope === 'self'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Self ({getSelfCount()}/20)
                        </button>
                        <button
                            onClick={() => setScope('global')}
                            className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                scope === 'global'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Global ({getGlobalCount()}/50)
                        </button>
                    </div>
                )}
            </div>

            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
                <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Template Variables:</p>
                    <p>Use <code className="bg-yellow-100 px-1 py-0.5 rounded">{'{{repName}}'}</code> in your messages, and it will be automatically replaced with your name.</p>
                    {isSuperAdmin && scope === 'global' && (
                        <p className="mt-1 text-xs">You&apos;re editing <strong>global messages</strong> visible to all users.</p>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <Spinner />
                </div>
            ) : (
                <>
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="quick-messages">
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`space-y-2 min-h-[100px] ${
                                        snapshot.isDraggingOver ? 'bg-yellow-50' : ''
                                    } transition-colors rounded-lg p-2`}
                                >
                                    {messages.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            No quick messages yet. Add your first one below!
                                        </div>
                                    ) : (
                                        messages.map((message, index) => (
                                            <Draggable
                                                key={message.message_id}
                                                draggableId={String(message.message_id)}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`bg-white border rounded-lg p-4 ${
                                                            snapshot.isDragging
                                                                ? 'shadow-lg border-yellow-300'
                                                                : 'border-gray-200'
                                                        } transition-shadow`}
                                                    >
                                                        {editingId === message.message_id ? (
                                                            <div className="flex gap-2">
                                                                <textarea
                                                                    value={editValue}
                                                                    onChange={(e) => setEditValue(e.target.value)}
                                                                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                                                                    rows={3}
                                                                    disabled={saving}
                                                                />
                                                                <div className="flex flex-col gap-2">
                                                                    <button
                                                                        onClick={() => handleEdit(message.message_id)}
                                                                        disabled={saving}
                                                                        className="cursor-pointer p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                                                                        title="Save"
                                                                    >
                                                                        {saving ? <Spinner /> : <Save size={18} />}
                                                                    </button>
                                                                    <button
                                                                        onClick={cancelEdit}
                                                                        disabled={saving}
                                                                        className="cursor-pointer p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                                                                        title="Cancel"
                                                                    >
                                                                        <X size={18} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-start gap-3">
                                                                <div
                                                                    {...provided.dragHandleProps}
                                                                    className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                                                                >
                                                                    <GripVertical size={20} />
                                                                </div>
                                                                <p className="flex-1 text-gray-700 whitespace-pre-wrap break-words py-0.5">
                                                                    {message.message}
                                                                </p>
                                                                <div className="flex gap-2 flex-shrink-0">
                                                                    <button
                                                                        onClick={() => startEdit(message)}
                                                                        className="cursor-pointer p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit2 size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(message.message_id)}
                                                                        className="cursor-pointer p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))
                                    )}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>

                    {isAddingNew ? (
                        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Enter your quick message..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                                rows={3}
                                disabled={saving}
                            />
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={handleAdd}
                                    disabled={saving || !newMessage.trim()}
                                    className="cursor-pointer px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {saving ? <Spinner /> : <Save size={18} />}
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAddingNew(false);
                                        setNewMessage('');
                                    }}
                                    disabled={saving}
                                    className="cursor-pointer px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAddingNew(true)}
                            disabled={messages.length >= currentLimit}
                            className="cursor-pointer mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-yellow-400 hover:text-yellow-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={20} />
                            Add New Quick Message {messages.length >= currentLimit && `(Limit: ${currentLimit})`}
                        </button>
                    )}
                </>
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    show={!!toast}
                    onClose={hideToast}
                    duration={3000}
                />
            )}
        </div>
    );
}