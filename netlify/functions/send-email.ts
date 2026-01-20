import { Handler } from '@netlify/functions';
import nodemailer from 'nodemailer';
import { BriefingData } from '../../src/types';

const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data: BriefingData = JSON.parse(event.body || '{}');

        // Required styling to match the screenshot roughly
        const labelStyle = "font-weight: bold; background-color: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 15px; display: block; width: 100%; color: #333;";
        const valueStyle = "padding: 10px; display: block; margin-bottom: 10px; color: #555; white-space: pre-wrap;";

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto;">
                <h2 style="color: #000; padding-bottom: 10px; border-bottom: 2px solid #eaeaea;">Novo Briefing Recebido - Maju Personalizados</h2>
                
                <div style="${labelStyle}">Qual seu nome?</div>
                <div style="${valueStyle}">${data.contactInfo.name || '-'}</div>

                <div style="${labelStyle}">Endereço de e-mail corporativo</div>
                <div style="${valueStyle}">${data.contactInfo.email || '-'}</div>
                
                <div style="${labelStyle}">Telefone / WhatsApp</div>
                <div style="${valueStyle}">${data.contactInfo.phone || '-'}</div>

                <div style="${labelStyle}">Descrição da Empresa e Expectativas para o E-commerce</div>
                <div style="${valueStyle}"><strong>Empresa:</strong> ${data.companyName}<br/><br/><strong>Expectativas:</strong><br/>${data.expectations || '-'}</div>

                <div style="${labelStyle}">Público-Alvo</div>
                <div style="${valueStyle}">${data.targetAudience || '-'}</div>

                <div style="${labelStyle}">Slogans e Termos Relacionados ao Propósito</div>
                <div style="${valueStyle}">${data.slogans || '-'}</div>

                <div style="${labelStyle}">Experiência Anterior com Produtos Personalizados</div>
                <div style="${valueStyle}">${data.priorExperience || '-'}</div>

                <div style="${labelStyle}">Lançamento do E-commerce em Evento Físico</div>
                <div style="${valueStyle}">${data.launchEventDate || '-'}</div>

                <div style="${labelStyle}">Envio de Materiais (Link)</div>
                <div style="${valueStyle}">${data.filesLink ? `<a href="${data.filesLink}">${data.filesLink}</a>` : 'Não informado'}</div>

                <div style="${labelStyle}">Arquivos Anexados</div>
                <div style="${valueStyle}">
                    ${data.visualIdentityFiles && data.visualIdentityFiles.length > 0
                ? data.visualIdentityFiles.map((f, i) => `<a href="${f}">Arquivo ${i + 1}</a>`).join('<br/>')
                : 'Nenhum arquivo anexado'}
                </div>

                <div style="${labelStyle}">Logotipo</div>
                <div style="${valueStyle}">${data.logoPreference === 'exclusive' ? 'Criar logotipo exclusivo' : 'Usar logotipo atual da marca'}</div>

                <div style="${labelStyle}">Paleta de Cores e Tipografia</div>
                <div style="${valueStyle}">${data.colorsTypography || '-'}</div>

                <div style="${labelStyle}">Referências de E-commerces</div>
                <div style="${valueStyle}">${data.reference_links || '-'}</div>

                 <div style="${labelStyle}">Data de Envio</div>
                <div style="${valueStyle}">${new Date().toLocaleString('pt-BR')}</div>
            </div>
        `;

        // Check for SMTP credentials
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error('Missing SMTP credentials');
            // We return 200 to frontend so we don't block the success screen, but log error server side
            // Or typically we want to alert. For now, assuming config will happen.
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server misconfiguration: Missing SMTP credentials' })
            };
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: 'kleberson.souza@majupersonalizados.com.br',
            cc: 'douglas@agencia2b.com.br',
            subject: `Novo Briefing Disponível: ${data.companyName}`,
            html: htmlContent,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Email sent successfully' }),
        };
    } catch (error) {
        console.error('Error sending email:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send email' }),
        };
    }
};

export { handler };
