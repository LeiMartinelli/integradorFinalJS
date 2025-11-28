// js/main.js

document.addEventListener("DOMContentLoaded", function () {
    // ==========================
    // Captura de elementos del DOM
    // ==========================
    const formulario = document.getElementById("activityForm");
    const tablaBody = document.getElementById("activityTableBody");
    const templateFila = document.getElementById("rowTemplate");
    const mensajeVacio = document.getElementById("emptyState");

    const inputTitulo = document.getElementById("titulo");
    const inputMateria = document.getElementById("materia");
    const selectTipo = document.getElementById("tipo");
    const selectDificultad = document.getElementById("dificultad");
    const selectPrioridad = document.getElementById("prioridad");
    const inputFecha = document.getElementById("fecha");
    const inputTiempo = document.getElementById("tiempoEstimado");
    const textareaNotas = document.getElementById("notas");
    const checkboxImportante = document.getElementById("importante"); // puede no existir

    const botonesFiltro = document.querySelectorAll(".btn-filter");
    const inputBusqueda = document.getElementById("search");
    const selectOrden = document.getElementById("sort");

    const statTotal = document.getElementById("statTotal");
    const statCompleted = document.getElementById("statCompleted");
    const statPending = document.getElementById("statPending");
    const statHours = document.getElementById("statHours");

    // ==========================
    // Estado y datos
    // ==========================
    let actividades = [];
    let ultimoId = 0;

    let filtroActivo = "todas"; // "todas" | "pendientes" | "completadas"
    let textoBusqueda = "";
    let criterioOrden = "fecha"; // "fecha" | "prioridad" | "titulo"

    const mapaPrioridad = {
        alta: 3,
        media: 2,
        baja: 1
    };

    // ==========================
    // Funciones principales
    // ==========================

    // Maneja el submit del formulario
    function manejarSubmitFormulario(evento) {
        evento.preventDefault();

        const titulo = inputTitulo ? inputTitulo.value.trim() : "";
        const materia = inputMateria ? inputMateria.value.trim() : "";
        const tipo = selectTipo ? selectTipo.value : "";
        const dificultad = selectDificultad ? selectDificultad.value : "";
        const prioridad = selectPrioridad ? selectPrioridad.value : "";
        const fecha = inputFecha ? inputFecha.value : "";
        const notas = textareaNotas ? textareaNotas.value.trim() : "";
        const importante = checkboxImportante ? checkboxImportante.checked : false;

        let tiempoTexto = inputTiempo ? inputTiempo.value.trim() : "";
        let tiempo = null;

        // Validación básica
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

        const nuevaActividad = {
            id: ultimoId,
            titulo: titulo,
            materia: materia,
            tipo: tipo,
            dificultad: dificultad,
            prioridad: prioridad,
            fecha: fecha,
            tiempo: tiempo, // puede ser null
            notas: notas,
            importante: importante,
            completada: false
        };

        actividades.push(nuevaActividad);

        // Limpiar formulario
        if (formulario) {
            formulario.reset();
        }

        // Actualizar vista
        renderizarTabla();
        actualizarEstadisticas();
    }

    // Devuelve las actividades filtradas y ordenadas
    function obtenerActividadesFiltradasYOrdenadas() {
        let resultado = actividades.slice();

        // 1) Filtro por estado
        if (filtroActivo === "pendientes") {
            resultado = resultado.filter(function (act) {
                return !act.completada;
            });
        } else if (filtroActivo === "completadas") {
            resultado = resultado.filter(function (act) {
                return act.completada;
            });
        }

        // 2) Filtro de búsqueda por texto (título o materia)
        if (textoBusqueda) {
            const texto = textoBusqueda.toLowerCase();
            resultado = resultado.filter(function (act) {
                const titulo = (act.titulo || "").toLowerCase();
                const materia = (act.materia || "").toLowerCase();
                return titulo.includes(texto) || materia.includes(texto);
            });
        }

        // 3) Ordenamiento según criterio
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
                // Alta > Media > Baja
                return pb - pa;
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

    // Dibuja la tabla de actividades en el DOM
    function renderizarTabla() {
        if (!tablaBody || !templateFila) return;

        // Limpiar cuerpo de la tabla
        tablaBody.innerHTML = "";

        // Mostrar/ocultar mensaje de lista vacía según el total global
        if (mensajeVacio) {
            if (actividades.length === 0) {
                mensajeVacio.style.display = "block";
            } else {
                mensajeVacio.style.display = "none";
            }
        }

        const actividadesAMostrar = obtenerActividadesFiltradasYOrdenadas();

        if (actividadesAMostrar.length === 0) {
            // Si no hay actividades para mostrar por filtros/búsqueda, solo dejamos la tabla limpia
            return;
        }

        // Recorrer actividades filtradas
        actividadesAMostrar.forEach(function (actividad) {
            const clon = document.importNode(templateFila.content, true);
            const fila = clon.querySelector("tr");

            if (!fila) return;

            const celdaTitulo = fila.querySelector(".cell-titulo");
            const celdaMateria = fila.querySelector(".cell-materia");
            const celdaTipo = fila.querySelector(".cell-tipo");
            const celdaPrioridad = fila.querySelector(".cell-prioridad");
            const celdaFecha = fila.querySelector(".cell-fecha");
            const celdaTiempo = fila.querySelector(".cell-tiempo");

            if (celdaTitulo) {
                celdaTitulo.textContent = actividad.titulo || "";
                if (actividad.importante) {
                    // Sencillo: resaltar título importante
                    celdaTitulo.classList.add("actividad-importante");
                }
            }

            if (celdaMateria) {
                celdaMateria.textContent = actividad.materia || "";
            }

            if (celdaTipo) {
                celdaTipo.textContent = actividad.tipo || "";
            }

            if (celdaPrioridad) {
                celdaPrioridad.textContent = actividad.prioridad || "";

                // Extra simple: clases de color según prioridad
                celdaPrioridad.classList.remove("prio-alta", "prio-media", "prio-baja");
                const prioridadNormalizada = (actividad.prioridad || "").toLowerCase();
                if (prioridadNormalizada === "alta") {
                    celdaPrioridad.classList.add("prio-alta");
                } else if (prioridadNormalizada === "media") {
                    celdaPrioridad.classList.add("prio-media");
                } else if (prioridadNormalizada === "baja") {
                    celdaPrioridad.classList.add("prio-baja");
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

            // Checkbox de completada
            const checkboxCompletada = fila.querySelector(".check-completada");
            if (checkboxCompletada) {
                checkboxCompletada.checked = actividad.completada === true;
                checkboxCompletada.addEventListener("change", function () {
                    cambiarEstadoCompletada(actividad.id, checkboxCompletada.checked);
                });
            }

            // Botón eliminar
            const botonEliminar = fila.querySelector(".btn-eliminar");
            if (botonEliminar) {
                botonEliminar.addEventListener("click", function () {
                    eliminarActividad(actividad.id);
                });
            }

            // Botón editar (opcional) - queda como TODO
            const botonEditar = fila.querySelector(".btn-editar");
            if (botonEditar) {
                botonEditar.addEventListener("click", function () {
                    // TODO: implementar edición con modal (no requerido en esta versión)
                    // console.log("Editar actividad", actividad.id);
                });
            }

            // Marcar estilo de actividad completada
            if (actividad.completada) {
                fila.classList.add("completada");
            } else {
                fila.classList.remove("completada");
            }

            tablaBody.appendChild(clon);
        });
    }

    // Calcula y muestra estadísticas
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

    // Cambia estado de completada de una actividad
    function cambiarEstadoCompletada(idActividad, estaCompletada) {
        const actividad = actividades.find(function (act) {
            return act.id === idActividad;
        });

        if (!actividad) return;

        actividad.completada = !!estaCompletada;

        renderizarTabla();
        actualizarEstadisticas();
    }

    // Elimina una actividad del array
    function eliminarActividad(idActividad) {
        actividades = actividades.filter(function (act) {
            return act.id !== idActividad;
        });

        renderizarTabla();
        actualizarEstadisticas();
    }

    // Maneja el clic en un botón de filtro
    function manejarClickFiltro(boton) {
        const nuevoFiltro = boton.dataset.filter || "todas";
        filtroActivo = nuevoFiltro;

        // Quitar clase activa de todos y marcar solo el actual
        botonesFiltro.forEach(function (btn) {
            btn.classList.remove("is-active");
        });
        boton.classList.add("is-active");

        renderizarTabla();
    }

    // Maneja la búsqueda por texto
    function manejarBusquedaTexto(evento) {
        textoBusqueda = evento.target.value.toLowerCase().trim();
        renderizarTabla();
    }

    // Maneja el cambio de criterio de orden
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
        // Tomar el valor inicial como criterio de orden
        criterioOrden = selectOrden.value || "fecha";
    }

    // Estado inicial de la interfaz
    renderizarTabla();
    actualizarEstadisticas();
});
