# 📝 Changelog - Portal RAG Chatbots Educativos

## [2.0.0] - 2026-02-13 - Refactorización Completa

### 🔴 CAMBIOS CRÍTICOS (Breaking Changes)

#### 1. **Dimensionalidad de Embeddings**
- **Antes:** `vector(1536)` - Compatible con OpenAI text-embedding-ada-002
- **Ahora:** `vector(384)` - Compatible con BAAI/bge-small-en-v1.5
- **Impacto:** Requiere migración SQL y re-indexación de contenido existente
- **Archivo:** `database/migration_fix_dimensions.sql`

#### 2. **Encriptación de Credenciales LLM**
- **Nueva funcionalidad:** Sistema de encriptación AES-256-GCM
- **Impacto:** Requiere `MASTER_ENCRYPTION_KEY` en variables de entorno
- **Archivo:** `lib/encryption.ts`
- **SDD Referencia:** Sección 18

---

### ✨ Nuevas Características

#### Seguridad

1. **Anti-Prompt Injection Robusto**
   - Sistema de capas inmutables (System → Context → User)
   - Sanitización de custom prompts
   - Prevención de manipulación de instrucciones
   - **Archivo:** `lib/rag.ts:37-95`
   - **SDD Referencia:** Sección 10

2. **Validación de Dominios Autorizados**
   - Verificación de referer en `/api/chat`
   - Configuración por organización
   - **Archivo:** `app/api/chat/route.ts:48-66`
   - **SDD Referencia:** Sección 15.3

3. **Credenciales LLM por Organización**
   - Desencriptación en memoria (nunca en logs)
   - Fallback a credenciales globales
   - Soporte multi-proveedor (Groq, OpenAI, Anthropic)
   - **Archivo:** `lib/llm.ts`
   - **SDD Referencia:** Sección 18

#### RAG & Embeddings

4. **Chunking Inteligente**
   - Tamaño: 400-800 tokens (configurable)
   - Overlap: 10-15% (default 12.5%)
   - Prioridad jerárquica: Títulos → Párrafos → Oraciones
   - Preserva coherencia semántica
   - **Archivo:** `lib/chunking.ts`
   - **SDD Referencia:** Sección 3.2

5. **Modelo de Embeddings Local**
   - FastEmbed con BAAI/bge-small-en-v1.5
   - Sin costos de API
   - Dimensión: 384
   - Velocidad: ~10ms por embedding
   - **Archivo:** `lib/embeddings.ts`

#### Costos & Límites

6. **Cálculo Real de Costos**
   - Precio por token según modelo
   - Registro en `chat_session.costo_estimado`
   - Soporte para múltiples modelos
   - **Archivo:** `lib/llm.ts:79-98`
   - **SDD Referencia:** Sección 16.3

7. **Control de Límites Mejorado**
   - Validación mensual de tokens y mensajes
   - Bloqueo automático (HTTP 429)
   - Configuración por organización
   - **Archivo:** `lib/cost-control.ts`

#### UX & UI

8. **Chat Interface Rediseñada**
   - Diseño moderno con gradientes
   - Sugerencias de preguntas iniciales
   - Indicador de escritura animado
   - Manejo de errores mejorado
   - Responsive design
   - **Archivo:** `components/chat-interface.tsx`

9. **Componentes UI Reutilizables**
   - Card, Button, Input, Textarea, Badge
   - Estilos consistentes con Tailwind
   - **Directorio:** `components/ui/`

---

### 🔧 Mejoras

#### Endpoints API

- **`POST /api/chat`**
  - Validación de dominios autorizados
  - Control de límites antes de procesar
  - Credenciales LLM por organización
  - Cálculo de costos real
  - Configuración de temperatura y max_tokens desde DB

- **`POST /api/ingest`**
  - Chunking mejorado
  - Estimación de tokens más precisa
  - Validación de permisos reforzada

#### Base de Datos

- **Función RPC `match_documents`**
  - Actualizada a `vector(384)`
  - Filtro por `activo = true`
  - Optimización de queries

---

### 📦 Archivos Nuevos

