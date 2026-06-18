import { PixelPlatformer } from './game.js';

const screens = document.querySelectorAll('.screen');
const canvas = document.querySelector('#gameCanvas');
const game = new PixelPlatformer(canvas, {
  stars: document.querySelector('[data-stars]'),
  time: document.querySelector('[data-time]'),
  message: document.querySelector('[data-message]')
});

function showScreen(id) {
  screens.forEach((screen) => screen.classList.toggle('is-active', screen.id === id));
  if (id !== 'game') game.stop();
}

document.querySelectorAll('[data-open-section]').forEach((button) => {
  button.addEventListener('click', () => showScreen(button.dataset.openSection));
});

document.querySelector('[data-start-game]').addEventListener('click', () => {
  showScreen('game');
  game.reset();
  game.start();
});

document.querySelector('[data-restart-game]').addEventListener('click', () => {
  game.reset();
  game.start();
});
