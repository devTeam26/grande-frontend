import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WHATSAPP_NUMBER } from '../../utils/constants';
function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;
}

export function Footer() {
  const { t, i18n } = useTranslation();
  const year = new Date().getFullYear();
  const isAr = i18n.language === 'ar';

  return (
    <footer className="bg-navy-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-12 w-12 rounded-full border border-gold-400 overflow-hidden flex-shrink-0">
                <img
                  src="/grand.jpg"
                  alt="Grande Beach Al Khiran"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-white font-bold text-base tracking-tight">Grande Beach</span>
                <span className="text-gold-400 text-xs font-medium">
                  {isAr ? 'خيران - الكويت' : 'Al Khiran, Kuwait'}
                </span>
              </div>
            </div>
            <p className="text-navy-200 text-sm leading-relaxed">
              {isAr
                ? 'شاليهات وفلل فاخرة لتجارب لا تُنسى على شواطئ خيران، الكويت.'
                : 'Luxury chalets and villas for unforgettable experiences on the shores of Khairan, Kuwait.'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gold-400 mb-4">{isAr ? 'روابط سريعة' : 'Quick Links'}</h3>
            <ul className="space-y-2.5">
              {[
                { to: '/', label: t('nav.home') },
                { to: '/chalets', label: t('nav.chalets') },
                { to: '/login', label: t('nav.login') },
                { to: '/register', label: t('nav.register') },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-navy-200 hover:text-gold-400 text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gold-400 mb-4">{isAr ? 'تواصل معنا' : 'Contact'}</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-navy-200">
                <MapPin size={15} className="text-gold-400 flex-shrink-0 mt-0.5" />
                GrandeBeach Khairan, Kuwait
              </li>
              <li className="flex items-center gap-2.5 text-sm text-navy-200">
                <Phone size={15} className="text-gold-400 flex-shrink-0" />
                {WHATSAPP_NUMBER}
              </li>
              <li className="flex items-center gap-2.5 text-sm text-navy-200">
                <Mail size={15} className="text-gold-400 flex-shrink-0" />
                info@grandebeach.com.kw
              </li>
            </ul>
          </div>

          {/* WhatsApp Support */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gold-400 mb-4">{isAr ? 'الدعم' : 'Support'}</h3>
            <p className="text-navy-200 text-sm mb-4">{isAr ? 'تحتاج مساعدة؟ تواصل معنا عبر واتساب 24/7.' : 'Need help? Chat with us on WhatsApp 24/7.'}</p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent('Hello, I need help with my booking at GrandeBeach Khairan.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
            >
              <WhatsAppIcon size={16} />
              {isAr ? 'دعم واتساب' : 'WhatsApp Support'}
            </a>
          </div>
        </div>

        <div className="border-t border-navy-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-navy-400 text-sm">
            {isAr ? `© ${year} غراند بيتش خيران الكويت. جميع الحقوق محفوظة.` : `© ${year} GrandeBeach Khairan Kuwait. All rights reserved.`}
          </p>
          <div className="flex items-center gap-4 text-xs text-navy-400">
            <Link to="/privacypolicy" className="hover:text-gold-400 transition-colors">
              {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </Link>
            <span className="text-navy-700">|</span>
            <span>{isAr ? 'مدفوعات آمنة بواسطة Tap | Deema | Taly' : 'Secure payments by Tap | Deema | Taly'}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