```
lib/
  ├── encryption.ts          # Módulo de encriptación AES-256-GCM
  └── (actualizados: llm.ts, rag.ts, chunking.ts, cost-control.ts)

components/
  ├── ui/
  │   ├── card.tsx           # Componente Card
  │   ├── button.tsx         # Componente Button
  │   ├── input.tsx          # Componente Input
  │   ├── textarea.tsx       # Componente Textarea
  │   └── badge.tsx          # Componente Badge
  └── chat-interface.tsx     # Rediseñado completamente

database/
  └── migration_fix_dimensions.sql  # Migración de embeddings

DEPLOYMENT_GUIDE.md         # Guía completa de despliegue
CHANGELOG.md                # Este archivo
.env.example                # Plantilla de variables de entorno
```

---

### 🐛 Correcciones de Bugs

1. **Dimensionalidad incompatible entre embeddings y DB**
   - Fix: Alineado a 384 dimensiones
   - Estado: ✅ Resuelto

2. **Credenciales LLM en texto plano**
   - Fix: Sistema de encriptación AES-256
   - Estado: ✅ Resuelto

3. **Prompt injection vulnerable**
   - Fix: Sistema de capas inmutables
   - Estado: ✅ Resuelto

4. **Chunking sin respetar overlap porcentual**
   - Fix: Overlap configurable (10-15%)
   - Estado: ✅ Resuelto

5. **Costo estimado siempre en 0**
   - Fix: Cálculo real por modelo
   - Estado: ✅ Resuelto

---

### ⚙️ Variables de Entorno

#### Nuevas (Requeridas)

```bash
MASTER_ENCRYPTION_KEY=your_32_char_random_string  # CRÍTICO
```

#### Opcionales (Proveedores LLM)

```bash
GROQ_API_KEY=...           # Fallback global
OPENAI_API_KEY=...         # Opcional
ANTHROPIC_API_KEY=...      # Opcional
```

---

### 📊 Comparación Antes/Después

| Característica | Antes | Después |
|----------------|-------|---------|
| **Dimensión embeddings** | 1536 | 384 |
| **Modelo embeddings** | API externa (costo) | Local FastEmbed (gratis) |
| **Encriptación credentials** | ❌ No | ✅ AES-256-GCM |
| **Anti-prompt injection** | ⚠️ Básico | ✅ Robusto |
| **Chunking** | Simple | Inteligente (jerárquico) |
| **Cálculo costos** | ❌ Hardcoded 0 | ✅ Real por modelo |
| **Validación dominios** | ❌ No | ✅ Sí |
| **UX Chat** | ⚠️ Básica | ✅ Moderna |

---

### 🔄 Migración desde v1.x

#### Pasos Obligatorios

1. **Actualizar variables de entorno**
   ```bash
   # Generar MASTER_ENCRYPTION_KEY
   openssl rand -base64 32

   # Agregar a .env.local
   echo "MASTER_ENCRYPTION_KEY=generated_key_here" >> .env.local
   ```

2. **Ejecutar migración SQL**
   ```sql
   -- En Supabase SQL Editor
   -- Ejecutar: database/migration_fix_dimensions.sql
   ```

3. **Re-indexar contenido existente**
   - Eliminar embeddings antiguos (dimensión 1536)
   - Re-subir contenido desde panel admin
   - Los nuevos embeddings serán 384 dimensiones

4. **Configurar credenciales LLM por organización**
   - Desde panel admin → Configuración
   - Ingresar API keys (se encriptarán automáticamente)

---

### 📚 Documentación

- [Guía de Despliegue](./DEPLOYMENT_GUIDE.md)
- [SDD v1.2](./sdd_portal_chatbots_educativos_rag_v_1_2.md)

---

### 🙏 Créditos

- **Especificación:** SDD Portal RAG v1.2
- **Framework:** Next.js 16, Supabase, Vercel AI SDK
- **Embeddings:** FastEmbed (BAAI/bge-small-en-v1.5)
- **LLM:** Groq (default), OpenAI, Anthropic

---

### 📞 Soporte

Si encuentras problemas durante la migración:
1. Revisa [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) sección Troubleshooting
2. Verifica logs de Supabase
3. Confirma variables de entorno en Vercel/Local

---

**Estado del Proyecto:** ✅ Listo para Producción

**Última actualización:** 2026-02-13
