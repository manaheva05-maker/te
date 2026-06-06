const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SHINKEN</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0F;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0F;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#12121A;border-radius:16px;border:1px solid #2A2A3A;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#E63946,#9D0208);padding:32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:6px;font-weight:900;">⛩️ SHINKEN</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;color:#E0E0E0;line-height:1.7;font-size:15px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #2A2A3A;text-align:center;">
            <p style="margin:0;color:#666;font-size:12px;">© 2025 SHINKEN · Le tournoi des guerriers anime</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const sendVerificationEmail = async (email, username, token, lang = 'fr') => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  const subject = lang === 'fr' ? '⛩️ Confirme ton email SHINKEN' : '⛩️ Verify your SHINKEN email';
  const html = baseTemplate(`
    <h2 style="color:#E63946;margin-top:0;">
      ${lang === 'fr' ? `Salut ${username} 👋` : `Hey ${username} 👋`}
    </h2>
    <p>${lang === 'fr'
      ? 'Tu es à un pas de rejoindre l\'arène des guerriers. Confirme ton email pour activer ton compte.'
      : 'You\'re one step away from joining the warriors arena. Confirm your email to activate your account.'
    }</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${url}" style="background:linear-gradient(135deg,#E63946,#9D0208);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:900;font-size:15px;letter-spacing:2px;display:inline-block;">
        ${lang === 'fr' ? '✅ CONFIRMER MON EMAIL' : '✅ VERIFY MY EMAIL'}
      </a>
    </div>
    <p style="color:#888;font-size:13px;">
      ${lang === 'fr'
        ? 'Ce lien expire dans 24 heures. Si tu n\'as pas créé de compte, ignore cet email.'
        : 'This link expires in 24 hours. If you did not create an account, ignore this email.'
      }
    </p>
  `);

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || 'SHINKEN <noreply@shinken.app>',
    to: email,
    subject,
    html,
  });
};

const sendPasswordResetEmail = async (email, username, token, lang = 'fr') => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  const subject = lang === 'fr' ? '⛩️ Réinitialisation de ton mot de passe' : '⛩️ Password Reset';
  const html = baseTemplate(`
    <h2 style="color:#E63946;margin-top:0;">
      ${lang === 'fr' ? `Réinitialisation demandée` : `Password Reset Requested`}
    </h2>
    <p>${lang === 'fr'
      ? `Salut ${username}, tu as demandé à réinitialiser ton mot de passe.`
      : `Hey ${username}, you requested a password reset.`
    }</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${url}" style="background:linear-gradient(135deg,#E63946,#9D0208);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:900;font-size:15px;letter-spacing:2px;display:inline-block;">
        ${lang === 'fr' ? '🔑 RÉINITIALISER MON MOT DE PASSE' : '🔑 RESET MY PASSWORD'}
      </a>
    </div>
    <p style="color:#888;font-size:13px;">
      ${lang === 'fr'
        ? 'Ce lien expire dans 1 heure. Si tu n\'as pas fait cette demande, ignore cet email et change ton mot de passe immédiatement.'
        : 'This link expires in 1 hour. If you didn\'t request this, ignore this email and change your password immediately.'
      }
    </p>
  `);

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || 'SHINKEN <noreply@shinken.app>',
    to: email,
    subject,
    html,
  });
};

const sendWelcomeEmail = async (email, username, lang = 'fr') => {
  const subject = lang === 'fr' ? '⛩️ Bienvenue dans l\'arène SHINKEN !' : '⛩️ Welcome to SHINKEN Arena!';
  const html = baseTemplate(`
    <h2 style="color:#E63946;margin-top:0;">
      ${lang === 'fr' ? `⛩️ Bienvenue ${username} !` : `⛩️ Welcome ${username}!`}
    </h2>
    <p>${lang === 'fr'
      ? 'Ton compte est activé. Tu peux maintenant rejoindre les duels, les tournois et les clans !'
      : 'Your account is activated. You can now join duels, tournaments and clans!'
    }</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      ${['🥋 Duels 1v1', '🏆 Tournois', '⚔️ Clans', '🎓 Sensei IA'].map(f => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #2A2A3A;color:#E0E0E0;">${f}</td>
          <td style="padding:8px 0;border-bottom:1px solid #2A2A3A;color:#E63946;text-align:right;">✓</td>
        </tr>
      `).join('')}
    </table>
  `);

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || 'SHINKEN <noreply@shinken.app>',
    to: email,
    subject,
    html,
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail };
