const FLAGS = {
  fr:
    '<rect width="8" height="16" fill="#0055a4"/>' +
    '<rect x="8" width="8" height="16" fill="#f4f6f4"/>' +
    '<rect x="16" width="8" height="16" fill="#ef4135"/>',

  en:
    '<rect width="24" height="16" fill="#012169"/>' +
    '<path d="M0 0 24 16 M24 0 0 16" stroke="#f4f6f4" stroke-width="3.4"/>' +
    '<path d="M0 0 12 8 M12 8 24 16 M24 0 12 8 M12 8 0 16" stroke="#c8102e" stroke-width="1.8"/>' +
    '<path d="M12 0V16 M0 8H24" stroke="#f4f6f4" stroke-width="5.4"/>' +
    '<path d="M12 0V16 M0 8H24" stroke="#c8102e" stroke-width="3.2"/>',

  es:
    '<rect width="24" height="16" fill="#aa151b"/>' +
    '<rect y="4" width="24" height="8" fill="#f1bf00"/>',

  de:
    '<rect width="24" height="16" fill="#111111"/>' +
    '<rect y="5.34" width="24" height="5.33" fill="#dd0000"/>' +
    '<rect y="10.67" width="24" height="5.33" fill="#ffce00"/>',

  pt:
    '<rect width="24" height="16" fill="#da291c"/>' +
    '<rect width="9.6" height="16" fill="#046a38"/>' +
    '<circle cx="9.6" cy="8" r="3.5" fill="#ffe000"/>' +
    '<circle cx="9.6" cy="8" r="2.3" fill="#da291c"/>' +
    '<circle cx="9.6" cy="8" r="1" fill="#f4f6f4"/>',

  ru:
    '<rect width="24" height="16" fill="#f4f6f4"/>' +
    '<rect y="5.34" width="24" height="5.33" fill="#0039a6"/>' +
    '<rect y="10.67" width="24" height="5.33" fill="#d52b1e"/>',

  tr:
    '<rect width="24" height="16" fill="#e30a17"/>' +
    '<circle cx="9.4" cy="8" r="4.2" fill="#f4f6f4"/>' +
    '<circle cx="10.9" cy="8" r="3.4" fill="#e30a17"/>' +
    '<path d="M15.6 8 12.9 8.9 14.6 6.6 14.6 9.4 12.9 7.1Z" fill="#f4f6f4"/>',
}

export function flagMarkup(id) {
  const parts = FLAGS[id] || FLAGS.en
  return '<svg class="flag-img" viewBox="0 0 24 16" aria-hidden="true">' + parts + '</svg>'
}
