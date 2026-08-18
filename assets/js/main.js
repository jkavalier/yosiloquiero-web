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
     2. Banner de cookies (autogestionado, sin CMP de terceros)
     ------------------------------------------------------------------------
     - No se carga ningún script de analítica hasta que el usuario acepte.
     - La decisión se guarda en localStorage.
     - El enlace "Configurar cookies" del footer permite cambiarla luego.
     ------------------------------------------------------------------------ */
  var CLAVE_CONSENTIMIENTO = "ysl_consentimiento_cookies";

  function obtenerConsentimiento() {
    try {
      return localStorage.getItem(CLAVE_CONSENTIMIENTO);
    } catch (error) {
      // Si localStorage no está disponible (modo privado estricto, etc.),
      // no se persiste la decisión y se trata como "sin decidir".
      return null;
    }
  }

  function guardarConsentimiento(valor) {
    try {
      localStorage.setItem(CLAVE_CONSENTIMIENTO, valor);
    } catch (error) {
      // No se puede persistir; el banner podrá volver a aparecer.
    }
  }

  function cargarGoogleAnalytics() {
    // ID de Google Analytics 4 configurado.
    var idAnalytics = "G-TLKVGQ0FSJ";

    if (!idAnalytics || idAnalytics.indexOf("[") === 0) {
      // El ID todavía no está configurado; no se carga nada.
      return;
    }

    if (document.getElementById("script-google-analytics")) {
      return; // Ya cargado
    }

    var script = document.createElement("script");
    script.id = "script-google-analytics";
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + idAnalytics;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    gtag("js", new Date());
    gtag("config", idAnalytics);
    window.gtag = gtag;
  }

  function inicializarCookies() {
    var banner = document.querySelector(".banner-cookies");
    if (!banner) {
      return;
    }

    var botonAceptar = banner.querySelector("[data-accion='aceptar-cookies']");
    var botonRechazar = banner.querySelector("[data-accion='rechazar-cookies']");
    var enlaceConfigurar = document.querySelector("[data-accion='configurar-cookies']");

    function mostrarBanner() {
      banner.setAttribute("data-visible", "true");
    }

    function ocultarBanner() {
      banner.setAttribute("data-visible", "false");
    }

    var consentimiento = obtenerConsentimiento();

    if (consentimiento === "aceptado") {
      cargarGoogleAnalytics();
    } else if (consentimiento !== "rechazado") {
      // Sin decisión previa: mostrar el banner.
      mostrarBanner();
    }

    if (botonAceptar) {
      botonAceptar.addEventListener("click", function () {
        guardarConsentimiento("aceptado");
        cargarGoogleAnalytics();
        ocultarBanner();
      });
    }

    if (botonRechazar) {
      botonRechazar.addEventListener("click", function () {
        guardarConsentimiento("rechazado");
        ocultarBanner();
      });
    }

    if (enlaceConfigurar) {
      enlaceConfigurar.addEventListener("click", function (evento) {
        evento.preventDefault();
        mostrarBanner();
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
     Inicialización general
     ------------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
    inicializarMenu();
    inicializarCookies();
    inicializarAnimacionesScroll();
    inicializarSombraCabecera();
  });
})();
