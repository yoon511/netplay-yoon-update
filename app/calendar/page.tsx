"use client";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useRouter, useSearchParams } from "next/navigation";


import { Suspense, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";


function CalendarContent() {
    const router = useRouter();
  const params = useSearchParams();
      const [meetingDates, setMeetingDates] = useState<Set<string>>(new Set());
      const [selectedDate, setSelectedDate] = useState<Date>(new Date());
      const [dayMeetings, setDayMeetings] = useState<any[]>([]);
      const [activeMonth, setActiveMonth] = useState<Date>(new Date());
      const [monthSummary, setMonthSummary] = useState({
  meetings: 0,
  totalAttendees: 0,
  guestCount: 0,
});


  useEffect(() => {
    async function loadMeetingDates() {
      const snap = await getDocs(collection(db, "meetings"));

      const dates = new Set<string>();
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.dateKey) {
          dates.add(data.dateKey);
        }
      });

      setMeetingDates(dates);
    }

    loadMeetingDates();
  }, []);
  useEffect(() => {
  loadMonthSummary(selectedDate);
}, []);


  function toDateKey(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  async function loadMeetingsByDate(date: Date) {
    const key = toDateKey(date);
    const snap = await getDocs(collection(db, "meetings"));

    const list: any[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (data.dateKey === key) {
        list.push(data);
      }
    });

    setDayMeetings(list);
  }
  async function loadMonthSummary(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");

  const snap = await getDocs(collection(db, "meetings"));

  let meetings = 0;
  let totalAttendees = 0;
  let guestCount = 0;

  snap.forEach((doc) => {
    const data = doc.data();
    if (!data.dateKey) return;

    // 같은 달인지 확인 (yyyy-mm)
    if (data.dateKey.startsWith(`${y}-${m}`)) {
      meetings += 1;

      (data.attendees || []).forEach((a: any) => {
        totalAttendees += 1;
        if (a.guest) guestCount += 1;
      });
    }
  });

  setMonthSummary({ meetings, totalAttendees, guestCount });
}


  return (
    <main className="min-h-screen bg-[#F3FAF7] p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6 border border-[#DFF2EA]">
       {/* ← 투표 목록으로 돌아가기 */}
<button
  onClick={() => {
    const userQuery = new URLSearchParams({
      name: params.get("name") ?? "",
      pin: params.get("pin") ?? "",
      grade: params.get("grade") ?? "",
      gender: params.get("gender") ?? "",
      guest: String(params.get("guest") === "true"),
      admin: String(params.get("admin") === "true"),
    }).toString();

    router.push(`/vote?${userQuery}`);
  }}
  className="mb-4 text-sm text-[#51736f] hover:text-[#2F4F4F] flex items-center gap-1 font-semibold"
>
  ← 투표 목록으로
</button>

       <h1 className="flex items-center gap-2 text-2xl font-extrabold text-[#2F4F4F] mb-6">
  <span className="text-3xl">
  Netplay 모임 기록 </span>🧩
</h1>


        <div className="rounded-2xl border border-[#DFF2EA] bg-[#F6FBF9] p-4">
         <div className="mb-4 bg-[#ECF8F3] rounded-xl px-4 py-3 text-[#51736f]">
  <div className="text-sm font-bold">
    📊 {activeMonth.getFullYear()}년 {activeMonth.getMonth() + 1}월
 요약
  </div>

  <div className="mt-1 text-sm font-semibold">
    모임 {monthSummary.meetings}회 ·
    참석 {monthSummary.totalAttendees}명
    {monthSummary.guestCount > 0 && (
      <> (게스트 {monthSummary.guestCount}명)</>
    )}
  </div>
</div>


         <Calendar
  locale="en-US"
  showNeighboringMonth={false}
  value={selectedDate}
  onClickDay={(date) => {
    setSelectedDate(date);
    loadMeetingsByDate(date);
  }}
 onActiveStartDateChange={({ activeStartDate }) => {
  if (activeStartDate) {
    setActiveMonth(activeStartDate);
    loadMonthSummary(activeStartDate);
  }
}}


  formatDay={(locale, date) => date.getDate().toString()}
  formatMonthYear={(locale, date) =>
    `${date.getFullYear()}년 ${date.getMonth() + 1}월`
  }
  formatShortWeekday={(locale, date) =>
    ["일", "월", "화", "수", "목", "금", "토"][date.getDay()]
  }
  tileContent={({ date, view }) => {
    if (view !== "month") return <div className="calendar-dot" />;

    const key = toDateKey(date);
    if (!meetingDates.has(key)) {
      return <div className="calendar-dot" />;
    }

    return (
      <div className="calendar-dot">
        <span className="dot" />
      </div>
    );
  }}


/>



{dayMeetings.length > 0 && (
  <div className="mt-6 space-y-4">
    {dayMeetings.map((m, idx) => (
      <div
        key={idx}
        className="bg-white border border-[#DFF2EA] rounded-2xl p-4"
      >
        <div className="text-sm font-semibold text-[#2F4F4F] space-y-1">
          <div>🕒 시간: {m.time}</div>
          <div>📍 장소: {m.location}</div>
          <div>💰 비용: {m.fee}</div>
        </div>

        <div className="mt-3">
          <div className="font-bold text-[#2F4F4F] mb-2">
            참석자 ({m.attendees?.length || 0})
          </div>

         <div className="space-y-1">
  {(m.attendees || []).map((a: any, i: number) => (
    <div
      key={i}
      className="text-sm font-medium text-[#2F4F4F]"
    >
      • {a.name}
      {a.guest && (
        <span className="text-xs text-[#E57373] ml-1">(게스트)</span>
      )}
    </div>
  ))}
</div>

        </div>
      </div>
    ))}
  </div>
)}


        </div>

        <style jsx global>{`
       

          /* 전체 달력 */
          .react-calendar {
            width: 100%;
            border: none;
            background: transparent;
            font-family: inherit;
          }

          /* 헤더 네비게이션 */
          .react-calendar__navigation {
            margin-bottom: 10px;
          }
          .react-calendar__navigation button {
            border-radius: 14px;
            font-weight: 900;
            color: #2f4f4f;
            background: transparent;
            padding: 10px 8px;
          }
          .react-calendar__navigation button:enabled:hover {
            background: rgba(111, 207, 151, 0.18);
          }

          /* 요일 */
          .react-calendar__month-view__weekdays {
            text-transform: none;
            font-weight: 800;
            color: #51736f;
          }
          .react-calendar__month-view__weekdays abbr {
            text-decoration: none;
          }

          /* 날짜 타일 */
         .react-calendar__tile {
  height: 56px;                 /* 🔑 살짝 키움 */
  border-radius: 16px;
  font-weight: 800;
  color: #2f4f4f;
  display: flex;                /* 🔑 flex로 변경 */
  flex-direction: column;       /* 🔑 세로 정렬 */
  align-items: center;
  justify-content: center;
  gap: 4px;                     /* 숫자-점 간격 */
}



          /* 날짜 hover */
          .react-calendar__tile:enabled:hover {
            background: rgba(111, 207, 151, 0.18);
          }

          /* 오늘 */
          .react-calendar__tile--now {
            background: rgba(111, 207, 151, 0.22);
          }

          /* 선택된 날짜 */
          .react-calendar__tile--active {
            background: #6fcf97 !important;
            color: white !important;
          }

          /* 선택된 날짜 hover */
          .react-calendar__tile--active:enabled:hover {
            background: #3aae84 !important;
          }
           
/* 일요일만 빨간색 */
.react-calendar__month-view__days__day--sunday {
  color: #e74c3c;
  font-weight: 900;
}




/* 날짜 타일 내부 레이아웃 고정 */
.react-calendar__tile {
  height: 56px;
  border-radius: 16px;
  font-weight: 800;
  color: #2f4f4f;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 점 영역: 항상 공간 차지 */
.calendar-dot {
  height: 10px;              /* 🔑 점 있어도/없어도 동일 */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 실제 점 */
.calendar-dot .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6fcf97;
}
  /* 상단 연/월 줄바꿈 방지 */
.react-calendar__navigation__label {
  white-space: nowrap;        /* 🔑 줄바꿈 금지 */
  flex-grow: 0 !important;    /* 🔑 영역 과도 확장 방지 */
}
  .react-calendar__navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.react-calendar__navigation button {
  min-width: 44px;   /* ← 화살표 버튼 고정 */
}




        `}</style>

        
      </div>
    </main>
  );
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F3FAF7] p-4 flex items-center justify-center">
          캘린더 불러오는 중…
        </main>
      }
    >
      <CalendarContent />
    </Suspense>
  );
}
