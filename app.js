'use strict';

const CLAVE = 'reservas-sesion7-v1';
const porId = (id) => document.getElementById(id);
const formulario = porId('form-reserva');
const campoFecha = porId('fecha');
const lista = porId('lista');
let reservas = [];
let confirmacion = '';

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

try {
  const guardadas = JSON.parse(localStorage.getItem(CLAVE) || '[]');
  if (Array.isArray(guardadas)) reservas = guardadas;
} catch {
  porId('error').textContent = 'No se pudieron leer las reservas guardadas.';
}

function seCruzan(a, b) {
  return a.recurso === b.recurso && a.fecha === b.fecha &&
    a.inicio < b.fin && b.inicio < a.fin;
}

function crearTarjeta(reserva) {
  const item = document.createElement('li');
  item.className = 'col-12 col-md-6';
  const tarjeta = document.createElement('div');
  tarjeta.className = 'panel p-3 h-100';
  const titulo = document.createElement('h2');
  titulo.className = 'h5';
  titulo.textContent = reserva.recurso;
  const detalle = document.createElement('p');
  detalle.className = 'mb-0';
  detalle.textContent = reserva.fecha + ' · ' + reserva.inicio + ' a ' + reserva.fin;
  tarjeta.append(titulo, detalle);
  item.append(tarjeta);
  return item;
}

function mostrarPantalla(moverFoco = false) {
  const verMisReservas = location.hash === '#mis';
  porId('nueva').hidden = verMisReservas;
  porId('mis').hidden = !verMisReservas;
  if (verMisReservas) {
    lista.replaceChildren(...reservas.map(crearTarjeta));
    porId('vacio').hidden = reservas.length > 0;
    porId('confirmacion').textContent = confirmacion;
  }
  if (moverFoco) porId(verMisReservas ? 'titulo-mis' : 'titulo-nueva').focus();
}

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const nueva = {
    recurso: porId('recurso').value,
    fecha: porId('fecha').value,
    inicio: porId('inicio').value,
    fin: porId('fin').value
  };
  const error = porId('error');
  error.textContent = '';

  if (nueva.fecha < actualizarFechaMinima()) {
    error.textContent = 'La fecha no puede ser anterior a hoy.';
    campoFecha.focus();
    return;
  }
  if (nueva.fin <= nueva.inicio) {
    error.textContent = 'La hora final debe ser posterior a la inicial.';
    porId('fin').focus();
    return;
  }
  if (reservas.some((reserva) => seCruzan(reserva, nueva))) {
    error.textContent = 'Ese horario se cruza con otra reserva. Elige otro intervalo.';
    porId('inicio').focus();
    return;
  }

  const actualizadas = [...reservas, nueva];
  try {
    localStorage.setItem(CLAVE, JSON.stringify(actualizadas));
  } catch {
    error.textContent = 'No se pudo guardar. Revisa el almacenamiento del navegador.';
    return;
  }
  reservas = actualizadas;
  confirmacion = 'Reserva guardada: ' + nueva.recurso + ', ' + nueva.inicio + ' a ' + nueva.fin + '.';
  formulario.reset();
  location.hash = '#mis';
});

window.addEventListener('hashchange', () => {
  mostrarPantalla(true);
  if (location.hash !== '#mis') confirmacion = '';
});
mostrarPantalla();
