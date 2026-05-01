import Link from "next/link";
import LogoBrand from "@/app/components/LogoBrand";

export const metadata = { title: "سياسة الخصوصية | جنى" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="bg-white/[0.04] backdrop-blur-md border-b border-white/[0.07] sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/"><LogoBrand size="sm" /></Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">← الرئيسية</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-14">
        <h1 className="text-2xl font-bold mb-2">سياسة الخصوصية</h1>
        <p className="text-slate-400 text-sm mb-10">آخر تحديث: أبريل 2026</p>

        <Section title="1. المعلومات التي نجمعها">
          <p>نجمع المعلومات التالية عند تسجيلك واستخدامك للمنصة:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>معلومات الحساب:</strong> الاسم الكامل، عنوان البريد الإلكتروني، وكلمة المرور (مشفرة).</li>
            <li><strong>بيانات الاستخدام:</strong> العروض المكتملة، النقاط المكتسبة، طلبات السحب.</li>
            <li><strong>البيانات التقنية:</strong> عنوان IP، نوع المتصفح، والجهاز المستخدم لأغراض أمنية.</li>
          </ul>
        </Section>

        <Section title="2. كيف نستخدم معلوماتك">
          <ul className="list-disc list-inside space-y-1">
            <li>تشغيل الخدمة وإدارة حسابك.</li>
            <li>معالجة مكافآتك وطلبات السحب.</li>
            <li>منع الاحتيال وحماية أمان المنصة.</li>
            <li>إرسال إشعارات ضرورية تتعلق بحسابك (لا رسائل تسويقية بدون موافقتك).</li>
          </ul>
        </Section>

        <Section title="3. مشاركة المعلومات">
          <p>لا نبيع معلوماتك الشخصية لأي طرف ثالث. نشارك البيانات الضرورية فقط مع:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>موردي العروض</strong> (Monlix, CPALead, إلخ): معرّف المستخدم فقط لتتبع المكافآت.</li>
            <li><strong>Supabase</strong>: مزود البنية التحتية للبيانات — تنطبق عليهم سياسة الخصوصية الخاصة بهم.</li>
            <li><strong>الجهات القانونية</strong>: عند الاقتضاء القانوني فقط.</li>
          </ul>
        </Section>

        <Section title="4. أمان البيانات">
          نستخدم تشفير SSL/TLS لجميع الاتصالات. كلمات المرور مشفرة ببروتوكول bcrypt عبر Supabase Auth. لا يمكن لأي موظف الوصول إلى كلمة مرورك.
        </Section>

        <Section title="5. ملفات تعريف الارتباط (Cookies)">
          نستخدم ملفات تعريف الارتباط لإدارة جلسات المستخدم فقط. لا نستخدم تتبع إعلاني من أي نوع.
        </Section>

        <Section title="6. حقوقك">
          <ul className="list-disc list-inside space-y-1">
            <li>طلب الاطلاع على بياناتك الشخصية.</li>
            <li>طلب تصحيح أو حذف بياناتك.</li>
            <li>إلغاء الاشتراك في الإشعارات الاختيارية.</li>
          </ul>
          <p className="mt-2">لممارسة هذه الحقوق، تواصل معنا عبر <Link href="/contact" className="text-blue-400 hover:underline">صفحة التواصل</Link>.</p>
        </Section>

        <Section title="7. التغييرات على هذه السياسة">
          سنُعلمك بأي تغييرات جوهرية عبر البريد الإلكتروني قبل سريانها بـ 7 أيام على الأقل.
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
      <div className="text-slate-300 leading-loose text-sm sm:text-base">{children}</div>
    </section>
  );
}
