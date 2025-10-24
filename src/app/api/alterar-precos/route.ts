
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    // Validar o corpo da requisição
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: 'Payload inválido. Esperado um array de produtos.' }, { status: 400 });
    }

    const externalApiResponse = await fetch('https://pricetrack-api.onrender.com/api/products/update_precos', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!externalApiResponse.ok) {
      // Tenta obter o corpo do erro da API externa, se houver
      const errorBody = await externalApiResponse.text();
      return NextResponse.json(
        { error: `API externa retornou erro: ${externalApiResponse.status}`, details: errorBody },
        { status: externalApiResponse.status }
      );
    }

    const responseData = await externalApiResponse.json();
    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Erro no Route Handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no servidor';
    return NextResponse.json({ error: 'Erro interno do servidor', details: errorMessage }, { status: 500 });
  }
}
