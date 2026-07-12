"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Users, Loader2, Search, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getGroupContacts, getContacts, addContactsToGroup, removeContactFromGroup } from "@/lib/actions/contacts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: { id: string; name: string } | null;
}

export function GroupDetailDialog({ open, onOpenChange, group }: Props) {
  const [members, setMembers] = useState<{ id: string; name: string; phoneNumber: string }[]>([]);
  const [allContacts, setAllContacts] = useState<{ id: string; name: string; phoneNumber: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !group) return;
    setLoading(true);
    Promise.all([
      getGroupContacts(group.id),
      getContacts(1, "", 1000),
    ]).then(([membersData, contactsData]) => {
      const m = membersData as any[];
      const c = (contactsData.data as any[]) || [];
      setMembers(m);
      setAllContacts(c);
      setSelectedIds(new Set(m.map((x) => x.id)));
      setSearch("");
      setLoading(false);
    });
  }, [open, group]);

  const toggleContact = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!group) return;
    setSaving(true);
    try {
      const memberIds = new Set(members.map((m) => m.id));
      const toAdd = Array.from(selectedIds).filter((id) => !memberIds.has(id));
      const toRemove = members.filter((m) => !selectedIds.has(m.id));

      if (toAdd.length > 0) {
        await addContactsToGroup(toAdd, group.id);
      }
      for (const contact of toRemove) {
        await removeContactFromGroup(contact.id, group.id);
      }

      toast.success("Anggota grup berhasil diperbarui");
      onOpenChange(false);
    } catch {
      toast.error("Gagal memperbarui anggota grup");
    } finally {
      setSaving(false);
    }
  };

  const filteredContacts = allContacts.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phoneNumber.includes(search)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-whatsapp" />
            Atur Anggota: {group?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Cari kontak..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
          ) : (
            <div className="space-y-0.5 py-2">
              {filteredContacts.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  {search ? "Tidak ada kontak yang cocok" : "Belum ada kontak"}
                </p>
              ) : (
                filteredContacts.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-slate-800/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleContact(c.id)}
                      className="rounded border-slate-600"
                    />
                    <span className="flex-1 text-sm font-medium text-white">{c.name}</span>
                    <span className="text-xs text-slate-500">{c.phoneNumber}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          <p className="text-xs text-slate-500">
            {selectedIds.size} kontak dipilih
          </p>
          <Button
            variant="whatsapp"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Simpan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
