import React from 'react';

export default function HeroSection({ title, subtitle, icon, children, actions }) {
  return (
    <section className="w-full py-12 px-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg mb-8 animate-fade-in">
      <div className="max-w-3xl mx-auto flex flex-col items-center text-center gap-4">
        {icon && <div className="text-5xl mb-2">{icon}</div>}
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">{title}</h1>
        {subtitle && <p className="text-lg text-gray-600 mb-4">{subtitle}</p>}
        {actions && <div className="flex flex-wrap gap-4 justify-center mb-4">{actions}</div>}
        {children}
      </div>
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s cubic-bezier(.4,0,.2,1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </section>
  );
}
