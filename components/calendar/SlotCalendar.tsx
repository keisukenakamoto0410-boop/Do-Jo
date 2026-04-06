"use client";

import { Calendar, dateFnsLocalizer, Views, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ja } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState, useCallback, useMemo } from "react";

const locales = {
  ja: ja,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ja }),
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    status: "available" | "reserved";
    reservationId?: string;
    learnerName?: string;
  };
}

interface SlotCalendarProps {
  slots: Array<{
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    reservation?: {
      id: string;
      learner: {
        name: string;
      };
    };
  }>;
  onSelectSlot: (start: Date, end: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

export default function SlotCalendar({
  slots,
  onSelectSlot,
  onSelectEvent,
}: SlotCalendarProps) {
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());

  // スロットをカレンダーイベントに変換
  const events: CalendarEvent[] = useMemo(() => {
    return slots.map((slot) => ({
      id: slot.id,
      title:
        slot.status === "reserved" && slot.reservation
          ? `予約済み - ${slot.reservation.learner.name}`
          : "空き",
      start: new Date(slot.startTime),
      end: new Date(slot.endTime),
      resource: {
        status: slot.status as "available" | "reserved",
        reservationId: slot.reservation?.id,
        learnerName: slot.reservation?.learner.name,
      },
    }));
  }, [slots]);

  // イベントのスタイル
  const eventStyleGetter = useCallback(
    (event: CalendarEvent) => {
      const isReserved = event.resource?.status === "reserved";
      return {
        style: {
          backgroundColor: isReserved ? "#ef4444" : "#22c55e",
          borderRadius: "5px",
          opacity: 0.8,
          color: "white",
          border: "0px",
          display: "block",
        },
      };
    },
    []
  );

  // 空きスロット選択時
  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date }) => {
      onSelectSlot(slotInfo.start, slotInfo.end);
    },
    [onSelectSlot]
  );

  // イベントクリック時
  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      onSelectEvent(event);
    },
    [onSelectEvent]
  );

  return (
    <div className="h-[600px] bg-white rounded-lg shadow p-4">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        messages={{
          next: "次へ",
          previous: "前へ",
          today: "今日",
          month: "月",
          week: "週",
          day: "日",
          agenda: "予定",
          date: "日付",
          time: "時間",
          event: "イベント",
          noEventsInRange: "この期間には予定がありません",
          showMore: (total) => `+${total} 件`,
        }}
        step={30}
        timeslots={2}
        min={new Date(2024, 0, 1, 9, 0, 0)} // 9:00
        max={new Date(2024, 0, 1, 21, 0, 0)} // 21:00
        culture="ja"
      />
    </div>
  );
}
