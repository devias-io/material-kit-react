import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function enviarEmailCredenciais(
  email: string, 
  nome: string, 
  senha: string
): Promise<void> {
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.fatosdabolsa.com.br';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bem-vindo ao Fatos da Bolsa</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          margin: 0; 
          padding: 40px 20px;
          line-height: 1.6;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 20px; 
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header { 
          background: #010101;
          padding: 40px 30px;
          text-align: center;
          color: white;
          margin: 0;
          border: none;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .welcome-text {
          color: #2d3748;
          font-size: 16px;
          margin-bottom: 30px;
          text-align: center;
        }
        .welcome-text h2 {
          color: #4a5568;
          font-size: 22px;
          margin: 0 0 15px 0;
          font-weight: 600;
        }
        .credentials { 
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          padding: 30px; 
          border-radius: 15px; 
          margin: 30px 0;
          border: 1px solid #e2e8f0;
          position: relative;
          overflow: hidden;
        }

        .credentials h3 {
          color: #2d3748;
          font-size: 20px;
          margin: 0 0 20px 0;
          font-weight: 700;
          text-align: center;
        }
        .credential-item { 
          margin: 15px 0;
          background: white;
          padding: 15px;
          border-radius: 10px;
          border: 2px solid #e2e8f0;
        }
        .credential-label {
          color: #4a5568;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 8px;
          display: block;
        }
        .credential-value {
          background: #f8fafc;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #cbd5e0;
          font-size: 15px;
          color: #1a202c;
          font-weight: 600;
          word-break: break-all;
          display: block;
          width: 100%;
        }
        .login-button { 
          display: block;
          background: linear-gradient(135deg, #010101 0%, #1a1a1a 100%);
          color: white !important; 
          padding: 18px 40px; 
          text-decoration: none; 
          border-radius: 8px; 
          margin: 30px auto;
          text-align: center;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          max-width: 280px;
          transition: all 0.3s ease;
        }
        .info-box { 
          background: #f8f9fa;
          border-left: 4px solid #4bf700;
          padding: 25px; 
          margin: 30px 0;
          border-radius: 8px;
        }
        .info-box h4 {
          color: #1a1a1a;
          margin: 0 0 15px 0;
          font-size: 17px;
          font-weight: 600;
        }
        .info-list {
          color: #4a5568;
          font-size: 15px;
          line-height: 1.8;
          margin: 0;
          padding-left: 20px;
        }
        .info-list li {
          margin-bottom: 10px;
        }
        .info-list strong {
          color: #1a1a1a;
        }
        .resources-section {
          background: linear-gradient(135deg, #f9f9f9 0%, #f5f5f5 100%);
          padding: 25px;
          border-radius: 12px;
          margin: 30px 0;
          border-left: 5px solid #4bf700;
        }
        .resources-section h4 {
          color: #010101;
          margin: 0 0 15px 0;
          font-size: 18px;
          font-weight: 700;
        }
        .resources-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-top: 15px;
        }
        .resource-item {
          background: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #e0e0e0;
        }
        .resource-item strong {
          color: #010101;
          display: block;
          margin-bottom: 5px;
          font-size: 15px;
        }
        .resource-item span {
          color: #4a5568;
          font-size: 13px;
        }
        .footer { 
          background: #010101;
          color: white;
          padding: 30px;
          text-align: center;
        }
        .footer h4 {
          color: white;
          margin: 0 0 15px 0;
          font-size: 18px;
          font-weight: 600;
        }
        .footer p {
          margin: 8px 0;
          opacity: 0.8;
          font-size: 14px;
        }
        .logo {
          width: 120px;
          height: 120px;
          margin: 0 auto 20px auto;
          display: block;
          border-radius: 50%;
        }
        
        @media only screen and (max-width: 600px) {
          body { padding: 20px 10px; }
          .container { margin: 0; border-radius: 10px; }
          .content, .header, .footer { padding: 20px; }
          .credentials { padding: 20px; }
          .credential-item { padding: 12px; }
          .resources-grid { 
            grid-template-columns: 1fr; 
            gap: 10px;
          }
          .login-button {
            padding: 14px 24px;
            font-size: 16px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <img src="${loginUrl}/assets/avatar-36.png" alt="Fatos da Bolsa Logo" class="logo" />
          <h1>Bem-vindo ao Fatos da Bolsa!</h1>
          <p>Sua jornada de sucesso nos investimentos começa agora</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <div class="welcome-text">
            <h2>Olá, ${nome}! Tudo bem?</h2>
            <p><strong>Parabéns e seja bem-vindo(a) ao Fatos da Bolsa!</strong></p>
            <p>Estamos muito felizes em ter você conosco.</p>
            <p>Na plataforma você terá acesso a <strong>todos os conteúdos disponíveis</strong> para a sua assinatura.</p>
          </div>
          
          <!-- Credenciais de Acesso -->
          <div class="credentials">
            <h3>🔑 Seus Dados de Acesso</h3>
            
            <div class="credential-item">
              <span class="credential-label">🌐 Área de Membros:</span>
              <span class="credential-value">${loginUrl}/auth/sign-in</span>
            </div>
            
            <div class="credential-item">
              <span class="credential-label">📧 Login:</span>
              <span class="credential-value">${email}</span>
            </div>
            
            <div class="credential-item">
              <span class="credential-label">🔒 Senha:</span>
              <span class="credential-value">${senha}</span>
            </div>
          </div>
          
          <!-- Botão de Acesso -->
          <a href="${loginUrl}/auth/sign-in" class="login-button" style="background: #010101 !important; color: white !important; text-decoration: none; display: block;">
            🚀 Acessar Minha Conta
          </a>
          
          
          <!-- Informações Importantes -->
          <div class="info-box">
            <h4>💡 Próximos Passos</h4>
            <ul class="info-list">
              <li><strong>Faça login</strong> com seu email e senha temporária</li>
              <li><strong>Altere sua senha</strong> no primeiro acesso</li>
              <li><strong>Complete seu perfil</strong> e explore a plataforma</li>
            </ul>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <h4>🤝 Conte conosco para o que precisar!</h4>
          <p><strong>Atenciosamente,</strong></p>
          <p><strong>Equipe Fatos da Bolsa</strong></p>
          <p style="margin-top: 20px; font-size: 12px; opacity: 0.7;">
            © 2025 Fatos da Bolsa - Todos os direitos reservados<br>
            Este email foi enviado automaticamente, não responda a esta mensagem.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Equipe Fatos da Bolsa" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: '🎉 Bem-vindo ao Fatos da Bolsa - Seu acesso foi liberado!',
    html: htmlContent
  });
}

export async function enviarEmailResetSenha(
  email: string, 
  nome: string, 
  token: string
): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/${token}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); 
          margin: 0; 
          padding: 40px 20px; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 20px; 
          overflow: hidden; 
          box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
        }
        .header { 
          background: #010101; 
          padding: 40px 30px; 
          text-align: center; 
          color: white; 
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .content { 
          padding: 40px 30px; 
          text-align: center; 
        }
        .content h2 {
          color: #2d3748;
          font-size: 24px;
          margin-bottom: 15px;
        }
        .content p {
          color: #4a5568;
          font-size: 16px;
          line-height: 1.6;
          margin: 10px 0;
        }
        .button { 
          display: inline-block; 
          background: #010101; 
          color: white !important; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 12px; 
          margin: 20px 0; 
          font-weight: 700; 
          border: 2px solid #4bf700;
          font-size: 18px;
        }
        .warning {
          background: #fef5e7;
          border-left: 4px solid #f6ad55;
          padding: 20px;
          border-radius: 8px;
          margin-top: 30px;
        }
        .warning p {
          color: #744210;
          font-size: 14px;
          margin: 5px 0;
        }
        .footer { 
          background: #010101; 
          color: white; 
          padding: 30px; 
          text-align: center; 
        }
        .footer p {
          margin: 5px 0;
          opacity: 0.8;
        }
        @media only screen and (max-width: 600px) {
          body { padding: 20px 10px; }
          .content, .header, .footer { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔑 Redefinir Senha</h1>
        </div>
        <div class="content">
          <h2>Olá, ${nome}!</h2>
          <p>Recebemos uma solicitação para redefinir sua senha no Fatos da Bolsa.</p>
          <p>Clique no botão abaixo para criar uma nova senha:</p>
          
          <a href="${resetUrl}" class="button">Redefinir Minha Senha</a>
          
          <div class="warning">
            <p><strong>⚠️ Atenção:</strong> Este link é válido por apenas 2 horas.</p>
            <p>Se você não solicitou esta alteração, ignore este email.</p>
          </div>
        </div>
        <div class="footer">
          <p><strong>Equipe Fatos da Bolsa</strong></p>
          <p style="font-size: 12px; opacity: 0.7; margin-top: 10px;">© 2025 Fatos da Bolsa</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Equipe Fatos da Bolsa" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: '🔑 Redefinir sua senha - Fatos da Bolsa',
    html: htmlContent
  });
}
