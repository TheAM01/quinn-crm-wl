"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, Clock, ImageIcon, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import PageLoader from "@/components/ui/PageLoader";

interface FollowUp {
    message: string;
    delayHours: number;
    delayDisplay: string;
    image: File | null;
    imagePreview: string;
    message_id?: number;
}

type DelayUnit = 'hours' | 'minutes';

export default function CampaignFollowUps({ campaignId }: { campaignId: string }) {
    const router = useRouter();
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [message, setMessage] = useState<string>('');
    const [delayValue, setDelayValue] = useState<number>(1);
    const [delayUnit, setDelayUnit] = useState<DelayUnit>('hours');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);

    useEffect(() => {
        if (campaignId) {
            fetchFollowUps();
        }
    }, [campaignId]);

    const fetchFollowUps = async (): Promise<void> => {
        try {
            const response = await fetch(`/api/campaigns/${campaignId}/follow-ups`);
            if (response.ok) {
                const data = await response.json();
                setFollowUps(data.followUps || []);
            }
        } catch (error) {
            console.error('Error fetching follow-ups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result;
                if (typeof result === 'string') {
                    setImagePreview(result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const convertToHours = (value: number, unit: DelayUnit): number => {
        return unit === 'minutes' ? value / 60 : value;
    };

    const getTotalHours = (): number => {
        return followUps.reduce((sum, fu) => sum + fu.delayHours, 0);
    };

    const getMaxDelayHours = (): number => {
        if (followUps.length === 0) return 0;
        return Math.max(...followUps.map(fu => fu.delayHours));
    };

    const hasDuplicateDelays = (): boolean => {
        const delays = followUps.map(fu => fu.delayHours);
        return delays.some((delay, index) => delays.indexOf(delay) !== index);
    };

    const addOrUpdateFollowUp = (): void => {
        if (!message.trim()) {
            alert('Message is required');
            return;
        }

        const delayHours = convertToHours(delayValue, delayUnit);

        // Check if this individual delay exceeds 23 hours
        if (delayHours > 23) {
            alert('Individual follow-up delay cannot exceed 23 hours');
            return;
        }

        const newFollowUp: FollowUp = {
            message: message.trim(),
            delayHours,
            delayDisplay: `${delayValue} ${delayUnit}`,
            image,
            imagePreview,
        };

        if (editingIndex !== null) {
            const updated = [...followUps];
            // Preserve message_id if it exists
            if (updated[editingIndex].message_id) {
                newFollowUp.message_id = updated[editingIndex].message_id;
            }
            updated[editingIndex] = newFollowUp;
            setFollowUps(updated.sort((a, b) => a.delayHours - b.delayHours));
            setEditingIndex(null);
        } else {
            if (followUps.length >= 5) {
                alert('Maximum 5 follow-ups allowed');
                return;
            }
            setFollowUps([...followUps, newFollowUp].sort((a, b) => a.delayHours - b.delayHours));
        }

        // Reset form
        setMessage('');
        setDelayValue(1);
        setDelayUnit('hours');
        setImage(null);
        setImagePreview('');
    };

    const editFollowUp = (index: number): void => {
        const fu = followUps[index];
        setMessage(fu.message);
        setImage(fu.image);
        setImagePreview(fu.imagePreview);

        // Parse delay back
        const parts = fu.delayDisplay.split(' ');
        const value = parts[0];
        const unit = parts[1] as DelayUnit;
        setDelayValue(Number(value));
        setDelayUnit(unit);
        setEditingIndex(index);
    };

    const deleteFollowUp = (index: number): void => {
        setFollowUps(followUps.filter((_, i) => i !== index));
    };

    const saveAllFollowUps = async (): Promise<void> => {
        if (followUps.length === 0) {
            alert('Add at least one follow-up');
            return;
        }

        const maxDelay = getMaxDelayHours();
        if (maxDelay > 23) {
            return; // Button should be disabled anyway
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('campaign_id', String(campaignId));

            followUps.forEach((fu, index) => {
                formData.append(`followUps[${index}][message]`, fu.message);
                formData.append(`followUps[${index}][delayHours]`, String(fu.delayHours));
                if (fu.image) {
                    formData.append(`followUps[${index}][image]`, fu.image);
                }
                if (fu.message_id) {
                    formData.append(`followUps[${index}][message_id]`, String(fu.message_id));
                }
            });

            const response = await fetch(`/api/campaigns/${campaignId}/follow-ups`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                alert('Follow-ups saved successfully!');
                router.push('/campaigns');
            } else {
                const error = await response.json();
                alert(`Error: ${error.message || 'Failed to save'}`);
            }
        } catch (error) {
            console.error('Error saving follow-ups:', error);
            alert('Failed to save follow-ups');
        } finally {
            setSaving(false);
        }
    };

    const totalHours = getTotalHours();
    const maxDelayHours = getMaxDelayHours();
    const isOverLimit = maxDelayHours > 23;
    const hasDuplicates = hasDuplicateDelays();

    if (loading) {
        return <PageLoader text={`Loading follow ups for campaign ${campaignId}...`}/>
    }

    return (
        <div className="flex flex-col flex-1 p-3 bg-gray-50">
            <div className="flex flex-col flex-1">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Campaign Follow-ups</h1>
                    <p className="text-gray-600 text-sm mb-4">
                        Create automated follow-up messages that send after your initial campaign.
                    </p>

                    {/* Instructions */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Instructions
                        </h3>
                        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                            <li>You can add up to 5 follow-up messages</li>
                            <li>All delays are measured from the original campaign message</li>
                            <li>Each individual follow-up delay cannot exceed 23 hours</li>
                            <li>Message text is required, images are optional</li>
                            <li>Follow-ups are displayed in chronological order</li>
                        </ul>
                    </div>
                </div>

                {/* Existing Follow-ups */}
                {followUps.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Your Follow-ups ({followUps.length}/5)
                            </h2>
                            <div className="flex flex-col items-end gap-1">
                                <div className="text-sm">
                                    <span className="text-gray-600">Max delay: </span>
                                    <span className={`font-semibold ${isOverLimit ? 'text-red-600' : maxDelayHours > 20 ? 'text-yellow-600' : 'text-green-600'}`}>
                                        {maxDelayHours.toFixed(2)} / 23 hours
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                    Total delay: {totalHours.toFixed(2)} hours
                                </div>
                            </div>
                        </div>

                        {/* Warnings */}
                        {isOverLimit && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-red-800">
                                    <strong>Maximum delay exceeded.</strong> One or more follow-ups have a delay greater than 23 hours. Please adjust before saving.
                                </div>
                            </div>
                        )}

                        {hasDuplicates && (
                            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4 flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-yellow-800">
                                    <strong>Warning:</strong> Multiple follow-ups have the same delay time.
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {followUps.map((fu, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-yellow-400 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock className="w-4 h-4 text-yellow-600" />
                                                <span className="text-sm font-semibold text-gray-900">
                                                    Delay: {fu.delayDisplay} ({fu.delayHours.toFixed(2)}h from original)
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{fu.message}</p>
                                            {fu.imagePreview && (
                                                <img src={fu.imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded border border-gray-200" />
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => editFollowUp(index)}
                                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                                                title="Edit follow-up"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteFollowUp(index)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Delete follow-up"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Add/Edit Follow-up Form */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        {editingIndex !== null ? 'Edit Follow-up' : 'Add Follow-up'}
                    </h2>

                    {/* Message */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Message <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter your follow-up message..."
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        />
                    </div>

                    {/* Delay */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Delay from original message <span className="text-xs text-gray-500">(max 23 hours)</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={delayValue}
                                onChange={(e) => setDelayValue(Number(e.target.value))}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            />
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setDelayUnit('hours')}
                                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${delayUnit === 'hours' ? 'bg-yellow-500 text-white' : 'text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Hours
                                </button>
                                <button
                                    onClick={() => setDelayUnit('minutes')}
                                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${delayUnit === 'minutes' ? 'bg-yellow-500 text-white' : 'text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Minutes
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Image (Optional)
                        </label>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
                                <ImageIcon className="w-5 h-5" />
                                <span className="text-sm font-medium">Choose Image</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                            {imagePreview && (
                                <div className="relative">
                                    <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded border border-gray-200" />
                                    <button
                                        onClick={() => {
                                            setImage(null);
                                            setImagePreview('');
                                        }}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={addOrUpdateFollowUp}
                        disabled={followUps.length >= 5 && editingIndex === null}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        {editingIndex !== null ? 'Update Follow-up' : 'Add Follow-up'}
                    </button>
                </div>

                {/* Save All Button */}
                <div className="flex gap-4">
                    <button
                        onClick={() => router.push('/campaigns')}
                        className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={saveAllFollowUps}
                        disabled={followUps.length === 0 || isOverLimit || saving}
                        className="flex-1 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {saving ? 'Saving...' : 'Save All Follow-ups'}
                    </button>
                </div>
            </div>
        </div>
    );
}