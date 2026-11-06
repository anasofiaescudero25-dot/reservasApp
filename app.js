'use strict';

const CLAVE = 'valsofjuan-reservas-v1';
const porId = (id) => document.getElementById(id);
const formulario = porId('form-reserva');
const campoFecha = porId('fecha');
const lista = porId('lista');
let reservas = [];
let confirmacion = '';

// Actualizar fecha mínima seleccionable al día de hoy
function actualizarFechaMinima() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  campoFecha.min = `${anio}-${mes}-${dia}`;
  return campoFecha.min;
}

actualizarFechaMinima();
campoFecha.addEventListener('focus', actualizarFechaMinima);
window.addEventListener('focus', actualizarFechaMinima);

// Cargar reservas desde localStorage de forma segura
try {
  const guardadas = JSON.parse(localStorage.getItem(CLAVE) || '[]');
  if (Array.isArray(guardadas)) reservas = guardadas;
} catch {
  mostrarAlertaError('No se pudieron leer las reservas guardadas.');
}

// Validación de solapamiento de horarios
function seCruzan(a, b) {
  return a.recurso === b.recurso && a.fecha === b.fecha &&
    a.inicio < b.fin && b.inicio < a.fin;
}

// Mostrar alertas de error estructuradas
function mostrarAlertaError(mensaje) {
  const errorEl = porId('error');
  if (errorEl) {
    errorEl.textContent = mensaje;
    errorEl.classList.remove('d-none');
  }
}

function limpiarAlertaError() {
  const errorEl = porId('error');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.add('d-none');
  }
}

// Crear tarjeta visual para cada reserva con opción de eliminar
function crearTarjeta(reserva, index) {
  const item = document.createElement('li');
  item.className = 'col-12 col-md-6';
  
  const tarjeta = document.createElement('div');
  tarjeta.className = 'card border-0 shadow-sm p-4 h-100 position-relative';
  
  const contenido = document.createElement('div');
  contenido.className = 'd-flex flex-column justify-content-between h-100';

  const cabecera = document.createElement('div');
  const titulo = document.createElement('h3');
  titulo.className = 'h5 fw-bold text-dark mb-1';
  titulo.textContent = reserva.recurso;

  const fechaBadge = document.createElement('span');
  fechaBadge.className = 'badge bg-primary-subtle text-primary mb-3 fw-medium';
  fechaBadge.textContent = `📅 ${reserva.fecha}`;

  cabecera.append(titulo, fechaBadge);

  const detalle = document.createElement('p');
  detalle.className = 'text-muted mb-3 small';
  detalle.innerHTML = `<strong>Horario reservado:</strong><br>🕒 ${reserva.inicio} hrs a ${reserva.fin} hrs`;

  // Botón para eliminar reserva individual
  const btnEliminar = document.createElement('button');
  btnEliminar.className = 'btn btn-outline-danger btn-sm mt-auto align-self-start';
  btnEliminar.type = 'button';
  btnEliminar.textContent = 'Cancelar reserva';
  btnEliminar.addEventListener('click', () => eliminarReserva(index));

  contenido.append(cabecera, detalle, btnEliminar);
  tarjeta.append(contenido);
  item.append(tarjeta);
  
  return item;
}

// Función para eliminar una reserva específica
function eliminarReserva(index) {
  reservas.splice(index, 1);
  try {
    localStorage.setItem(CLAVE, JSON.stringify(reservas));
    confirmacion = 'La reserva ha sido cancelada exitosamente.';
    mostrarPantalla(false);
  } catch {
    mostrarAlertaError('No se pudo actualizar el almacenamiento.');
  }
}

// Control de vistas (Nueva reserva vs Mis reservas según hash de URL)
function mostrarPantalla(moverFoco = false) {
  const verMisReservas = location.hash === '#mis';
  
  const seccionNueva = porId('nueva');
  const seccionMis = porId('mis');
  
  if (seccionNueva) seccionNueva.hidden = verMisReservas;
  if (seccionMis) seccionMis.hidden = !verMisReservas;

  if (verMisReservas) {
    lista.replaceChildren(...reservas.map((res, i) => crearTarjeta(res, i)));
    
    const vacioEl = porId('vacio');
    if (vacioEl) vacioEl.hidden = reservas.length > 0;
    
    const confirmacionEl = porId('confirmacion');
    if (confirmacionEl) {
      if (confirmacion) {
        confirmacionEl.textContent = confirmacion;
        confirmacionEl.classList.remove('d-none');
      } else {
        confirmacionEl.classList.add('d-none');
      }
    }
  }
  
  if (moverFoco) {
    const elementoFoco = porId(verMisReservas ? 'titulo-mis' : 'titulo-nueva');
    if (elementoFoco) elementoFoco.focus();
  }
}

// Manejo del formulario de envío de nueva reserva
formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  limpiarAlertaError();

  const nueva = {
    recurso: porId('recurso').value,
    fecha: porId('fecha').value,
    inicio: porId('inicio').value,
    fin: porId('fin').value
  };

  if (nueva.fecha < actualizarFechaMinima()) {
    mostrarAlertaError('La fecha no puede ser anterior a hoy.');
    campoFecha.focus();
    return;
  }
  
  if (nueva.fin <= nueva.inicio) {
    mostrarAlertaError('La hora final debe ser posterior a la inicial.');
    porId('fin').focus();
    return;
  }
  
  if (reservas.some((reserva) => seCruzan(reserva, nueva))) {
    mostrarAlertaError('Ese horario se cruza con otra reserva existente en el mismo espacio. Elige otro intervalo.');
    porId('inicio').focus();
    return;
  }

  const actualizadas = [...reservas, nueva];
  try {
    localStorage.setItem(CLAVE, JSON.stringify(actualizadas));
  } catch {
    mostrarAlertaError('No se pudo guardar. Revisa el almacenamiento del navegador.');
    return;
  }

  reservas = actualizadas;
  confirmacion = `¡Reserva confirmada con éxito para ${nueva.recurso} (${nueva.inicio} - ${nueva.fin})!`;
  formulario.reset();
  location.hash = '#mis';
});

window.addEventListener('hashchange', () => {
  mostrarPantalla(true);
  if (location.hash !== '#mis') confirmacion = '';
});

// Inicialización de la vista por defecto
mostrarPantalla();