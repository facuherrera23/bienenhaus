# Guía para configurar MercadoLibre

## Requisitos previos

- Tener una cuenta en MercadoLibre (www.mercadolibre.com.ar)
- Tener la cuenta configurada como **inmobiliaria** y un **paquete de publicaciones para inmuebles** activo (si no lo tenés, contactá a soporte de ML)

---

## Paso 1: Crear una App en MercadoLibre Developers

1. Entrá a https://developers.mercadolibre.com.ar
2. Iniciá sesión con tu cuenta de MercadoLibre
3. Andá a **"Mis aplicaciones"** (arriba a la derecha)
4. Hacé click en **"Crear aplicación"**
5. Completá:
   - **Nombre de la aplicación:** `Bienenhaus Propiedades`
   - **Descripción:** `Integración para publicar propiedades inmobiliarias`
   - **Sitio:** `Mercado Libre Argentina`
   - **Tipo de aplicación:** `Aplicación de venta`
   - **Redireccionamiento:** `https://developers.mercadolibre.com.ar`
   - **OAuth:** marcá **Authorization Code**

6. Aceptá los términos y guardá

7. Te van a mostrar dos datos. **Guardalos**, los vamos a necesitar:
   - **Client ID** (un número)
   - **Client Secret** (una clave larga)

---

## Paso 2: Generar el código de autorización

1. En el navegador, abrí esta URL (reemplazá `TU_CLIENT_ID` por el número del paso anterior):

```
https://auth.mercadolibre.com.ar/authorization?
response_type=code&client_id=TU_CLIENT_ID&
redirect_uri=https://developers.mercadolibre.com.ar
```

2. Iniciá sesión con tu cuenta de MercadoLibre (la de la inmobiliaria)
3. Hacé click en **"Permitir"** para autorizar la app
4. El navegador te va a redirigir a una URL parecida a esta:

```
https://developers.mercadolibre.com.ar/?code=TG-xxxxxxxxxxxxxxxxxx-xxxxxx
```

5. Copiá todo el código que aparece después de `?code=` (es una cadena larga que empieza con `TG-`)

---

## Paso 3: Canjear el código por tokens

Mandame por privado:

1. **Client ID** (de la app que creaste)
2. **Client Secret** (de la app que creaste)
3. **El código** que copiaste en el paso anterior (empieza con `TG-`)

Con eso yo genero el access token y configuro todo del lado del sistema.

---

## Paso 4 (opcional): Si publicás en otra ciudad

Por defecto configuramos Córdoba Capital. Si publicás en otra ciudad o provincia, decime cuál y busco los códigos correspondientes.

---

## Resumen de lo que necesito que me mandes

| Dato | Dónde lo encontrás |
|------|-------------------|
| Client ID | Paso 1 - App creada |
| Client Secret | Paso 1 - App creada |
| Código de autorización | Paso 2 - URL después de autorizar |

Cualquier duda me consultás. El proceso lleva 10 minutos.
