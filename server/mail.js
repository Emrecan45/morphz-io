import { GAME_NAME, AUTHOR } from '../src/brand.js'

export const SUBJECT_LABELS = {
  bug: 'Bug report',
  idea: 'Suggestion',
  player: 'Player report',
  partner: 'Partnership',
  press: 'Press',
  other: 'Other',
}

const FONT = "Fredoka,Rubik,'Trebuchet MS',Verdana,Geneva,sans-serif"
const WEBFONT = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Rubik:wght@400;600;700&display=swap'
const SITE = 'https://morphz.io'

function shield(value) {
  return String(value === null || value === undefined ? '' : value).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  )
}

function name(head) {
  return (
    '<p style="margin:0 0 7px;font:700 17px ' + FONT + ';letter-spacing:0.5px;color:#a8e05f;">' +
    head +
    '</p>'
  )
}

function slot(inner, tone) {
  return (
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>' +
    '<td bgcolor="#101a15" style="padding:12px 15px;background:#101a15;border:2px solid #3d564a;border-radius:12px;' +
    'font:15px/1.65 ' + FONT + ';color:' + (tone === 'soft' ? '#7f9484' : '#f3f8ef') + ';">' +
    inner +
    '</td></tr></table>'
  )
}

function field(head, inner, tone) {
  return '<tr><td style="padding:0 0 16px;">' + name(head) + slot(inner, tone) + '</td></tr>'
}

function stamp(head, value) {
  return (
    '<tr><td style="padding:2px 0 20px;">' +
    name(head) +
    '<p style="margin:0;font:14px/1.5 ' + FONT + ';color:#c6d6c9;">' + value + '</p>' +
    '</td></tr>'
  )
}

function button(letter) {
  const href = 'mailto:' + letter.email + '?subject=' + encodeURIComponent('Re: ' + letter.subject)
  return (
    '<table cellpadding="0" cellspacing="0" role="presentation" align="center" style="margin:0 auto;"><tr>' +
    '<td bgcolor="#8cc93f" align="center" style="background:#8cc93f;' +
    'background-image:linear-gradient(#bdec78,#8cc93f);border-radius:13px;border-bottom:5px solid #4f8a20;">' +
    '<a href="' + shield(href) + '" style="display:block;padding:14px 36px;font:700 18px ' + FONT + ';' +
    'letter-spacing:0.7px;color:#14260a;text-decoration:none;">Answer</a>' +
    '</td></tr></table>'
  )
}

function footer() {
  return (
    '<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;"><tr>' +
    '<td align="center" style="padding:22px 26px 0;font:12px/1.75 ' + FONT + ';color:#5f7468;">' +
    'This is an automated notice sent by the ' + GAME_NAME + ' contact form.' +
    '</td></tr><tr><td align="center" style="padding:12px 26px 4px;font:11px/1.7 ' + FONT + ';color:#5f7468;">' +
    'Copyright ' + new Date().getUTCFullYear() + ' ' + GAME_NAME + ' - ' + AUTHOR + ' - All rights reserved.' +
    '</td></tr><tr><td align="center" style="padding:0 26px;font:11px/1.7 ' + FONT + ';color:#5f7468;">' +
    'The address and the message are kept only to answer this request, never sold and never shared.' +
    '</td></tr></table>'
  )
}

export function mailHtml(letter) {
  const logo = letter.logo || (letter.site || SITE) + '/logo.png'
  const body = shield(letter.message).split('\n').join('<br>')
  const teaser = shield(letter.message.replace(/\s+/g, ' ').slice(0, 110))
  const sender = letter.email
    ? '<a href="mailto:' + shield(letter.email) + '" style="color:#a8e05f;text-decoration:none;">' +
      shield(letter.email) +
      '</a>'
    : 'No address given'

  return (
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">' +
    '<title>' + shield(letter.subject) + '</title>' +
    '<link href="' + WEBFONT + '" rel="stylesheet">' +
    '<style>@import url(' + WEBFONT + ');</style></head>' +
    '<body style="margin:0;padding:0;">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">' + teaser + '</div>' +
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" ' +
    'style="padding:0 8px 10px;"><tr><td align="center">' +
    '<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;' +
    'background:#1e2c25;border:3px solid #3d564a;border-radius:22px;overflow:hidden;">' +
    '<tr><td align="center" bgcolor="#27382f" style="padding:26px 30px 20px;background:#27382f;' +
    'border-bottom:2px solid #3d564a;">' +
    '<img src="' + shield(logo) + '" width="280" alt="' + GAME_NAME + '" ' +
    'style="display:block;width:280px;max-width:82%;height:auto;border:0;outline:none;' +
    'font:800 26px ' + FONT + ';color:#a8e05f;">' +
    '<p style="margin:10px 0 0;font:700 16px ' + FONT + ';letter-spacing:0.4px;' +
    'color:#f3f8ef;">Contact form</p>' +
    '</td></tr>' +
    '<tr><td style="padding:24px 30px 4px;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation">' +
    field('Subject', shield(letter.label), '') +
    field('Email', sender, letter.email ? '' : 'soft') +
    field('Message', body, '') +
    stamp('Received', shield(letter.date)) +
    '</table></td></tr>' +
    (letter.email ? '<tr><td align="center" style="padding:0 30px 28px;">' + button(letter) + '</td></tr>' : '') +
    '</table>' +
    footer() +
    '</td></tr></table></body></html>'
  )
}

export function mailText(letter) {
  return (
    GAME_NAME + ' contact form\n\n' +
    'Subject: ' + letter.label + '\n' +
    'Email: ' + (letter.email || 'no address given') + '\n' +
    'Received: ' + letter.date + '\n\n' +
    'Message\n' +
    letter.message + '\n\n' +
    (letter.email
      ? 'Reply to this email to answer the player.\n'
      : 'This player left no address, there is no way to answer.\n') +
    '\nAutomated notice from the ' + GAME_NAME + ' contact form.\n'
  )
}
