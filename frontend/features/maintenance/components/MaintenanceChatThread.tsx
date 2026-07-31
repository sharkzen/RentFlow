"use client";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Check, Loader2, MessageSquare, Pencil, Send, X } from "lucide-react";

interface ChatMessage {
  id: string;
  senderRole: "OWNER" | "TENANT";
  message: string;
  createdAt: string;
  editedAt?: string | null;
}

interface MaintenanceChatThreadProps {
  maintenanceId: string;
  currentRole: "OWNER" | "TENANT";
  enabled: boolean;
  readOnly?: boolean;
  getMessages: (id: string) => Promise<ChatMessage[]>;
  sendMessage: (id: string, message: string) => Promise<unknown>;
  editMessage?: (
    id: string,
    messageId: string,
    message: string,
  ) => Promise<unknown>;
}

const POLL_INTERVAL_MS = 15000;

export default function MaintenanceChatThread({
  maintenanceId,
  currentRole,
  enabled,
  readOnly = false,
  getMessages,
  sendMessage,
  editMessage,
}: MaintenanceChatThreadProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const data = await getMessages(maintenanceId);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load maintenance messages:", err);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    setIsLoading(true);
    fetchMessages().finally(() => setIsLoading(false));

    const interval = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, maintenanceId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);

    try {
      await sendMessage(maintenanceId, trimmed);
      setDraft("");
      await fetchMessages();
    } catch (err) {
      console.error("Failed to send maintenance message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startEdit = (msg: ChatMessage) => {
    setEditingId(msg.id);
    setEditDraft(msg.message);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft("");
  };

  const saveEdit = async (messageId: string) => {
    const trimmed = editDraft.trim();
    if (!trimmed || !editMessage || isSavingEdit) return;

    setIsSavingEdit(true);

    try {
      await editMessage(maintenanceId, messageId, trimmed);
      setEditingId(null);
      setEditDraft("");
      await fetchMessages();
    } catch (err) {
      console.error("Failed to edit maintenance message:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleEditKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    messageId: string,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit(messageId);
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  return (
    <div>
      <div className="text-foreground mb-4 flex items-center gap-2 text-base font-semibold">
        <MessageSquare size={20} className="text-indigo-600" />
        แชทติดต่อ
      </div>

      {!enabled ? (
        <div className="border-border bg-background/50 text-muted flex h-24 flex-col items-center justify-center rounded-xl border-2 border-dashed text-center text-sm">
          แชทจะเปิดใช้งานเมื่อรับเรื่องแจ้งซ่อมแล้ว
        </div>
      ) : (
        <div className="border-border bg-background/50 flex flex-col overflow-hidden rounded-xl border">
          <div
            ref={scrollRef}
            className="custom-scrollbar flex max-h-80 min-h-32 flex-col gap-3 overflow-y-auto p-4"
          >
            {isLoading ? (
              <div className="text-muted flex flex-1 items-center justify-center py-6">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-muted flex flex-1 items-center justify-center py-6 text-sm">
                ยังไม่มีข้อความ เริ่มการสนทนาได้เลย
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.senderRole === currentRole;
                const isEditing = editingId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`group flex items-start gap-1.5 ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    {isOwn && !isEditing && !readOnly && editMessage && (
                      <button
                        onClick={() => startEdit(msg)}
                        className="text-muted hover:bg-background hover:text-foreground mt-1 cursor-pointer rounded-full p-1.5 opacity-60 transition-all pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100"
                        title="แก้ไขข้อความ"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        isOwn
                          ? "bg-indigo-600 text-white"
                          : "bg-surface text-foreground border-border border"
                      } ${isEditing ? "w-full max-w-[85%]" : ""}`}
                    >
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            autoFocus
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(e, msg.id)}
                            rows={2}
                            className="w-full resize-none rounded-lg border border-white/30 bg-white/10 px-2 py-1.5 text-sm text-white outline-none placeholder:text-white/60"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={cancelEdit}
                              disabled={isSavingEdit}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-white/20"
                            >
                              <X size={12} /> ยกเลิก
                            </button>
                            <button
                              onClick={() => saveEdit(msg.id)}
                              disabled={isSavingEdit || !editDraft.trim()}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 disabled:opacity-50"
                            >
                              {isSavingEdit ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Check size={12} />
                              )}
                              บันทึก
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="leading-relaxed whitespace-pre-line">
                            {msg.message}
                          </p>
                          <p
                            className={`mt-1 text-[11px] ${
                              isOwn ? "text-indigo-100" : "text-muted"
                            }`}
                          >
                            {format(new Date(msg.createdAt), "d MMM HH:mm", {
                              locale: th,
                            })}
                            {msg.editedAt && " (แก้ไขแล้ว)"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {readOnly ? (
            <div className="border-border bg-surface text-muted border-t px-4 py-3 text-center text-xs">
              งานซ่อมนี้เสร็จสิ้นแล้ว ไม่สามารถส่งข้อความเพิ่มเติมได้
            </div>
          ) : (
            <div className="border-border bg-surface flex items-end gap-2 border-t p-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                rows={1}
                placeholder="พิมพ์ข้อความ..."
                className="border-border bg-background text-foreground max-h-24 flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSend}
                disabled={isSending || !draft.trim()}
                className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-indigo-600 p-2.5 text-white transition-all hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
