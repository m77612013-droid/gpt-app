import Link from "next/link";

export const metadata = { title: "شروط الاستخدام | جنى" };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">

      <div className="max-w-3xl mx-auto px-4 py-14 prose prose-invert prose-sm sm:prose-base leading-loose">
        <h1 className="text-2xl font-bold mb-2">شروط الاستخدام</h1>
        <p className="text-slate-400 text-sm mb-10">آخر تحديث: أبريل 2026</p>

        <Section title="1. القبول بالشروط">
          باستخدامك لمنصة <strong>جنى</strong>، فإنك توافق على الالتزام بهذه الشروط. إذا كنت لا توافق عليها، يُرجى عدم استخدام الخدمة.
        </Section>

        <Section title="2. وصف الخدمة">
          جنى هي منصة مكافآت تتيح للمستخدمين كسب نقاط عن طريق إتمام العروض والاستبيانات وتثبيت التطبيقات المقدمة من شركاء خارجيين. النقاط المكتسبة قابلة للاسترداد وفق الشروط الواردة في قسم السحب.
        </Section>

        <Section title="3. التسجيل والحسابات">
          <ul className="list-disc list-inside space-y-1">
            <li>يجب أن يكون عمرك 16 عامًا أو أكثر للتسجيل.</li>
            <li>يُسمح بحساب واحد فقط لكل مستخدم — الحسابات المتعددة ستُعلّق فورًا.</li>
            <li>أنت مسؤول عن الحفاظ على سرية بيانات دخولك.</li>
            <li>يجب أن تكون المعلومات التي تقدمها دقيقة وحديثة.</li>
          </ul>
        </Section>

        <Section title="4. كسب النقاط وصرفها">
          <ul className="list-disc list-inside space-y-1">
            <li>يتم إضافة النقاط فقط بعد التحقق من إتمام العرض من قِبَل المورد الخارجي.</li>
            <li>الحد الأدنى للسحب هو <strong>100 نقطة</strong>.</li>
            <li>معدل التحويل: <strong>100 نقطة = 1.00 دولار أمريكي</strong>.</li>
            <li>يحق لنا رفض طلبات السحب المشبوهة أو التي تنتهك هذه الشروط.</li>
            <li>النقاط غير قابلة للتحويل بين الحسابات.</li>
            <li>يتم معالجة طلبات السحب خلال فترة تتراوح بين 24 و 72 ساعة من تقديم الطلب.</li>
          </ul>
        </Section>

        <Section title="4أ. سياسة الدفع والشبكات الإعلانية">
          <p>تعتمد منصة جنى على شبكات إعلانية خارجية بما فيها: Monlix, CPALead, AdGate Media, Lootably, AdscendMedia, CPAGrip وغيرها. عند بدء التفاعل مع عرض ما:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>قد يتم مشاركة معرفك الفريد (Sub-ID) مع الشبكة لوحدها دون أي معلومات شخصية أخرى.</li>
            <li>تخضع العروض لشروط استخدام كل شبكة على حدة.</li>
            <li>جنى غير مسؤولة عن أسعار العروض أو توفرها من قبل شبكات خارجية.</li>
          </ul>
        </Section>

        <Section title="5. السلوك المحظور">
          يُحظر على المستخدمين:
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>استخدام أدوات الأتمتة أو البوتات لإتمام العروض.</li>
            <li>إنشاء حسابات متعددة للحصول على مكافآت إضافية.</li>
            <li>التلاعب في نظام النقاط أو محاولة اختراق المنصة.</li>
            <li>انتهاك شروط الشركاء والموردين الخارجيين.</li>
          </ul>
        </Section>

        <Section title="6. إنهاء الحساب">
          نحتفظ بالحق في تعليق أو إنهاء حساب أي مستخدم يخالف هذه الشروط، مع مصادرة رصيده غير المكتسب.
        </Section>

        <Section title="7. إخلاء المسؤولية">
          يتم تقديم الخدمة «كما هي» دون أي ضمانات. لسنا مسؤولين عن أي خسائر ناجمة عن استخدام المنصة أو عدم توفرها.
        </Section>

        <Section title="8. التعديلات">
          قد نعدّل هذه الشروط في أي وقت. سيتم إخطارك عبر البريد الإلكتروني أو عبر إشعار على المنصة عند إجراء تغييرات جوهرية.
        </Section>

        <Section title="9. التواصل">
          لأي استفسار حول هذه الشروط، تواصل معنا عبر صفحة <Link href="/contact" className="text-blue-400 hover:underline">اتصل بنا</Link>.
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
      <div className="text-slate-300 leading-loose">{children}</div>
    </section>
  );
}
