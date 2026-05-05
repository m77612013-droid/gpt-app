"use client";

const BASE_OFFERS_URL = "https://singingfiles.com/1893832";

interface Props {
  scriptId?: string;
  userId?: string;
  iframeKey?: number;
}

export default function CPAGripPanel({ userId }: Props) {
  // sub1 is the CPAGrip variable that gets sent back in the postback as {sub1}
  // The postback URL is configured as: /api/postback?user_id={sub1}&...
  // Without sub1 here, CPAGrip sends an empty user_id and no points are credited
  const offersUrl = userId
    ? `${BASE_OFFERS_URL}?sub1=${encodeURIComponent(userId)}`
    : BASE_OFFERS_URL;

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center gap-8 px-6 py-12 text-center bg-slate-950">

      {/* Icon */}
      <div className="w-20 h-20 rounded-3xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
        <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
        </svg>
      </div>

      {/* Heading */}
      <div className="flex flex-col gap-3 max-w-md">
        <h2 className="text-2xl font-bold text-white leading-snug">
          عروض CPAGrip
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          اضغط على الزر أدناه لفتح قائمة العروض المتاحة وابدأ في جني الأرباح فوراً.
          كل عرض تكمله يُضاف رصيده إلى حسابك تلقائياً.
        </p>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => window.open(offersUrl, "_blank", "noopener,noreferrer")}
        className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-lg shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 transition-all duration-200"
      >
        <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
        <span>اضغط هنا لفتح قائمة العروض وبدء جني الأرباح</span>
      </button>

      {/* Note */}
      <p className="text-slate-600 text-xs">
        سيتم فتح العروض في نافذة جديدة — لا تغلقها حتى تكتمل المهمة
      </p>
    </div>
  );
}