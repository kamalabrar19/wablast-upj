"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Send, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getScheduledBlasts } from "@/lib/actions/blasts";

interface Blast {
  id: string;
  title: string;
  status: string;
  scheduledAt: Date | null;
  _count: { targets: number };
}

export function ScheduleClient() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [blasts, setBlasts] = useState<Blast[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchBlasts = useCallback(async () => {
    try {
      const start = startOfWeek(startOfMonth(currentMonth));
      const end = endOfWeek(endOfMonth(currentMonth));
      const data = await getScheduledBlasts(start, end);
      setBlasts(data as unknown as Blast[]);
    } catch {
      toast.error("Gagal memuat jadwal");
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchBlasts();
  }, [fetchBlasts]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getBlastsForDate = (date: Date) => {
    return blasts.filter((b) => {
      if (!b.scheduledAt) return false;
      return isSameDay(new Date(b.scheduledAt), date);
    });
  };

  const selectedBlasts = selectedDate ? getBlastsForDate(selectedDate) : [];

  const blastUrl = selectedDate
    ? `/dashboard/blast/new?date=${format(selectedDate, "yyyy-MM-dd")}`
    : "#";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <div className="rounded-xl border border-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 p-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-white">
              {format(currentMonth, "MMMM yyyy", { locale: id })}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 border-b border-slate-800">
            {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d) => (
              <div
                key={d}
                className="p-3 text-center text-xs font-medium text-slate-500"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7">
            {days.map((d, i) => {
              const dayBlasts = getBlastsForDate(d);
              const isCurrentMonth = isSameMonth(d, currentMonth);
              const isToday = isSameDay(d, new Date());
              const isSelected = selectedDate && isSameDay(d, selectedDate);

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(d)}
                  className={`min-h-24 border-b border-r border-slate-800 p-2 text-left transition-colors hover:bg-slate-800/50 ${
                    !isCurrentMonth ? "opacity-40" : ""
                  } ${isToday ? "bg-whatsapp/5" : ""} ${
                    isSelected ? "ring-1 ring-whatsapp" : ""
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      isToday ? "text-whatsapp" : "text-slate-400"
                    }`}
                  >
                    {format(d, "d")}
                  </p>
                  <div className="mt-1 space-y-1">
                    {dayBlasts.slice(0, 2).map((b) => (
                      <div
                        key={b.id}
                        className="truncate rounded bg-whatsapp/10 px-1 py-0.5 text-xs text-whatsapp"
                      >
                        {b.title}
                      </div>
                    ))}
                    {dayBlasts.length > 2 && (
                      <p className="text-xs text-slate-500">
                        +{dayBlasts.length - 2} lagi
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected date details */}
      <div>
        <div className="rounded-xl border border-slate-800 p-4">
          <h3 className="text-sm font-medium text-slate-400">
            {selectedDate
              ? format(selectedDate, "EEEE, d MMMM yyyy", { locale: id })
              : "Pilih tanggal"}
          </h3>

          <div className="mt-4 space-y-3">
            {selectedBlasts.length === 0 && selectedDate && (
              <p className="py-8 text-center text-sm text-slate-500">
                Tidak ada blast pada tanggal ini
              </p>
            )}
            {selectedBlasts.map((b) => (
              <Link
                key={b.id}
                href={`/dashboard/blast/${b.id}`}
                className="block rounded-lg border border-slate-800 p-3 transition-colors hover:border-slate-700"
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-white">{b.title}</p>
                  <Badge
                    variant={
                      b.status === "scheduled" ? "warning" : "secondary"
                    }
                  >
                    {b.status === "scheduled" ? "Terjadwal" : "Draft"}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <Send className="h-3 w-3" />
                  <span>{b._count.targets} target</span>
                  {b.scheduledAt && (
                    <span>
                      {format(new Date(b.scheduledAt), "HH:mm")}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {selectedDate && (
            <Link href={blastUrl}>
              <Button variant="whatsapp" className="mt-4 w-full">
                <Plus className="mr-2 h-4 w-4" />
                Buat Blast Baru
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
