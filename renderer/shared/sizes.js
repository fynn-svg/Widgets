// Grössen-Katalog (gemeinsam für Auswahl, Rechtsklick-Menü und Hauptprozess)
(function (g) {
  g.WP_SIZES = {
    dims: { XS: [120, 120], S: [170, 170], M: [360, 170], L: [360, 360], XL: [540, 360] },
    names: { de: { XS: 'Sehr klein', S: 'Klein', M: 'Mittel', L: 'Gross', XL: 'Sehr gross' }, en: { XS: 'Very small', S: 'Small', M: 'Medium', L: 'Large', XL: 'Extra large' }, ru: { XS: 'Очень маленький', S: 'Маленький', M: 'Средний', L: 'Большой', XL: 'Очень большой' } },
    // Nur Grössen, die das jeweilige Widget wirklich sinnvoll darstellen kann
    supported: {
      'clock-digital': ['XS', 'S', 'M'], 'clock-analog': ['XS', 'S', 'M', 'L'], 'world-clock': ['S', 'M', 'L'], weather: ['XS', 'S', 'M', 'L', 'XL'], sunset: ['S', 'M'], calendar: ['XS', 'S', 'M', 'L', 'XL'],
      reminders: ['XS', 'S', 'M', 'L', 'XL'], todo: ['S', 'M', 'L', 'XL'], shopping: ['S', 'M', 'L'], notes: ['S', 'M', 'L', 'XL'], photos: ['S', 'M', 'L', 'XL'], battery: ['XS', 'S', 'M'], stocks: ['XS', 'S', 'M', 'L'],
      news: ['S', 'M', 'L', 'XL'], music: ['XS', 'S', 'M', 'L'], contacts: ['S', 'M'], screentime: ['S', 'M', 'L'], search: ['M'], shortcut: ['S'], calculator: ['M', 'L'], system: ['S', 'M', 'L'], sysinfo: ['S', 'M'], network: ['S', 'M'],
      temperature: ['XS', 'S'], weekplan: ['L', 'XL'], dayplan: ['M', 'L', 'XL'], countdown: ['XS', 'S', 'M'], habits: ['S', 'M', 'L'], goals: ['M', 'L'], eisenhower: ['L', 'XL'], quote: ['S', 'M', 'L'], custom: ['XS', 'S', 'M', 'L', 'XL'],
      cpu: ['S', 'M'], ram: ['S', 'M'], gpu: ['S', 'M'], disk: ['S', 'M'], netactivity: ['S', 'M'], pomodoro: ['S', 'M', 'L'], clipboard: ['M', 'L'], quicksettings: ['S', 'M', 'L'], agenda: ['M', 'L', 'XL'], focus: ['S', 'M'],
      'fy-clock': [], 'fy-analog': [], 'fy-calendar': [], 'fy-weather': [], 'fy-todos': [], 'fy-notes': [], 'fy-system': []
    },
    of(type) { return this.supported[type] || ['S', 'M', 'L', 'XL']; }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = g.WP_SIZES;
})(typeof window !== 'undefined' ? window : globalThis);
