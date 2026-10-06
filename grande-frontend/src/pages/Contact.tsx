import { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';

export function Contact() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('nav.contact')}</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          We'd love to hear from you. Reach out and we'll get back to you shortly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact info */}
        <div className="flex flex-col gap-8">
          {[
            { icon: Phone, label: 'Phone', value: '+965 9097 6666' },
            { icon: Mail, label: 'Email', value: 'info@grandebeach.com.kw' },
            { icon: MapPin, label: 'Address', value: 'GrandeBeach Khairan, Kuwait' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-gold-50 flex items-center justify-center flex-shrink-0">
                <Icon className="text-gold-500" size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-gray-800 font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        {sent ? (
          <div className="flex flex-col items-center justify-center bg-gold-50 rounded-2xl p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-gold-500 flex items-center justify-center mb-4">
              <Mail className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h2>
            <p className="text-gray-500">We'll get back to you as soon as possible.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="Your name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="+965 5xxx xxxx"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                placeholder="you@email.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Message</label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
                placeholder="How can we help you?"
              />
            </div>
            <Button type="submit" size="lg">Send Message</Button>
          </form>
        )}
      </div>
    </div>
  );
}
