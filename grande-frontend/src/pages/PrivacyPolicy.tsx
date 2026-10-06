import { Shield, Phone, Mail, MapPin, Eye, Database, Share2, Lock, UserCheck, FileText, RefreshCw } from 'lucide-react';

const sections = [
  {
    number: '01',
    icon: Database,
    title: 'Information We Collect',
    content: (
      <div className="space-y-3">
        <p className="text-gray-600 leading-relaxed">
          We intentionally collect minimal personal information to provide you with seamless service. We only gather:
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 flex-shrink-0" />
            <span className="text-gray-600"><span className="font-semibold text-gray-800">Contact Information:</span> Your mobile phone number and email address.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 flex-shrink-0" />
            <span className="text-gray-600"><span className="font-semibold text-gray-800">Identity Verification Data:</span> Identity documents or verification details provided by you.</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    number: '02',
    icon: Eye,
    title: 'How We Collect Your Information',
    content: (
      <ul className="space-y-3">
        <li className="flex items-start gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 flex-shrink-0" />
          <span className="text-gray-600"><span className="font-semibold text-gray-800">Contact Details:</span> Collected directly from you when you register or communicate with us through the app or website.</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 flex-shrink-0" />
          <span className="text-gray-600"><span className="font-semibold text-gray-800">Identity Verification:</span> You may verify your identity digitally (via our website/app) or in person during physical check-in at the property.</span>
        </li>
      </ul>
    ),
  },
  {
    number: '03',
    icon: FileText,
    title: 'How We Use Your Information',
    content: (
      <div className="space-y-3">
        <p className="text-gray-600 leading-relaxed">
          We use your collected information strictly for necessary operational and communication purposes:
        </p>
        <ul className="space-y-2">
          {[
            'To send reservation confirmations, updates, and important operational alerts.',
            'To contact you regarding customer support or service inquiries.',
            'To verify guest identity for check-in and security requirements as permitted by local regulations.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 flex-shrink-0" />
              <span className="text-gray-600">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    number: '04',
    icon: Shield,
    title: 'Financial & Payment Data',
    content: (
      <ul className="space-y-3">
        {[
          'GrandeBeach does not collect, process, or store any financial or payment details.',
          'There are no payment processing pages on the GrandeBeach app.',
          'We do not ask for, collect, or retain credit card, debit card, or bank account information.',
        ].map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 flex-shrink-0" />
            <span className="text-gray-600">{item}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    number: '05',
    icon: Share2,
    title: 'Data Sharing & Selling',
    content: (
      <ul className="space-y-3">
        <li className="flex items-start gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 flex-shrink-0" />
          <span className="text-gray-600"><span className="font-semibold text-gray-800">No Selling of Data:</span> We do not sell, trade, rent, or lease your phone number, email address, or identification data to third parties under any circumstances.</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 flex-shrink-0" />
          <span className="text-gray-600"><span className="font-semibold text-gray-800">Service Providers:</span> Your contact information is never shared with third-party marketers.</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 flex-shrink-0" />
          <span className="text-gray-600"><span className="font-semibold text-gray-800">Legal Disclosures:</span> We may disclose minimal guest details only if required by applicable local laws, government regulations, or valid legal authorities.</span>
        </li>
      </ul>
    ),
  },
  {
    number: '06',
    icon: Lock,
    title: 'Data Security',
    content: (
      <p className="text-gray-600 leading-relaxed">
        We implement strict physical, electronic, and administrative security measures to ensure your contact details and verification records remain protected against unauthorized access, loss, or misuse.
      </p>
    ),
  },
  {
    number: '07',
    icon: UserCheck,
    title: 'User Rights & Data Deletion',
    content: (
      <div className="space-y-3">
        <p className="text-gray-600 leading-relaxed">
          Depending on applicable privacy laws, you have the right to:
        </p>
        <ul className="space-y-2">
          {[
            'Request access to the phone number and email address we have on record.',
            'Request updates or corrections to your contact information.',
            'Request the deletion of your account and associated contact information, subject to applicable legal retention rules.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 flex-shrink-0" />
              <span className="text-gray-600">{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-gray-600 leading-relaxed">
          To exercise these rights, please contact our privacy representative directly.
        </p>
      </div>
    ),
  },
  {
    number: '08',
    icon: RefreshCw,
    title: 'Changes to This Privacy Policy',
    content: (
      <p className="text-gray-600 leading-relaxed">
        We may update our Privacy Policy periodically to reflect changes in our operational procedures or legal duties. Updates will be published on this page with an updated revision date.
      </p>
    ),
  },
];

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero header */}
      <div className="bg-navy-900 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-400/30 mb-6">
            <Shield className="text-gold-400" size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-navy-200 text-sm">
            Last Updated: <span className="text-gold-400 font-medium">August 16, 2026</span>
          </p>
          <p className="text-navy-200 mt-4 max-w-2xl mx-auto leading-relaxed">
            At GrandeBeach, we respect your privacy and are committed to protecting the limited personal information you share with us. This Privacy Policy outlines how we collect, use, and safeguard your details.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        {sections.map(({ number, icon: Icon, title, content }) => (
          <div
            key={number}
            className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center">
                <Icon className="text-gold-500" size={18} />
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-gold-400 font-bold text-sm">{number}</span>
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              </div>
            </div>
            <div className="pl-14">{content}</div>
          </div>
        ))}

        {/* Contact section */}
        <div className="bg-navy-900 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-white mb-2">09 — Contact Us</h2>
          <p className="text-navy-200 text-sm mb-6 leading-relaxed">
            If you have questions or concerns regarding this Privacy Policy or your data, please contact us at:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: Mail, label: 'Email', value: 'info@grandebeach.com', href: 'mailto:info@grandebeach.com' },
              { icon: Phone, label: 'Phone', value: '+965 9097 6666', href: 'tel:+96590976666' },
              { icon: MapPin, label: 'Address', value: 'Khiran, Kuwait', href: null },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-400/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="text-gold-400" size={15} />
                </div>
                <div>
                  <p className="text-xs font-medium text-navy-400 uppercase tracking-wide mb-0.5">{label}</p>
                  {href ? (
                    <a href={href} className="text-white text-sm font-medium hover:text-gold-400 transition-colors">
                      {value}
                    </a>
                  ) : (
                    <p className="text-white text-sm font-medium">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
