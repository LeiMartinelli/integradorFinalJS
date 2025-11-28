// js/main.js

document.addEventListener("DOMContentLoaded", function () {
  // ==========================
  // Captura de elementos
  // ==========================
  const formulario = document.getElementById("activityForm");
  const tbody = document.getElementById("activityTableBody");
  const templateFila = document.getElementById("rowTemplate");
  const mensajeVacio = document.getElementById("emptyState");

  const inputTitulo = document.getElementById("title");
  const inputMateria = document.getElementById("subject");
  const selectTipo = document.getElementById("type");
  const selectDificultad = document.getElementById("difficulty");
  const inputTiempo = document.getElementById("estimatedTime");
  const inputFecha = document.getElementById("deadline");
  const textareaNotas = document.getElementById("notes");
  const checkboxImportante = document.getElementById("isImportant");

  const botonesFiltro = document.querySelectorAll(".btn-filter");
  const inputBusqueda = document.getElementById("search");
  const selectOrden = document.getElementById("sort");

  const statTotal = document.getElementById("statTotal");
  const statCompleted = document.getElementById("statCompleted");
  const statPending = document.getElementById("statPending");
  const statHours = document.getElementById("statHours");

  // ==========================
  // Estado
  // ==========================
  let actividades = [];
  let ultimoId = 0;

  let filtroActivo = "todas"; // "todas" | "pendientes" | "completadas"
  let textoBusqueda = "";
  let criterioOrden = selectOrden ? selectOrden.value : "fecha";

  const mapaPrioridad = {
    alta: 3,
    media: 2,
    baja: 1
  };

  // ==========================
  // Funciones
  // ==========================

  function manejarSubmitFormulario(evento) {
    evento.preventDefault();

    const titulo = inputTitulo.value.trim();
    const materia = inputMateria.value.trim();
    const tipo = selectTipo.value;
    const dificultad = selectDificultad.value;

    const radioPrioridad = document.querySelector(
      'input[name="priority"]:checked'
    );
    const prioridad = radioPrioridad ? radioPrioridad.value : "";

    const fecha = inputFecha.value;
    const notas = textareaNotas.value.trim();
    const importante = checkboxImportante.checked;

    let tiempoTexto = inputTiempo.value.trim();
    let tiempo = null;

    // Validaciones simples
    if (!titulo) {
      alert("El título no puede estar vacío.");
      return;
    }

    if (tiempoTexto !== "") {
      const numeroTiempo = Number(tiempoTexto);
      if (isNaN(numeroTiempo) || numeroTiempo < 0) {
        alert("El tiempo estimado debe ser un número mayor o igual a 0.");
        return;
      }
      tiempo = numeroTiempo;
    }

    // Crear objeto actividad
    ultimoId++;

    const actividad = {
      id: ultimoId,
      titulo: titulo,
      materia: materia,
      tipo: tipo,
      dificultad: dificultad,
      prioridad: prioridad,
      fecha: fecha,
      tiempo: tiempo, // null si no se cargó
      notas: notas,
      importante: importante,
      completada: false
    };

    actividades.push(actividad);

    formulario.reset();
    renderizarTabla();
    actualizarEstadisticas();
  }

  function obtenerActividadesFiltradasYOrdenadas() {
    let resultado = actividades.slice();

    // Filtro por estado
    if (filtroActivo === "pendientes") {
      resultado = resultado.filter(function (act) {
        return !act.completada;
      });
    } else if (filtroActivo === "completadas") {
      resultado = resultado.filter(function (act) {
        return act.completada;
      });
    }

    // Filtro por texto (título / materia)
    if (textoBusqueda) {
      const texto = textoBusqueda.toLowerCase();
      resultado = resultado.filter(function (act) {
        const t = (act.titulo || "").toLowerCase();
        const m = (act.materia || "").toLowerCase();
        return t.includes(texto) || m.includes(texto);
      });
    }

    // Ordenamiento
    if (criterioOrden === "fecha") {
      resultado.sort(function (a, b) {
        const fa = a.fecha || "";
        const fb = b.fecha || "";
        if (fa < fb) return -1;
        if (fa > fb) return 1;
        return 0;
      });
    } else if (criterioOrden === "prioridad") {
      resultado.sort(function (a, b) {
        const pa = mapaPrioridad[(a.prioridad || "").toLowerCase()] || 0;
        const pb = mapaPrioridad[(b.prioridad || "").toLowerCase()] || 0;
        return pb - pa; // alta > media > baja
      });
    } else if (criterioOrden === "titulo") {
      resultado.sort(function (a, b) {
        const ta = (a.titulo || "").toLowerCase();
        const tb = (b.titulo || "").toLowerCase();
        return ta.localeCompare(tb);
      });
    }

    return resultado;
  }

  function renderizarTabla() {
    if (!tbody || !templateFila) return;

    tbody.innerHTML = "";

    if (mensajeVacio) {
      mensajeVacio.style.display = actividades.length === 0 ? "block" : "none";
    }

    const actividadesAMostrar = obtenerActividadesFiltradasYOrdenadas();

    if (actividadesAMostrar.length === 0) {
      return;
    }

    actividadesAMostrar.forEach(function (actividad) {
      const clon = document.importNode(templateFila.content, true);
      const fila = clon.querySelector("tr");

      if (!fila) return;

      fila.dataset.id = actividad.id;
      fila.dataset.status = actividad.completada ? "completada" : "pendiente";

      const celdaTitulo = fila.querySelector(".row-title");
      const celdaMateria = fila.querySelector(".row-subject");
      const celdaTipo = fila.querySelector(".row-type");
      const spanPrioridad = fila.querySelector(".badge--priority");
      const celdaFecha = fila.querySelector(".row-deadline");
      const celdaTiempo = fila.querySelector(".row-time");

      if (celdaTitulo) {
        celdaTitulo.textContent = actividad.titulo || "";
        if (actividad.importante) {
          celdaTitulo.classList.add("actividad-importante");
        }
      }

      if (celdaMateria) {
        celdaMateria.textContent = actividad.materia || "";
      }

      if (celdaTipo) {
        celdaTipo.textContent = actividad.tipo || "";
      }

      if (spanPrioridad) {
        spanPrioridad.textContent = actividad.prioridad || "-";
        spanPrioridad.classList.remove("prio-alta", "prio-media", "prio-baja");

        const p = (actividad.prioridad || "").toLowerCase();
        if (p === "alta") {
          spanPrioridad.classList.add("prio-alta");
        } else if (p === "media") {
          spanPrioridad.classList.add("prio-media");
        } else if (p === "baja") {
          spanPrioridad.classList.add("prio-baja");
        }
      }

      if (celdaFecha) {
        celdaFecha.textContent = actividad.fecha || "";
      }

      if (celdaTiempo) {
        if (actividad.tiempo != null && !isNaN(actividad.tiempo)) {
          celdaTiempo.textContent = actividad.tiempo + " h";
        } else {
          celdaTiempo.textContent = "-";
        }
      }

      // Checkbox completada
      const checkbox = fila.querySelector(".row-complete");
      if (checkbox) {
        checkbox.checked = actividad.completada === true;
        checkbox.addEventListener("change", function () {
          cambiarEstadoCompletada(actividad.id, checkbox.checked);
        });
      }

      // Botones acciones
      const btnEliminar = fila.querySelector(".btn-delete");
      if (btnEliminar) {
        btnEliminar.addEventListener("click", function () {
          eliminarActividad(actividad.id);
        });
      }

      const btnEditar = fila.querySelector(".btn-edit");
      if (btnEditar) {
        btnEditar.addEventListener("click", function () {
          // Edición no implementada en esta versión
          alert("Edición de actividades pendiente de implementar.");
        });
      }

      if (actividad.completada) {
        fila.classList.add("completada");
      }

      tbody.appendChild(clon);
    });
  }

  function actualizarEstadisticas() {
    const total = actividades.length;
    const completadas = actividades.filter(function (act) {
      return act.completada;
    }).length;
    const pendientes = total - completadas;

    let horasTotales = 0;
    actividades.forEach(function (act) {
      if (act.tiempo != null && !isNaN(act.tiempo)) {
        horasTotales += act.tiempo;
      }
    });

    if (statTotal) statTotal.textContent = total;
    if (statCompleted) statCompleted.textContent = completadas;
    if (statPending) statPending.textContent = pendientes;
    if (statHours) statHours.textContent = horasTotales;
  }

  function cambiarEstadoCompletada(idActividad, estaCompletada) {
    const actividad = actividades.find(function (act) {
      return act.id === idActividad;
    });

    if (!actividad) return;

    actividad.completada = !!estaCompletada;
    renderizarTabla();
    actualizarEstadisticas();
  }

  function eliminarActividad(idActividad) {
    actividades = actividades.filter(function (act) {
      return act.id !== idActividad;
    });
    renderizarTabla();
    actualizarEstadisticas();
  }

  function manejarClickFiltro(boton) {
    const nuevoFiltro = boton.dataset.filter || "todas";
    filtroActivo = nuevoFiltro;

    botonesFiltro.forEach(function (btn) {
      btn.classList.remove("is-active");
    });
    boton.classList.add("is-active");

    renderizarTabla();
  }

  function manejarBusquedaTexto(evento) {
    textoBusqueda = evento.target.value.toLowerCase().trim();
    renderizarTabla();
  }

  function manejarCambioOrden(evento) {
    criterioOrden = evento.target.value || "fecha";
    renderizarTabla();
  }

  // ==========================
  // Listeners
  // ==========================

  if (formulario) {
    formulario.addEventListener("submit", manejarSubmitFormulario);
  }

  botonesFiltro.forEach(function (boton) {
    boton.addEventListener("click", function () {
      manejarClickFiltro(boton);
    });
  });

  if (inputBusqueda) {
    inputBusqueda.addEventListener("input", manejarBusquedaTexto);
  }

  if (selectOrden) {
    selectOrden.addEventListener("change", manejarCambioOrden);
  }

  // Estado inicial
  renderizarTabla();
  actualizarEstadisticas();
});
