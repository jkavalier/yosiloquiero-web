/* ==========================================================================
   ¡Yo SÍ Lo Quiero! — JavaScript específico de ofertas.html
   Lee ofertas.json y renderiza las tarjetas de forma segura.

   SEGURIDAD: todo el texto proveniente de ofertas.json se inserta con
   textContent (nunca innerHTML), tal y como se acordó en la Fase 0.
   ========================================================================== */

(function () {
  "use strict";

  var RUTA_JSON = "/ofertas.json";

  var contenedor = document.getElementById("contenedor-ofertas");
  var elementoActualizado = document.getElementById("ofertas-actualizado");
  var elementoMensaje = document.getElementById("ofertas-mensaje");

  if (!contenedor) {
    return; // Esta página no tiene el marcado esperado; no hacemos nada.
  }

  var tarjetaPlaceholder = contenedor.querySelector("[data-placeholder='true']");

  function mostrarMensaje(texto) {
    if (!elementoMensaje) return;
    elementoMensaje.textContent = texto;
    elementoMensaje.hidden = false;
  }

  function ocultarMensaje() {
    if (!elementoMensaje) return;
    elementoMensaje.hidden = true;
    elementoMensaje.textContent = "";
  }

  function formatearFecha(isoString) {
    if (!isoString) return null;
    var fecha = new Date(isoString);
    if (isNaN(fecha.getTime())) return null;

    try {
      return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(fecha);
    } catch (error) {
      return null;
    }
  }

  function formatearPrecio(numero) {
    if (typeof numero !== "number" || isNaN(numero)) return null;
    try {
      return numero.toLocaleString("es-ES", {
        style: "currency",
        currency: "EUR",
      });
    } catch (error) {
      return numero.toFixed(2).replace(".", ",") + " €";
    }
  }

  function formatearValoracion(numero) {
    if (typeof numero !== "number" || isNaN(numero)) return null;
    return numero.toFixed(1).replace(".", ",");
  }

  /**
   * Construye el elemento DOM de una tarjeta de oferta a partir de un
   * objeto de datos. Usa createElement + textContent exclusivamente:
   * ningún campo del JSON se interpreta como HTML.
   */
  function crearTarjetaOferta(oferta) {
    // Validación mínima de campos obligatorios
    var camposRequeridos = [
      "titulo",
      "condicion",
      "precio_anterior",
      "precio_actual",
      "descuento_porcentaje",
      "ahorro_euros",
      "url_producto",
    ];

    for (var i = 0; i < camposRequeridos.length; i++) {
      if (oferta[camposRequeridos[i]] === undefined || oferta[camposRequeridos[i]] === null) {
        console.warn("Oferta omitida por falta del campo:", camposRequeridos[i], oferta);
        return null;
      }
    }

    var precioAnteriorTexto = formatearPrecio(oferta.precio_anterior);
    var precioActualTexto = formatearPrecio(oferta.precio_actual);
    if (!precioAnteriorTexto || !precioActualTexto) {
      console.warn("Oferta omitida por precio inválido:", oferta);
      return null;
    }

    var articulo = document.createElement("article");
    articulo.className = "tarjeta-oferta";

    // Imagen
    var envoltorioImagen = document.createElement("div");
    envoltorioImagen.className = "tarjeta-oferta__imagen-envoltorio";

    var imagen = document.createElement("img");
    imagen.className = "tarjeta-oferta__imagen";
    imagen.loading = "lazy";
    imagen.src = typeof oferta.imagen_url === "string" ? oferta.imagen_url : "";
    imagen.alt = ""; // Decorativa: el título ya describe el producto en texto
    envoltorioImagen.appendChild(imagen);
    articulo.appendChild(envoltorioImagen);

    // Cuerpo
    var cuerpo = document.createElement("div");
    cuerpo.className = "tarjeta-oferta__cuerpo";

    var badgeCondicion = document.createElement("span");
    badgeCondicion.className = "badge badge--morado";
    badgeCondicion.textContent = oferta.condicion; // texto plano, seguro
    cuerpo.appendChild(badgeCondicion);

    var titulo = document.createElement("h2");
    titulo.className = "tarjeta-oferta__titulo";
    titulo.textContent = oferta.titulo; // texto plano, seguro
    cuerpo.appendChild(titulo);

    if (typeof oferta.valoracion === "number") {
      var valoracionTexto = formatearValoracion(oferta.valoracion);
      if (valoracionTexto) {
        var valoracion = document.createElement("p");
        valoracion.className = "tarjeta-oferta__valoracion";
        valoracion.setAttribute(
          "aria-label",
          "Valoración " + valoracionTexto + " sobre 5"
        );

        // Icono de estrella propio (SVG), en vez de emoji, para garantizar
        // contraste consistente en cualquier sistema operativo/navegador.
        var svgNS = "http://www.w3.org/2000/svg";
        var svgEstrella = document.createElementNS(svgNS, "svg");
        svgEstrella.setAttribute("class", "tarjeta-oferta__icono-estrella");
        svgEstrella.setAttribute("viewBox", "0 0 24 24");
        svgEstrella.setAttribute("aria-hidden", "true");

        var pathEstrella = document.createElementNS(svgNS, "path");
        pathEstrella.setAttribute(
          "d",
          "M12 2.5l2.9 6.02 6.6.77-4.86 4.55 1.26 6.56L12 17.28l-5.9 3.12 1.26-6.56L2.5 9.29l6.6-.77L12 2.5Z"
        );
        pathEstrella.setAttribute("fill", "var(--color-amarillo)");
        pathEstrella.setAttribute("stroke", "var(--color-texto)");
        pathEstrella.setAttribute("stroke-width", "1.3");
        pathEstrella.setAttribute("stroke-linejoin", "round");

        svgEstrella.appendChild(pathEstrella);
        valoracion.appendChild(svgEstrella);
        valoracion.appendChild(document.createTextNode(valoracionTexto));

        cuerpo.appendChild(valoracion);
      }
    }

    var precios = document.createElement("p");
    precios.className = "tarjeta-oferta__precios";

    var precioAnterior = document.createElement("del");
    precioAnterior.className = "tarjeta-oferta__precio-anterior";
    precioAnterior.textContent = precioAnteriorTexto;
    precios.appendChild(precioAnterior);

    var precioActual = document.createElement("strong");
    precioActual.className = "tarjeta-oferta__precio-actual";
    precioActual.textContent = precioActualTexto;
    precios.appendChild(precioActual);

    cuerpo.appendChild(precios);

    var lineaDescuento = document.createElement("div");
    lineaDescuento.className = "tarjeta-oferta__descuento-linea";

    var badgeDescuento = document.createElement("span");
    badgeDescuento.className = "badge badge--amarillo";
    badgeDescuento.textContent = "-" + oferta.descuento_porcentaje + "%";
    lineaDescuento.appendChild(badgeDescuento);

    var ahorroTexto = formatearPrecio(oferta.ahorro_euros);
    if (ahorroTexto) {
      var ahorro = document.createElement("span");
      ahorro.className = "tarjeta-oferta__ahorro";
      ahorro.textContent = "Ahorras " + ahorroTexto;
      lineaDescuento.appendChild(ahorro);
    }

    cuerpo.appendChild(lineaDescuento);

    var boton = document.createElement("a");
    boton.className = "boton boton--primario boton--ancho-completo tarjeta-oferta__boton";
    boton.href = typeof oferta.url_producto === "string" ? oferta.url_producto : "#";
    boton.target = "_blank";
    boton.rel = "noopener noreferrer";
    boton.textContent = "Ver en Amazon";
    cuerpo.appendChild(boton);

    articulo.appendChild(cuerpo);

    return articulo;
  }

  function renderizarOfertas(ofertas) {
    var fragmento = document.createDocumentFragment();
    var tarjetasValidas = 0;

    ofertas.forEach(function (oferta) {
      var tarjeta = crearTarjetaOferta(oferta);
      if (tarjeta) {
        fragmento.appendChild(tarjeta);
        tarjetasValidas++;
      }
    });

    if (tarjetasValidas === 0) {
      mostrarEstadoVacio();
      return;
    }

    contenedor.innerHTML = ""; // Limpio: solo eliminamos nodos ya construidos por nosotros, no HTML externo
    contenedor.appendChild(fragmento);
    ocultarMensaje();
  }

  function mostrarEstadoVacio() {
    if (tarjetaPlaceholder) {
      tarjetaPlaceholder.remove();
    }
    mostrarMensaje(
      "No hay ofertas activas en este momento. Vuelve a comprobarlo más tarde, o únete a nuestros canales para enterarte en cuanto publiquemos nuevas."
    );
  }

  function mostrarEstadoError() {
    // Mantenemos la tarjeta de ejemplo visible (ya está claramente
    // etiquetada como "Ejemplo") como referencia visual de fallback.
    mostrarMensaje(
      "No hemos podido cargar las ofertas ahora mismo. Prueba a recargar la página en unos minutos."
    );
  }

  function cargarOfertas() {
    fetch(RUTA_JSON, { cache: "no-store" })
      .then(function (respuesta) {
        if (!respuesta.ok) {
          throw new Error("Respuesta HTTP no válida: " + respuesta.status);
        }
        return respuesta.json();
      })
      .then(function (datos) {
        if (!datos || typeof datos !== "object" || !Array.isArray(datos.ofertas)) {
          throw new Error("Formato de ofertas.json inesperado");
        }

        if (elementoActualizado) {
          var fechaFormateada = formatearFecha(datos.actualizado);
          elementoActualizado.textContent = fechaFormateada
            ? "Última actualización: " + fechaFormateada
            : "Última actualización no disponible todavía.";
        }

        if (datos.ofertas.length === 0) {
          mostrarEstadoVacio();
          return;
        }

        renderizarOfertas(datos.ofertas);
      })
      .catch(function (error) {
        console.error("Error al cargar ofertas.json:", error);
        if (elementoActualizado) {
          elementoActualizado.textContent = "Última actualización no disponible.";
        }
        mostrarEstadoError();
      });
  }

  document.addEventListener("DOMContentLoaded", cargarOfertas);
})();
