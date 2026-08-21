/* ==========================================================================
   ¡Yo SÍ Lo Quiero! — JavaScript global
   Gestiona: menú lateral, banner de cookies, y animaciones de scroll.
   No depende de ninguna librería externa.
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     1. Menú lateral (panel deslizante desde la derecha)
     ------------------------------------------------------------------------ */
  function inicializarMenu() {
    var botonAbrir = document.querySelector("[data-accion='abrir-menu']");
    var botonCerrar = document.querySelector("[data-accion='cerrar-menu']");
    var panel = document.querySelector(".panel-menu");
    var fondo = document.querySelector(".fondo-oscurecido");

    if (!botonAbrir || !panel || !fondo) {
      return;
    }

    var elementosFocalizables = null;

    function obtenerElementosFocalizables() {
      return panel.querySelectorAll(
        "a[href], button:not([disabled])"
      );
    }

    function abrirMenu() {
      panel.setAttribute("data-abierto", "true");
      fondo.setAttribute("data-visible", "true");
      panel.setAttribute("aria-hidden", "false");
      botonAbrir.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";

      elementosFocalizables = obtenerElementosFocalizables();
      if (elementosFocalizables.length > 0) {
        elementosFocalizables[0].focus();
      }

      document.addEventListener("keydown", gestionarTeclado);
    }

    function cerrarMenu() {
      panel.setAttribute("data-abierto", "false");
      fondo.setAttribute("data-visible", "false");
      panel.setAttribute("aria-hidden", "true");
      botonAbrir.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";

      document.removeEventListener("keydown", gestionarTeclado);
      botonAbrir.focus();
    }

    function gestionarTeclado(evento) {
      if (evento.key === "Escape") {
        cerrarMenu();
        return;
      }

      // Atrapa el foco dentro del panel mientras esté abierto
      if (evento.key === "Tab" && elementosFocalizables && elementosFocalizables.length > 0) {
        var primero = elementosFocalizables[0];
        var ultimo = elementosFocalizables[elementosFocalizables.length - 1];

        if (evento.shiftKey && document.activeElement === primero) {
          evento.preventDefault();
          ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
          evento.preventDefault();
          primero.focus();
        }
      }
    }

    botonAbrir.addEventListener("click", abrirMenu);
    if (botonCerrar) {
      botonCerrar.addEventListener("click", cerrarMenu);
    }
    fondo.addEventListener("click", cerrarMenu);
  }

  /* ------------------------------------------------------------------------
     2. Google Analytics + Modo de Consentimiento v2 + panel de cookies
     ------------------------------------------------------------------------
     - La analítica (Google Analytics) se carga siempre, por defecto.
     - Se implementa el Modo de Consentimiento v2 de Google: se informa a
       Google del estado de consentimiento (granted/denied) para que
       Google Ads y Analytics traten correctamente el tráfico de la UE.
       Como la analítica está activa por defecto, el estado inicial es
       "granted"; si el usuario la desactiva, pasa a "denied" y dejamos
       de enviar datos.
     - Al primer acceso se muestra un aviso informativo (no bloqueante) con
       un único botón "Entendido", que solo confirma que se ha visto.
     - El enlace "Configurar cookies" del footer abre un panel donde el
       usuario puede desactivar la analítica en cualquier momento.
     ------------------------------------------------------------------------ */
  var CLAVE_AVISO_VISTO = "ysl_aviso_cookies_visto";
  var CLAVE_ANALYTICS_ACTIVO = "ysl_analytics_activo";
  var ID_ANALYTICS = "G-TLKVGQ0FSJ";

  function leerLocalStorage(clave) {
    try {
      return localStorage.getItem(clave);
    } catch (error) {
      return null;
    }
  }

  function escribirLocalStorage(clave, valor) {
    try {
      localStorage.setItem(clave, valor);
    } catch (error) {
      // No se puede persistir (modo privado estricto, etc.); no es crítico.
    }
  }

  function analyticsEstaActivo() {
    // Activo por defecto, salvo que el usuario lo haya desactivado explícitamente.
    return leerLocalStorage(CLAVE_ANALYTICS_ACTIVO) !== "false";
  }

  // gtag/dataLayer se inicializan una sola vez, fuera de cargarGoogleAnalytics,
  // para poder enviar señales de consentimiento incluso antes de inyectar
  // el script de gtag.js.
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  function actualizarConsentimientoGoogle(concedido) {
    var estado = concedido ? "granted" : "denied";
    gtag("consent", "default", {
      ad_storage: estado,
      ad_user_data: estado,
      ad_personalization: estado,
      analytics_storage: estado,
    });
    gtag("consent", "update", {
      ad_storage: estado,
      ad_user_data: estado,
      ad_personalization: estado,
      analytics_storage: estado,
    });
  }

  function cargarGoogleAnalytics() {
    if (!ID_ANALYTICS || ID_ANALYTICS.indexOf("[") === 0) {
      return; // El ID todavía no está configurado.
    }

    actualizarConsentimientoGoogle(true);

    // Revierte cualquier desactivación previa de esta sesión de navegador.
    window["ga-disable-" + ID_ANALYTICS] = false;

    if (document.getElementById("script-google-analytics")) {
      return; // Ya cargado.
    }

    var script = document.createElement("script");
    script.id = "script-google-analytics";
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + ID_ANALYTICS;
    document.head.appendChild(script);

    gtag("js", new Date());
    gtag("config", ID_ANALYTICS);
  }

  function desactivarGoogleAnalytics() {
    actualizarConsentimientoGoogle(false);

    // Mecanismo oficial de Google para dejar de enviar datos a partir de ahora.
    window["ga-disable-" + ID_ANALYTICS] = true;

    var script = document.getElementById("script-google-analytics");
    if (script) {
      script.remove();
    }
  }

  function inicializarCookies() {
    var avisoBanner = document.getElementById("aviso-cookies");
    var botonEntendido = avisoBanner
      ? avisoBanner.querySelector("[data-accion='cerrar-aviso-cookies']")
      : null;

    var panelConfig = document.getElementById("panel-configurar-cookies");
    var enlaceConfigurar = document.querySelector("[data-accion='configurar-cookies']");
    var botonAlternar = panelConfig
      ? panelConfig.querySelector("[data-accion='alternar-analitica']")
      : null;
    var botonCerrarPanel = panelConfig
      ? panelConfig.querySelector("[data-accion='cerrar-panel-cookies']")
      : null;
    var textoEstado = panelConfig
      ? panelConfig.querySelector("#texto-estado-analitica")
      : null;

    // 1. Cargar (o no) Google Analytics según la preferencia guardada.
    if (analyticsEstaActivo()) {
      cargarGoogleAnalytics();
    } else {
      desactivarGoogleAnalytics();
    }

    // 2. Mostrar el aviso informativo solo la primera vez.
    if (avisoBanner && leerLocalStorage(CLAVE_AVISO_VISTO) !== "true") {
      avisoBanner.setAttribute("data-visible", "true");
    }

    if (botonEntendido) {
      botonEntendido.addEventListener("click", function () {
        escribirLocalStorage(CLAVE_AVISO_VISTO, "true");
        avisoBanner.setAttribute("data-visible", "false");
      });
    }

    // 3. Panel de configuración (accesible desde el footer).
    function actualizarTextoPanel() {
      var activo = analyticsEstaActivo();
      if (textoEstado) {
        textoEstado.textContent = activo
          ? "Las cookies están activadas."
          : "Las cookies están desactivadas.";
      }
      if (botonAlternar) {
        botonAlternar.textContent = activo ? "Desactivar cookies" : "Activar cookies";
      }
    }

    if (enlaceConfigurar && panelConfig) {
      enlaceConfigurar.addEventListener("click", function (evento) {
        evento.preventDefault();
        if (avisoBanner) {
          avisoBanner.setAttribute("data-visible", "false");
        }
        actualizarTextoPanel();
        panelConfig.setAttribute("data-visible", "true");
      });
    }

    if (botonAlternar) {
      botonAlternar.addEventListener("click", function () {
        if (analyticsEstaActivo()) {
          escribirLocalStorage(CLAVE_ANALYTICS_ACTIVO, "false");
          desactivarGoogleAnalytics();
        } else {
          escribirLocalStorage(CLAVE_ANALYTICS_ACTIVO, "true");
          cargarGoogleAnalytics();
        }
        actualizarTextoPanel();
      });
    }

    if (botonCerrarPanel) {
      botonCerrarPanel.addEventListener("click", function () {
        panelConfig.setAttribute("data-visible", "false");
      });
    }
  }

  /* ------------------------------------------------------------------------
     3. Animaciones de aparición al hacer scroll
     ------------------------------------------------------------------------
     Se aplican solo a elementos marcados con la clase .animar-aparicion,
     nunca a cada tarjeta individual de la grid de ofertas (por rendimiento).
     Respeta prefers-reduced-motion de forma automática vía CSS, y aquí
     además evitamos el coste del observer si el usuario lo tiene activado.
     ------------------------------------------------------------------------ */
  function inicializarAnimacionesScroll() {
    var prefiereMenosMovimiento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    var elementos = document.querySelectorAll(".animar-aparicion");

    if (elementos.length === 0) {
      return;
    }

    if (prefiereMenosMovimiento || !("IntersectionObserver" in window)) {
      elementos.forEach(function (elemento) {
        elemento.setAttribute("data-visible", "true");
      });
      return;
    }

    var observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (entrada.isIntersecting) {
            entrada.target.setAttribute("data-visible", "true");
            observador.unobserve(entrada.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    elementos.forEach(function (elemento) {
      observador.observe(elemento);
    });
  }

  /* ------------------------------------------------------------------------
     4. Sombra en la cabecera al hacer scroll
     ------------------------------------------------------------------------ */
  function inicializarSombraCabecera() {
    var cabecera = document.querySelector(".cabecera");
    if (!cabecera) {
      return;
    }

    function actualizarSombra() {
      if (window.scrollY > 4) {
        cabecera.classList.add("cabecera--con-sombra");
      } else {
        cabecera.classList.remove("cabecera--con-sombra");
      }
    }

    actualizarSombra();
    window.addEventListener("scroll", actualizarSombra, { passive: true });
  }

  /* ------------------------------------------------------------------------
     5. Seguimiento de eventos de conversión (Google Analytics / Google Ads)
     ------------------------------------------------------------------------
     Detecta automáticamente los clics en cualquier página del sitio sobre:
       - Enlaces a nuestro canal de WhatsApp  → evento "whatsapp_join_click"
       - Enlaces a nuestro canal de Telegram  → evento "telegram_join_click"
       - Botón "Ver en Amazon" de una tarjeta → evento "amazon_link_click"
     No requiere marcar cada botón a mano: usa delegación de eventos sobre
     todo el documento, así que funciona igual en páginas nuevas que se
     añadan en el futuro, siempre que reutilicen las mismas clases/URLs.
     Si la analítica está desactivada, gtag no envía nada (comprobado con
     typeof window.gtag === "function", que sigue existiendo como función
     vacía-segura incluso con la analítica desactivada, ya que solo deja de
     enviarse gracias a "ga-disable-...").
     ------------------------------------------------------------------------ */
  function obtenerUbicacionEnlace(enlace) {
    if (enlace.closest("[data-landing-cta]")) {
      return enlace.closest("[data-landing-cta]").getAttribute("data-landing-cta");
    }
    if (enlace.closest(".cabecera")) return "header";
    if (enlace.closest(".pie-pagina")) return "footer";
    if (enlace.closest(".landing-cta-sticky")) return "sticky_movil";
    if (enlace.closest(".grupo-cta-canales")) return "cta_canales";
    return "cuerpo_pagina";
  }

  function inicializarSeguimientoConversiones() {
    document.addEventListener("click", function (evento) {
      var enlace = evento.target.closest("a[href]");
      if (!enlace) {
        return;
      }

      var href = enlace.getAttribute("href") || "";

      if (href.indexOf("whatsapp.com/channel") !== -1) {
        gtag("event", "whatsapp_join_click", {
          cta_ubicacion: obtenerUbicacionEnlace(enlace),
          page_location: window.location.pathname,
        });
        return;
      }

      if (href.indexOf("t.me/") !== -1) {
        gtag("event", "telegram_join_click", {
          cta_ubicacion: obtenerUbicacionEnlace(enlace),
          page_location: window.location.pathname,
        });
        return;
      }

      if (enlace.classList.contains("tarjeta-oferta__boton")) {
        var tarjeta = enlace.closest(".tarjeta-oferta");
        var tituloEl = tarjeta ? tarjeta.querySelector(".tarjeta-oferta__titulo") : null;
        gtag("event", "amazon_link_click", {
          producto: tituloEl ? tituloEl.textContent.trim() : "desconocido",
          page_location: window.location.pathname,
        });
      }
    });
  }

  /* ------------------------------------------------------------------------
     Inicialización general
     ------------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
    inicializarMenu();
    inicializarCookies();
    inicializarAnimacionesScroll();
    inicializarSombraCabecera();
    inicializarSeguimientoConversiones();
  });
})();
