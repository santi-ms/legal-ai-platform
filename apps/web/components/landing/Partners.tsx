"use client";

const partners = [
  { name: "Marval O'Farrell", logo: null },
  { name: "Beccar Varela", logo: null },
  { name: "Pérez Alati", logo: null },
  { name: "Mitrani Caballero", logo: null },
];

export function Partners() {
  return (
    <section className="py-12 border-y border-primary/5 bg-slate-50/50 dark:bg-slate-900/20">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
          Utilizado por los estudios más prestigiosos del país
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all">
          {partners.map((partner) => (
            <div key={partner.name} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-300 dark:bg-slate-700 rounded"></div>
              <span className="font-bold text-lg text-slate-900 dark:text-slate-100">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}



