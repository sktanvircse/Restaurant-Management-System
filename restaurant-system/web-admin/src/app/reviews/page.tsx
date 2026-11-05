'use client';

import { useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Star, MessageSquare, Reply } from 'lucide-react';

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const res = await api.get('/reviews');
      return res.data.data;
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      await api.post(`/reviews/${id}/respond`, { response });
    },
    onSuccess: () => {
      setReplyingId(null);
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Reviews & Ratings</h1>
            <p className="text-sm text-gray-500">Monitor feedback, overall customer satisfaction, and reply to reviews</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading reviews...</div>
        ) : (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border text-center text-gray-400">No reviews found yet</div>
            ) : (
              reviews.map((r: any) => (
                <div key={r.id} className="bg-white border rounded-xl p-5 space-y-3 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{r.customer?.user?.fullName || 'Anonymous Customer'}</span>
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Order #{r.order?.orderNumber} • {new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{r.comment}</p>
                  )}
                  {r.response && (
                    <div className="pl-4 border-l-2 border-indigo-500 text-xs text-gray-600 space-y-1">
                      <div className="font-semibold text-indigo-700 flex items-center gap-1">
                        <Reply className="w-3.5 h-3.5" /> Restaurant Management Response:
                      </div>
                      <p>{r.response}</p>
                    </div>
                  )}
                  {!r.response && replyingId !== r.id && (
                    <button
                      onClick={() => {
                        setReplyingId(r.id);
                        setReplyText('');
                      }}
                      className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" /> Reply to customer
                    </button>
                  )}
                  {replyingId === r.id && (
                    <div className="space-y-2 pt-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type response to customer..."
                        className="w-full border rounded-lg p-2 text-xs"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => replyMutation.mutate({ id: r.id, response: replyText })}
                          className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700"
                        >
                          Send Response
                        </button>
                        <button
                          onClick={() => setReplyingId(null)}
                          className="px-3 py-1 border rounded text-xs text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
