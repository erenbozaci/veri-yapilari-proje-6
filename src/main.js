import { Game } from "./core/game.js";

const canvas = document.getElementById("gameCanvas");
const game = new Game(canvas);

game.start();