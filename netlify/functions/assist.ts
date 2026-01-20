import OpenAI from 'openai';
import { Handler } from '@netlify/functions';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const handler: Handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Data Inválida' };
    }

    try {
        const { message } = JSON.parse(event.body || '{}');

        if (!message) {
            return { statusCode: 400, body: 'Data Invalida' };
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `Você é o assistente virtual da Maju Personalizados. 
          Sua função é ajudar o cliente a preencher um formulário de briefing para criação de um e-commerce.
          Seja cordial, profissional e use emojis ocasionalmente.
          O usuário pode ter dúvidas sobre termos técnicos de e-commerce, branding ou sobre o que escrever nos campos.
          Ajude-os a elaborar respostas claras e completas para a equipe de design.
          
          Contexto da Maju Personalizados:
          - E-commerce de produtos personalizados.
          - Foco em identidade visual e experiência do usuário.
          `
                },
                { role: 'user', content: message }
            ],
        });

        const responseContent = completion.choices[0].message.content;

        return {
            statusCode: 200,
            body: JSON.stringify({ response: responseContent }),
        };
    } catch (error) {
        console.error('Error calling OpenAI:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to process request' }),
        };
    }
};
