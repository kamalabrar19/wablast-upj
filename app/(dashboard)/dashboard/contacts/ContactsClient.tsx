"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Upload,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Users,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactDialog } from "@/components/dashboard/ContactDialog";
import { ImportCSVDialog } from "@/components/dashboard/ImportCSVDialog";
import { GroupDialog } from "@/components/dashboard/GroupDialog";
import { GroupDetailDialog } from "@/components/dashboard/GroupDetailDialog";
import { getContacts, deleteContact, getContactGroups, deleteContactGroup } from "@/lib/actions/contacts";

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  createdAt: Date;
  groupMembers: { group: { id: string; name: string } }[];
}

interface ContactGroup {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number };
}

export function ContactsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"contacts" | "groups">("contacts");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [detailGroup, setDetailGroup] = useState<{ id: string; name: string } | null>(null);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getContacts(page, search);
      setContacts(result.data as unknown as Contact[]);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  const fetchGroups = useCallback(async () => {
    const result = await getContactGroups();
    setGroups(result as unknown as ContactGroup[]);
  }, []);

  useEffect(() => {
    if (tab === "contacts") {
      fetchContacts();
    } else {
      fetchGroups();
    }
  }, [tab, fetchContacts, fetchGroups]);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteContact(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Kontak berhasil dihapus");
      fetchContacts();
    }
    setDeletingId(null);
  }

  async function handleDeleteGroup(id: string) {
    const result = await deleteContactGroup(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Grup berhasil dihapus");
      fetchGroups();
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-slate-800 bg-slate-900/50 p-1">
        <button
          onClick={() => setTab("contacts")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "contacts"
              ? "bg-whatsapp/10 text-whatsapp"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Semua Kontak
        </button>
        <button
          onClick={() => setTab("groups")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "groups"
              ? "bg-whatsapp/10 text-whatsapp"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Grup
        </button>
      </div>

      {/* Actions bar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Cari kontak..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {tab === "contacts" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportDialogOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
              <Button
                variant="whatsapp"
                size="sm"
                onClick={() => {
                  setEditingContact(null);
                  setContactDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kontak
              </Button>
            </>
          ) : (
            <Button
              variant="whatsapp"
              size="sm"
              onClick={() => setGroupDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Buat Grup
            </Button>
          )}
        </div>
      </div>

      {/* Contact List */}
      {tab === "contacts" && (
        <>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="rounded-xl border border-slate-800 p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-lg font-medium text-slate-400">
                Belum ada kontak
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Tambah kontak manual atau import via CSV
              </p>
              <Button
                variant="whatsapp"
                className="mt-4"
                onClick={() => setContactDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kontak Pertama
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-800">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Nomor WhatsApp</TableHead>
                      <TableHead>Grup</TableHead>
                      <TableHead className="w-24">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium text-white">
                          {contact.name}
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {contact.phoneNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {contact.groupMembers.length > 0 ? (
                              contact.groupMembers.map((gm) => (
                                <Badge key={gm.group.id} variant="secondary">
                                  {gm.group.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-slate-600">
                                -
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingContact(contact);
                                setContactDialogOpen(true);
                              }}
                              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(contact.id)}
                              disabled={deletingId === contact.id}
                              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                            >
                              {deletingId === contact.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    {total} kontak (halaman {page} dari {totalPages})
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Group List */}
      {tab === "groups" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.length === 0 ? (
            <div className="col-span-full rounded-xl border border-slate-800 p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-lg font-medium text-slate-400">
                Belum ada grup
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Buat grup untuk mengelompokkan kontak
              </p>
              <Button
                variant="whatsapp"
                className="mt-4"
                onClick={() => setGroupDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Buat Grup
              </Button>
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                className="rounded-xl border border-slate-800 p-5 transition-colors hover:border-slate-700 cursor-pointer"
                onClick={() => setDetailGroup({ id: group.id, name: group.name })}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-white">{group.name}</h3>
                    {group.description && (
                      <p className="mt-1 text-sm text-slate-500">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                    className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                  <Users className="h-4 w-4" />
                  <span>{group._count.members} kontak</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Dialogs */}
      <ContactDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        contact={editingContact}
      />
      <ImportCSVDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
      <GroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
      />
      <GroupDetailDialog
        open={!!detailGroup}
        onOpenChange={(open) => { if (!open) setDetailGroup(null); }}
        group={detailGroup}
      />
    </div>
  );
}
