"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Send, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, FileText, Check, ImageIcon, Variable } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { blastSchema, type BlastInput } from "@/lib/validations/blast";
import { createBlast } from "@/lib/actions/blasts";
import { getContacts, getContactGroups, getGroupContacts } from "@/lib/actions/contacts";
import { getTemplates } from "@/lib/actions/templates";

interface Template {
  id: string;
  name: string;
  body: string;
  footer: string | null;
  imageUrl: string | null;
}

const steps = [
  { id: 1, title: "Pilih Template" },
  { id: 2, title: "Pilih Target" },
  { id: 3, title: "Atur Jadwal" },
  { id: 4, title: "Review & Konfirmasi" },
];

export function BlastWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetType, setTargetType] = useState<"contacts" | "groups">("contacts");
  const [contacts, setContacts] = useState<{ id: string; name: string; phoneNumber: string }[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string; _count: { members: number } }[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [groupContacts, setGroupContacts] = useState<Record<string, { id: string; name: string; phoneNumber: string }[]>>({});
  const [loadingGroup, setLoadingGroup] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<BlastInput>({
    resolver: zodResolver(blastSchema),
    defaultValues: {
      title: "",
      messageTemplate: "",
      footer: "",
      imageUrl: "",
      delaySec: 3,
      targetType: "contacts",
      targetIds: [],
      scheduleType: dateParam ? "scheduled" : "now",
      scheduledAt: dateParam ? `${dateParam}T09:00` : "",
    },
  });

  const title = watch("title");
  const messageTemplate = watch("messageTemplate");
  const footer = watch("footer");
  const imageUrl = watch("imageUrl");
  const scheduleType = watch("scheduleType");
  const scheduledAt = watch("scheduledAt");
  const delaySec = watch("delaySec");

  useEffect(() => {
    async function load() {
      const [contactsRes, groupsRes, templatesRes] = await Promise.all([
        getContacts(1, "", 1000),
        getContactGroups(),
        getTemplates(),
      ]);
      setContacts(contactsRes.data as any[]);
      setGroups(groupsRes as any[]);
      setTemplates(templatesRes as unknown as Template[]);
    }
    load();
  }, []);

  // Sync selectedIds with react-hook-form
  useEffect(() => {
    setValue("targetIds", selectedIds);
  }, [selectedIds, setValue]);

  // Always send contact IDs to the server
  useEffect(() => {
    setValue("targetType", "contacts");
  }, [setValue]);

  function selectTemplate(t: Template) {
    setSelectedTemplateId(t.id);
    setValue("messageTemplate", t.body, { shouldValidate: true });
    setValue("footer", t.footer || "", { shouldValidate: true });
    setValue("imageUrl", t.imageUrl || "", { shouldValidate: true });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAll() {
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contacts.map((x) => x.id));
    }
  }

  async function onFormSubmit(data: BlastInput) {
    if (data.targetIds.length === 0) {
      toast.error("Pilih minimal 1 target");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("messageTemplate", data.messageTemplate);
      formData.append("footer", data.footer || "");
      formData.append("imageUrl", data.imageUrl || "");
      formData.append("delaySec", String(data.delaySec));
      formData.append("targetType", data.targetType);
      formData.append("targetIds", JSON.stringify(data.targetIds));
      formData.append("scheduleType", data.scheduleType);
      if (data.scheduleType === "scheduled" && data.scheduledAt) {
        formData.append("scheduledAt", new Date(data.scheduledAt).toISOString());
      }

      const result = await createBlast(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Blast berhasil dibuat!");
      router.push("/dashboard/blast");
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  }

  const onFormError = () => {
    const errs = Object.entries(errors).map(([k, v]) => `${k}: ${(v as any)?.message}`).join("; ");
    toast.error(`Validasi gagal: ${errs || "Cek kembali isian Anda"}`);
  };

  function canProceed(): boolean {
    if (step === 1) return !!title && !!messageTemplate;
    if (step === 2) return selectedIds.length > 0;
    if (step === 3) {
      if (scheduleType === "scheduled") return !!scheduledAt;
      return true;
    }
    return true;
  }

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phoneNumber.includes(searchTerm)
  );

  return (
    <div className="mx-auto max-w-3xl">
      {/* Steps indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  s.id === step
                    ? "bg-whatsapp text-white"
                    : s.id < step
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-800 text-slate-500"
                }`}
              >
                {s.id < step ? "✓" : s.id}
              </div>
              <span
                className={`ml-2 hidden text-sm sm:block ${
                  s.id === step ? "text-white" : "text-slate-500"
                }`}
              >
                {s.title}
              </span>
              {s.id < steps.length && (
                <div
                  className={`mx-4 h-px w-12 ${
                    s.id < step ? "bg-emerald-500" : "bg-slate-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit, onFormError)}>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          {/* Step 1: Select Template */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white">Pilih Template</h2>
                <p className="text-sm text-slate-400">
                  Pilih template pesan yang sudah dibuat
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Judul Blast</Label>
                <Input
                  id="title"
                  placeholder="Contoh: Info Pendaftaran Mahasiswa Baru"
                  {...register("title")}
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-xs text-red-400">{errors.title.message}</p>
                )}
              </div>

              {templates.length === 0 ? (
                <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-700 py-12">
                  <FileText className="h-10 w-10 text-slate-600" />
                  <p className="mt-3 text-sm text-slate-500">
                    Belum ada template. Buat template dulu di menu Template.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {templates.map((t) => {
                    const isSelected = selectedTemplateId === t.id;
                    const varCount = (t.body.match(/\{\{\w+\}\}/g) || []).length;

                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          selectTemplate(t);
                          if (!getValues("title")) {
                            setValue("title", t.name);
                          }
                        }}
                        className={`relative rounded-lg border p-4 text-left transition-colors ${
                          isSelected
                            ? "border-whatsapp bg-whatsapp/5"
                            : "border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-whatsapp">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <p className="font-medium text-white">{t.name}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                          {t.body}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {varCount > 0 && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                              <Variable className="h-2.5 w-2.5" />
                              {varCount} var
                            </span>
                          )}
                          {t.footer && (
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                              Footer
                            </span>
                          )}
                          {t.imageUrl && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                              <ImageIcon className="h-2.5 w-2.5" />
                              Gambar
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedTemplateId && (
                <div className="rounded-lg border border-slate-800 p-4 space-y-4">
                  <div>
                    <Label>Pesan (bisa diedit)</Label>
                    <Textarea
                      rows={4}
                      value={messageTemplate}
                      onChange={(e) => setValue("messageTemplate", e.target.value, { shouldValidate: true })}
                      className="mt-1"
                    />
                    {errors.messageTemplate && (
                      <p className="text-xs text-red-400 mt-1">{errors.messageTemplate.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Footer (opsional)</Label>
                    <Input
                      value={footer || ""}
                      onChange={(e) => setValue("footer", e.target.value)}
                      placeholder="Contoh: Tim Marketing UPJ"
                      className="mt-1"
                    />
                  </div>
                  {imageUrl && (
                    <div>
                      <Label>Gambar</Label>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="mt-1 h-24 w-24 rounded-lg border border-slate-800 object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Target */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white">Pilih Target</h2>
                <p className="text-sm text-slate-400">
                  Pilih kontak atau grup yang akan dikirimi pesan
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType("contacts");
                    setSelectedIds([]);
                  }}
                  className={`flex-1 rounded-lg border p-3 text-center text-sm font-medium transition-colors ${
                    targetType === "contacts"
                      ? "border-whatsapp bg-whatsapp/10 text-whatsapp"
                      : "border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  Pilih Kontak
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetType("groups");
                    setSelectedIds([]);
                  }}
                  className={`flex-1 rounded-lg border p-3 text-center text-sm font-medium transition-colors ${
                    targetType === "groups"
                      ? "border-whatsapp bg-whatsapp/10 text-whatsapp"
                      : "border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  Pilih Grup
                </button>
              </div>

              {targetType === "contacts" && (
                <>
                  <Input
                    placeholder="Cari kontak..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-2"
                  />
                  <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-slate-800 p-2">
                    <label className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredContacts.length && filteredContacts.length > 0}
                        onChange={selectAll}
                        className="rounded border-slate-600"
                      />
                      <span className="font-medium text-white">Pilih Semua</span>
                      <span className="ml-auto text-xs text-slate-500">
                        {filteredContacts.length} kontak
                      </span>
                    </label>
                    {filteredContacts.map((contact) => (
                      <label
                        key={contact.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-slate-800/50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(contact.id)}
                          onChange={() => toggleSelect(contact.id)}
                          className="rounded border-slate-600"
                        />
                        <span className="text-white">{contact.name}</span>
                        <span className="ml-auto text-slate-500">
                          {contact.phoneNumber}
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {targetType === "groups" && (
                <div className="space-y-2">
                  {groups.map((group) => {
                    const isExpanded = expandedGroup === group.id;
                    const groupContactList = groupContacts[group.id] || [];
                    const allGroupIds = groupContactList.map((c) => c.id);
                    const selectedInGroup = groupContactList.filter((c) => selectedIds.includes(c.id));
                    const groupFullySelected = allGroupIds.length > 0 && allGroupIds.every((id) => selectedIds.includes(id));

                    return (
                      <div key={group.id} className="rounded-lg border border-slate-800 overflow-hidden">
                        <div className="flex items-center gap-2 p-3">
                          <input
                            type="checkbox"
                            checked={allGroupIds.length > 0 && allGroupIds.every((id) => selectedIds.includes(id))}
                            onChange={async () => {
                              if (allGroupIds.length > 0 && allGroupIds.every((id) => selectedIds.includes(id))) {
                                setSelectedIds((prev) => prev.filter((id) => !allGroupIds.includes(id)));
                              } else {
                                if (!groupContacts[group.id]) {
                                  setLoadingGroup(group.id);
                                  const members = await getGroupContacts(group.id);
                                  setGroupContacts((prev) => ({ ...prev, [group.id]: members as any }));
                                  setLoadingGroup(null);
                                  setSelectedIds((prev) => Array.from(new Set([...prev, ...members.map((m: any) => m.id)])));
                                } else {
                                  setSelectedIds((prev) => Array.from(new Set([...prev, ...allGroupIds])));
                                }
                              }
                            }}
                            className="rounded border-slate-600"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (isExpanded) {
                                setExpandedGroup(null);
                              } else {
                                setExpandedGroup(group.id);
                                if (!groupContacts[group.id]) {
                                  setLoadingGroup(group.id);
                                  getGroupContacts(group.id).then((members) => {
                                    setGroupContacts((prev) => ({ ...prev, [group.id]: members as any }));
                                    setLoadingGroup(null);
                                  });
                                }
                              }
                            }}
                            className="flex-1 flex items-center gap-2 text-left"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{group.name}</p>
                              <p className="text-xs text-slate-500">
                                {group._count.members} kontak
                                {selectedInGroup.length > 0 && (
                                  <span className="ml-2 text-whatsapp">({selectedInGroup.length} dipilih)</span>
                                )}
                              </p>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                            )}
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="border-t border-slate-800 p-2">
                            {loadingGroup === group.id ? (
                              <p className="py-4 text-center text-xs text-slate-500">Memuat kontak...</p>
                            ) : groupContactList.length === 0 ? (
                              <p className="py-4 text-center text-xs text-slate-500">Tidak ada kontak dalam grup ini</p>
                            ) : (
                              <div className="max-h-48 space-y-0.5 overflow-y-auto">
                                {groupContactList.map((contact) => (
                                  <label
                                    key={contact.id}
                                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors hover:bg-slate-800/50"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedIds.includes(contact.id)}
                                      onChange={() => toggleSelect(contact.id)}
                                      className="rounded border-slate-600"
                                    />
                                    <span className="text-white">{contact.name}</span>
                                    <span className="ml-auto text-slate-500">{contact.phoneNumber}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {groups.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-8">
                      Belum ada grup. Buat grup di halaman Kontak.
                    </p>
                  )}
                </div>
              )}

              <p className="text-sm text-slate-400">
                Terpilih: <span className="font-medium text-white">{selectedIds.length}</span> kontak
              </p>
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white">Atur Jadwal</h2>
                <p className="text-sm text-slate-400">
                  Tentukan kapan pesan akan dikirim
                </p>
              </div>

              <div className="flex gap-2">
                <label
                  className={`flex-1 cursor-pointer rounded-lg border p-4 text-center transition-colors ${
                    scheduleType === "now"
                      ? "border-whatsapp bg-whatsapp/10"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    {...register("scheduleType")}
                    value="now"
                    className="sr-only"
                  />
                  <p
                    className={`text-sm font-medium ${
                      scheduleType === "now" ? "text-whatsapp" : "text-white"
                    }`}
                  >
                    Kirim Sekarang
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Pesan akan dikirim segera setelah dibuat
                  </p>
                </label>

                <label
                  className={`flex-1 cursor-pointer rounded-lg border p-4 text-center transition-colors ${
                    scheduleType === "scheduled"
                      ? "border-whatsapp bg-whatsapp/10"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    {...register("scheduleType")}
                    value="scheduled"
                    className="sr-only"
                  />
                  <p
                    className={`text-sm font-medium ${
                      scheduleType === "scheduled" ? "text-whatsapp" : "text-white"
                    }`}
                  >
                    Jadwalkan
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Tentukan tanggal & jam pengiriman
                  </p>
                </label>
              </div>

              {scheduleType === "scheduled" && (
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Tanggal & Jam Kirim</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    {...register("scheduledAt")}
                    className={errors.scheduledAt ? "border-red-500" : ""}
                  />
                  {errors.scheduledAt && (
                    <p className="text-xs text-red-400">
                      {errors.scheduledAt.message}
                    </p>
                  )}
                </div>
              )}

              <div className="border-t border-slate-800 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="delaySec">Delay Antar Pesan (detik)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="delaySec"
                      type="range"
                      min={1}
                      max={15}
                      step={1}
                      {...register("delaySec", { valueAsNumber: true })}
                      className="flex-1"
                    />
                    <span className="min-w-[4rem] text-right text-sm font-medium text-white">
                      {delaySec || 3} detik
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Jeda antar pengiriman ke tiap kontak untuk menghindari banned. Rekomendasi: 3-5 detik
                  </p>
                  {errors.delaySec && (
                    <p className="text-xs text-red-400">{errors.delaySec.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Review & Konfirmasi
                </h2>
                <p className="text-sm text-slate-400">
                  Periksa kembali sebelum mengirim
                </p>
              </div>

              {/* WhatsApp Preview */}
              <div className="flex justify-center">
                <div className="w-full max-w-sm rounded-lg bg-[#e5ddd5] p-3 shadow-inner"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4c8b8' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
                >
                  {/* Chat Header */}
                  <div className="mb-1 flex items-center gap-2 px-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                      B
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1f2c33]">Blast: {title}</p>
                      <p className="text-[10px] text-[#667781]">Kepada {selectedIds.length} kontak</p>
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className="flex flex-col items-end">
                    <div className="relative max-w-[85%] rounded-lg bg-white px-3 py-2 shadow-sm">
                      {imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt=""
                          className="mb-2 w-full rounded-lg object-cover"
                          style={{ maxHeight: "160px" }}
                        />
                      )}
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#111b21]">
                        {messageTemplate}
                      </p>
                      {footer && (
                        <p className="mt-1 border-t border-[#e9edef] pt-1 text-[11px] text-[#667781]">
                          {footer}
                        </p>
                      )}
                      <div className="mt-1 flex items-center justify-end gap-1">
                        <span className="text-[10px] text-[#667781]">
                          {new Intl.DateTimeFormat("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date())}
                        </span>
                        <svg viewBox="0 0 16 11" className="h-[11px] w-4 fill-[#53bdeb]">
                          <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.095a.463.463 0 0 0-.336-.153.457.457 0 0 0-.334.156.563.563 0 0 0-.141.355c0 .134.052.26.141.355l2.312 2.408a.47.47 0 0 0 .348.16.5.5 0 0 0 .295-.1.478.478 0 0 0 .125-.145l6.39-7.893a.54.54 0 0 0 .114-.33.534.534 0 0 0-.146-.335.456.456 0 0 0-.134-.09zM8.116 8.728c0 .128.049.252.14.344l1.447 1.506c.09.092.215.143.344.143a.492.492 0 0 0 .349-.152.531.531 0 0 0 .09-.628.54.54 0 0 0-.09-.12L9.035 8.659a.494.494 0 0 0-.694 0 .535.535 0 0 0-.143.361.486.486 0 0 0-.082-.292z"/>
                        </svg>
                      </div>
                      {/* Tail */}
                      <div className="absolute -right-[6px] top-3 h-3 w-3 rotate-45 bg-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-3 rounded-lg border border-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Judul</span>
                  <span className="text-sm font-medium text-white">{title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Target</span>
                  <span className="text-sm text-white">{selectedIds.length} kontak</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Jadwal</span>
                  <span className="text-sm text-white">
                    {scheduleType === "now"
                      ? "Kirim Sekarang"
                      : scheduledAt
                        ? new Date(scheduledAt).toLocaleDateString("id-ID", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Terjadwal"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Delay Antar Pesan</span>
                  <span className="text-sm text-white">{delaySec || 3} detik</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Sebelumnya
            </Button>

            {step < steps.length ? (
              <Button
                type="button"
                variant="whatsapp"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Selanjutnya
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="whatsapp"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Konfirmasi & Kirim
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
