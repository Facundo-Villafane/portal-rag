# Asistente de Billetaje y Reservas

Chatbot academico simplificado para una sola materia. Esta version no usa Supabase en el flujo publico: el chat lee el material desde archivos locales Markdown o HTML.

## Como funciona

- `/` muestra directamente el chatbot de la materia.
- `/embed/billetaje-y-reservas` muestra la version embebible para Moodle u otro LMS.
- `/api/chat` recupera contexto desde Markdown local y llama al modelo configurado.
- Las rutas legacy del portal administrativo redirigen a `/`.

## Configuracion

Variables recomendadas:

```bash
GROQ_API_KEY=...
CHAT_MODEL=llama-3.3-70b-versatile
CHAT_TEMPERATURE=0.3
RAG_TOP_K=8
RAG_SCORE_THRESHOLD=0.08
KNOWLEDGE_DIR=content/knowledge
```

Tambien se puede usar OpenAI si `CHAT_MODEL` es un modelo `gpt-*` y se define `OPENAI_API_KEY`.

## Actualizar material

1. Editar o agregar archivos `.md`, `.html` o `.htm` en `content/knowledge`.
2. Reiniciar el servidor si esta corriendo en desarrollo.
3. Ejecutar `npm run build` antes de desplegar.

## Desarrollo

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Validacion

```bash
npm run lint
npm run build
```
